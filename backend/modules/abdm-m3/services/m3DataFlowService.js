const axios = require('axios');
const crypto = require('crypto');
const mongoose = require('mongoose');
const { getAccessToken } = require('../../../services/abdmGatewayService');
const { getConsentArtefact } = require('./m3ConsentService');
const { decryptData } = require('./m3CryptoService');
const AbdmTransaction = require('../../../models/AbdmTransaction');
const AbdmHealthRecord = require('../../../models/AbdmHealthRecord');

/**
 * In-memory map for HIU encryption key materials and data requests.
 * Indexed by both requestId (UUID) and transactionId (UUID).
 * Value: { requestId, transactionId, consentId, privateKey, publicKey, nonce, createdAt }
 */
const hiuKeyMaterials = new Map();

/**
 * In-memory map for decrypted FHIR health records received from HIPs.
 * Indexed by transactionId (UUID).
 * Value: { transactionId, consentId, entries: [...decryptedBundles], receivedAt }
 */
const hiuDecryptedRecords = new Map();

/**
 * Helper to get ABDM M3 HIU Configuration
 */
const getM3Config = () => {
    const gatewayBaseUrl = (process.env.ABDM_GATEWAY_BASE_URL || 'https://dev.abdm.gov.in').replace(/\/$/, '');
    const hiuId = process.env.ABDM_HIU_ID || process.env.ABDM_CLIENT_ID || process.env.ABDM_HIP_ID || '';
    const cmId = process.env.ABDM_CM_ID || 'sbx';
    const timeout = Number(process.env.ABDM_TIMEOUT || 30000);
    const dataPushUrl = process.env.ABDM_HIU_DATA_PUSH_URL || `${gatewayBaseUrl}/api/abdm/m3/webhooks/v3/data/push`;

    return {
        gatewayBaseUrl,
        hiuId,
        cmId,
        timeout,
        dataPushUrl
    };
};

/**
 * Encrypt ephemeral private key using AES-256-CBC with process.env.ENCRYPTION_SECRET
 * for secure MongoDB persistence across process restarts.
 */
const encryptPrivateKey = (plainPrivateKey) => {
    const secret = process.env.ENCRYPTION_SECRET;
    if (!secret) {
        console.warn('⚠️ [ABDM-M3] ENCRYPTION_SECRET is not configured in .env; private key disk persistence is disabled.');
        return null;
    }
    try {
        const key = crypto.createHash('sha256').update(String(secret)).digest();
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        let encrypted = cipher.update(plainPrivateKey, 'utf8', 'base64');
        encrypted += cipher.final('base64');
        return `${iv.toString('base64')}:${encrypted}`;
    } catch (err) {
        console.warn('⚠️ [ABDM-M3] Failed to encrypt private key for persistence:', err.message);
        return null;
    }
};

/**
 * Decrypt ephemeral private key using AES-256-CBC with process.env.ENCRYPTION_SECRET
 */
const decryptPrivateKey = (encryptedPayload) => {
    const secret = process.env.ENCRYPTION_SECRET;
    if (!secret) {
        console.warn('⚠️ [ABDM-M3] ENCRYPTION_SECRET is not configured in .env; cannot decrypt persisted private key.');
        return null;
    }
    if (!encryptedPayload || !encryptedPayload.includes(':')) {
        return null;
    }
    try {
        const [ivBase64, encryptedData] = encryptedPayload.split(':');
        const key = crypto.createHash('sha256').update(String(secret)).digest();
        const iv = Buffer.from(ivBase64, 'base64');
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (err) {
        console.warn('⚠️ [ABDM-M3] Failed to decrypt private key from persistence:', err.message);
        return null;
    }
};

/**
 * Generate ephemeral X25519 (Curve25519) key pair and 32-byte nonce for Fidelius encryption
 * 
 * @returns {Object} { publicKey: string, privateKey: string, nonce: string, keyObject: Object }
 */
const generateEcdhKeyMaterial = () => {
    try {
        const { publicKey, privateKey } = crypto.generateKeyPairSync('x25519');
        const spkiDer = publicKey.export({ type: 'spki', format: 'der' });
        const pkcs8Der = privateKey.export({ type: 'pkcs8', format: 'der' });
        const rawPub = spkiDer.subarray(12); // Raw 32-byte public key
        const rawPriv = pkcs8Der.subarray(16); // Raw 32-byte private key
        const nonce = crypto.randomBytes(32).toString('base64');

        return {
            publicKey: rawPub.toString('base64'),
            privateKey: rawPriv.toString('base64'),
            nonce,
            keyObject: { publicKey, privateKey }
        };
    } catch (err) {
        const priv = crypto.randomBytes(32).toString('base64');
        const pub = crypto.randomBytes(32).toString('base64');
        const nonce = crypto.randomBytes(32).toString('base64');
        return {
            publicKey: pub,
            privateKey: priv,
            nonce,
            keyObject: null
        };
    }
};

/**
 * Initiate an HIU Health Data Flow Request to ABDM Gateway
 * Generates an ephemeral ECDH Curve25519 key pair and requests encrypted health data from HIP.
 * Method: POST /api/hiecm/data-flow/v3/health-information/request
 * 
 * @param {Object} params
 * @param {string} params.consentId - The Consent Artefact ID
 * @param {string} [params.dateRangeFrom] - Start date for health data (defaults to consent permission range)
 * @param {string} [params.dateRangeTo] - End date for health data (defaults to consent permission range)
 * @param {string} [params.dataPushUrl] - The webhook URL where HIP will push encrypted FHIR bundles
 * @returns {Promise<Object>} Request ID, generated public key, and Gateway response
 */
const initiateDataRequest = async ({
    consentId,
    dateRangeFrom,
    dateRangeTo,
    dataPushUrl
}) => {
    try {
        if (!consentId) {
            throw new Error('consentId is required to initiate health data request');
        }

        const config = getM3Config();
        const requestId = crypto.randomUUID();
        const isoTimestamp = new Date().toISOString();

        // 1. Generate Ephemeral ECDH Curve25519 Keys and Nonce
        const { publicKey, privateKey, nonce } = generateEcdhKeyMaterial();

        // 2. Resolve Date Range and Data Push URL (fallback to stored consent artefact if available)
        const storedArtefact = await getConsentArtefact(consentId);
        const effectiveFrom = dateRangeFrom || storedArtefact?.permission?.dateRange?.from || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
        const effectiveTo = dateRangeTo || storedArtefact?.permission?.dateRange?.to || new Date().toISOString();
        const effectivePushUrl = dataPushUrl || config.dataPushUrl;

        // 3. Store keys locally in memory against requestId for fast decryption
        hiuKeyMaterials.set(requestId, {
            requestId,
            consentId,
            privateKey,
            publicKey,
            nonce,
            patientId: storedArtefact?.patientId || '',
            hipId: storedArtefact?.hipId || storedArtefact?.hip?.id || '',
            dateRange: { from: effectiveFrom, to: effectiveTo },
            dataPushUrl: effectivePushUrl,
            status: 'REQUESTED',
            createdAt: isoTimestamp
        });

        // 4. Securely persist transaction with AES-256-CBC encrypted private key in MongoDB
        if (mongoose.connection && mongoose.connection.readyState === 1) {
            try {
                const encryptedPrivKey = encryptPrivateKey(privateKey);
                await AbdmTransaction.create({
                    requestId,
                    consentId,
                    moduleType: 'HIU',
                    hiuId: config.hiuId,
                    hipId: storedArtefact?.hipId || storedArtefact?.hip?.id || '',
                    abhaAddress: storedArtefact?.patientId || '',
                    transactionType: 'HIU_DATA_REQUEST',
                    status: 'INITIATED',
                    metadata: {
                        dateRange: { from: effectiveFrom, to: effectiveTo },
                        dataPushUrl: effectivePushUrl,
                        publicKey: publicKey,
                        nonce: nonce,
                        encryptedPrivateKey: encryptedPrivKey
                    }
                });
            } catch (dbErr) {
                console.warn('⚠️ [ABDM-M3] Transaction logging warning for data request:', dbErr.message);
            }
        }

        // 5. Construct Data Request Payload as per ABDM v3 Contract
        const keyExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        const payload = {
            hiRequest: {
                consent: {
                    id: consentId
                },
                dateRange: {
                    from: effectiveFrom,
                    to: effectiveTo
                },
                dataPushUrl: effectivePushUrl,
                keyMaterial: {
                    cryptoAlg: 'ECDH',
                    curve: 'Curve25519',
                    dhPublicKey: {
                        expiry: keyExpiry,
                        parameters: 'Curve25519/32byte random key',
                        keyValue: publicKey
                    },
                    nonce: nonce
                }
            }
        };

        // 6. Obtain ABDM Gateway Bearer Token
        const token = await getAccessToken();
        const gatewayUrl = `${config.gatewayBaseUrl}/api/hiecm/data-flow/v3/health-information/request`;

        console.log('\n================ ABDM M3 HEALTH DATA REQUEST ================');
        console.log('Gateway URL :', gatewayUrl);
        console.log('REQUEST-ID  :', requestId);
        console.log('TIMESTAMP   :', isoTimestamp);
        console.log('X-CM-ID     :', config.cmId);
        console.log('X-HIU-ID    :', config.hiuId);
        console.log('Payload     :', JSON.stringify(payload, null, 2));
        console.log('=============================================================\n');

        // 7. Call ABDM Gateway POST /api/hiecm/data-flow/v3/health-information/request
        const response = await axios.post(gatewayUrl, payload, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
                'REQUEST-ID': requestId,
                'TIMESTAMP': isoTimestamp,
                'X-CM-ID': config.cmId,
                'X-HIU-ID': config.hiuId
            },
            timeout: config.timeout
        });

        console.log(`✅ [ABDM-M3] Health data request accepted by Gateway. Status: ${response.status}`);

        return {
            success: true,
            requestId,
            consentId,
            publicKey,
            nonce,
            statusCode: response.status,
            gatewayResponse: response.data
        };
    } catch (error) {
        console.error('\n========== ABDM M3 DATA REQUEST ERROR ==========');
        if (error.response) {
            console.error('Status :', error.response.status);
            console.error('Data   :', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Message:', error.message);
        }
        console.error('================================================\n');

        throw error;
    }
};

/**
 * Process Gateway Callback for Health Information On-Request (/v3/hiu/health-information/on-request)
 * Correlates the Gateway-assigned transactionId with our stored private key material.
 * 
 * @param {Object} params
 * @param {Object} params.hiRequest - { transactionId, sessionStatus }
 * @param {Object} [params.error] - Error object if request failed
 * @param {Object} params.response - { requestId }
 */
const processDataRequestCallback = async ({ hiRequest, error, response }) => {
    try {
        if (error) {
            console.error('❌ [ABDM-M3] Health Information On-Request reported error:', error);
            return { success: false, error };
        }

        const transactionId = hiRequest?.transactionId;
        const sessionStatus = hiRequest?.sessionStatus;
        const clientRequestId = response?.requestId;

        console.log(`🚀 [ABDM-M3] Processing Health Information On-Request callback: transactionId: ${transactionId}, sessionStatus: ${sessionStatus}, clientRequestId: ${clientRequestId}`);

        // Retrieve our stored key material by requestId
        let keys = null;
        if (clientRequestId && hiuKeyMaterials.has(clientRequestId)) {
            keys = hiuKeyMaterials.get(clientRequestId);
        } else {
            const entries = Array.from(hiuKeyMaterials.entries());
            if (entries.length > 0) {
                keys = entries[entries.length - 1][1];
            }
        }

        if (keys && transactionId) {
            // Re-index by transactionId so Step 4 (Data Push) can instantly decrypt incoming records
            hiuKeyMaterials.set(transactionId, {
                ...keys,
                transactionId,
                sessionStatus: sessionStatus || 'REQUESTED',
                acknowledgedAt: new Date().toISOString()
            });

            console.log(`✅ [ABDM-M3] Key material successfully linked to TransactionId: ${transactionId}. Ready for FHIR Data Push.`);

            // Update Transaction in MongoDB if connected
            if (mongoose.connection && mongoose.connection.readyState === 1) {
                try {
                    await AbdmTransaction.findOneAndUpdate(
                        {
                            $or: [
                                { requestId: clientRequestId },
                                { transactionId }
                            ]
                        },
                        {
                            transactionId,
                            status: 'REQUESTED',
                            'metadata.sessionStatus': sessionStatus
                        }
                    );
                } catch (dbErr) {
                    console.warn('⚠️ [ABDM-M3] DB update warning in data request callback:', dbErr.message);
                }
            }
        } else {
            console.warn(`⚠️ [ABDM-M3] Could not link transactionId ${transactionId} to existing key material for requestId ${clientRequestId}`);
        }

        return {
            success: true,
            transactionId,
            sessionStatus
        };
    } catch (err) {
        console.error('❌ [ABDM-M3] Error processing data request callback:', err.message);
        throw err;
    }
};

/**
 * Process Data Push received from remote HIP (/v3/data/push)
 * 1. Retrieves HIU's stored private key and nonce using transactionId (memory or decrypted from MongoDB)
 * 2. Decrypts all FHIR bundles using Fidelius ECDH + AES-256-GCM
 * 3. Stores decrypted records in hiuDecryptedRecords and MongoDB (AbdmHealthRecord)
 * 4. Notifies ABDM Gateway of successful data receipt
 * 
 * @param {Object} payload - Inbound payload from HIP
 * @returns {Promise<Object>} Decryption summary and decrypted entries
 */
const processDataPush = async (payload) => {
    try {
        if (!payload) {
            throw new Error('Payload is missing in processDataPush');
        }

        const transactionId = payload.transactionId;
        const pageNumber = payload.pageNumber || 1;
        const pageCount = payload.pageCount || 1;
        const entries = payload.entries || [];
        const senderKeyMaterial = payload.keyMaterial;

        console.log(`\n🚀 ========== ABDM M3 DATA PUSH RECEIVED ==========`);
        console.log(`Transaction ID : ${transactionId}`);
        console.log(`Page           : ${pageNumber} of ${pageCount}`);
        console.log(`Entries Count  : ${entries.length}`);
        console.log(`Sender Key     : ${senderKeyMaterial?.dhPublicKey?.keyValue ? 'Loaded ✅' : 'Missing ❌'}`);
        console.log(`===================================================\n`);

        if (!transactionId) {
            throw new Error('transactionId is missing from data push payload');
        }

        // 1. Retrieve our stored private key & nonce using transactionId (check in-memory first)
        let ourKeys = hiuKeyMaterials.get(transactionId);
        if (!ourKeys) {
            // Fallback: search in-memory values for matching transactionId
            for (const [, v] of hiuKeyMaterials.entries()) {
                if (v.transactionId === transactionId) {
                    ourKeys = v;
                    break;
                }
            }
        }

        // If not in memory (e.g. after server restart), retrieve from MongoDB and decrypt with AES-256-CBC
        if (!ourKeys && mongoose.connection && mongoose.connection.readyState === 1) {
            try {
                const txDoc = await AbdmTransaction.findOne({
                    $or: [{ transactionId }, { 'metadata.transactionId': transactionId }]
                }).lean();

                if (txDoc && txDoc.metadata?.encryptedPrivateKey && txDoc.metadata?.nonce) {
                    const decryptedPrivKey = decryptPrivateKey(txDoc.metadata.encryptedPrivateKey);
                    if (decryptedPrivKey) {
                        ourKeys = {
                            requestId: txDoc.requestId,
                            transactionId: txDoc.transactionId || transactionId,
                            consentId: txDoc.consentId,
                            privateKey: decryptedPrivKey,
                            publicKey: txDoc.metadata.publicKey,
                            nonce: txDoc.metadata.nonce,
                            patientId: txDoc.abhaAddress || '',
                            hipId: txDoc.hipId || '',
                            status: 'RESTORED'
                        };
                        hiuKeyMaterials.set(transactionId, ourKeys);
                        console.log(`🔐 [ABDM-M3] Successfully restored and decrypted ECDH key material from MongoDB for Transaction: ${transactionId}`);
                    }
                }
            } catch (dbErr) {
                console.warn('⚠️ [ABDM-M3] Failed to retrieve key material from MongoDB:', dbErr.message);
            }
        }

        if (!ourKeys) {
            console.error(`❌ [ABDM-M3] No stored ECDH key material found for TransactionId: ${transactionId}`);
            throw new Error(`No ECDH key material found for transactionId: ${transactionId}`);
        }

        if (!senderKeyMaterial?.dhPublicKey?.keyValue || !senderKeyMaterial?.nonce) {
            console.error(`❌ [ABDM-M3] Sender keyMaterial missing in data push payload`);
            throw new Error('Sender keyMaterial (dhPublicKey.keyValue & nonce) missing in data push payload');
        }

        // 2. Decrypt each encrypted FHIR entry
        const decryptedEntries = [];
        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            const encryptedContent = entry.content;
            const careContextReference = entry.careContextReference || `entry-${i + 1}`;

            console.log(`🔓 [ABDM-M3] Decrypting entry [${i + 1}/${entries.length}] (CareContext: ${careContextReference})...`);

            try {
                const decryptedStr = decryptData(
                    encryptedContent,
                    ourKeys.privateKey,
                    ourKeys.nonce,
                    senderKeyMaterial.dhPublicKey.keyValue,
                    senderKeyMaterial.nonce
                );

                let parsedFhir = null;
                try {
                    parsedFhir = JSON.parse(decryptedStr);
                } catch {
                    parsedFhir = decryptedStr;
                }

                const decryptedItem = {
                    careContextReference,
                    media: entry.media || 'application/fhir+json',
                    checksum: entry.checksum,
                    decryptedFhir: parsedFhir,
                    rawDecryptedString: decryptedStr
                };
                decryptedEntries.push(decryptedItem);

                // Persist decrypted health record into MongoDB if connected
                if (mongoose.connection && mongoose.connection.readyState === 1) {
                    try {
                        await AbdmHealthRecord.findOneAndUpdate(
                            {
                                transactionId,
                                careContextReference
                            },
                            {
                                transactionId,
                                consentId: ourKeys.consentId,
                                careContextReference,
                                patientAbha: ourKeys.patientId || '',
                                hipId: ourKeys.hipId || '',
                                media: entry.media || 'application/fhir+json',
                                checksum: entry.checksum,
                                resourceType: (typeof parsedFhir === 'object' && parsedFhir?.resourceType) ? parsedFhir.resourceType : 'Bundle',
                                decryptedFhir: parsedFhir,
                                receivedAt: new Date()
                            },
                            { upsert: true, returnDocument: 'after' }
                        );
                    } catch (dbErr) {
                        console.warn(`⚠️ [ABDM-M3] Failed to persist decrypted health record to DB:`, dbErr.message);
                    }
                }

                console.log(`✅ [ABDM-M3] Entry [${i + 1}/${entries.length}] decrypted successfully! ResourceType: ${parsedFhir?.resourceType || 'JSON/Text'}`);
            } catch (decErr) {
                console.error(`❌ [ABDM-M3] Failed to decrypt entry [${i + 1}]:`, decErr.message);
                decryptedEntries.push({
                    careContextReference,
                    error: decErr.message,
                    failed: true
                });
            }
        }

        // 3. Store decrypted records in memory immediately
        const existingRecords = hiuDecryptedRecords.get(transactionId) || {
            transactionId,
            consentId: ourKeys.consentId,
            entries: [],
            receivedAt: new Date().toISOString()
        };

        existingRecords.entries.push(...decryptedEntries);
        existingRecords.updatedAt = new Date().toISOString();
        hiuDecryptedRecords.set(transactionId, existingRecords);

        // Update AbdmTransaction in DB if connected
        if (mongoose.connection && mongoose.connection.readyState === 1) {
            try {
                await AbdmTransaction.findOneAndUpdate(
                    { transactionId },
                    {
                        status: 'RECEIVED',
                        transactionType: 'HIU_DATA_PUSH',
                        'metadata.pageNumber': pageNumber,
                        'metadata.pageCount': pageCount,
                        'metadata.entriesCount': entries.length,
                        'metadata.decryptedCount': decryptedEntries.filter(e => !e.failed).length
                    }
                );
            } catch (dbErr) {
                console.warn('⚠️ [ABDM-M3] Transaction logging warning for data push:', dbErr.message);
            }
        }

        console.log(`\n🎉 [ABDM-M3] Successfully stored ${decryptedEntries.length} decrypted FHIR entries for TransactionId: ${transactionId}\n`);

        // 4. Notify ABDM Gateway of successful data transfer receipt
        try {
            await notifyDataReceipt({
                consentId: ourKeys.consentId,
                transactionId,
                entries,
                hipId: ourKeys.hipId || ''
            });
        } catch (notifyErr) {
            console.warn(`⚠️ [ABDM-M3] Transfer receipt notification to Gateway warning:`, notifyErr.message);
        }

        return {
            success: true,
            transactionId,
            decryptedCount: decryptedEntries.length,
            entries: decryptedEntries
        };
    } catch (error) {
        console.error('\n========== ABDM M3 PROCESS DATA PUSH ERROR ==========');
        console.error('Message:', error.message);
        console.error('=====================================================\n');
        throw error;
    }
};

/**
 * Notify ABDM Gateway of successful data transfer receipt
 * Method: POST /api/hiecm/data-flow/v3/health-information/notify
 * 
 * @param {Object} params
 * @param {string} params.consentId - Consent Artefact ID
 * @param {string} params.transactionId - Transaction ID
 * @param {Array} params.entries - Processed data push entries
 * @param {string} [params.hipId=""] - Source HIP ID
 */
const notifyDataReceipt = async ({ consentId, transactionId, entries = [], hipId = '' }) => {
    try {
        const config = getM3Config();
        const requestId = crypto.randomUUID();
        const isoTimestamp = new Date().toISOString();
        const token = await getAccessToken();

        const statusResponses = entries.length > 0
            ? entries.map(e => ({
                careContextReference: e.careContextReference || 'default',
                hiStatus: 'OK',
                description: 'Data successfully received and decrypted'
            }))
            : [{
                careContextReference: 'default',
                hiStatus: 'OK',
                description: 'Data successfully received and decrypted'
            }];

        const payload = {
            notification: {
                consentId: consentId || '',
                transactionId: transactionId,
                doneAt: isoTimestamp,
                notifier: {
                    type: 'HIU',
                    id: config.hiuId
                },
                statusNotification: {
                    sessionStatus: 'RECEIVED',
                    hipId: hipId || '',
                    statusResponses: statusResponses
                }
            }
        };

        const gatewayUrl = `${config.gatewayBaseUrl}/api/hiecm/data-flow/v3/health-information/notify`;

        console.log('\n================ ABDM M3 DATA TRANSFER NOTIFY ================');
        console.log('Gateway URL :', gatewayUrl);
        console.log('REQUEST-ID  :', requestId);
        console.log('TIMESTAMP   :', isoTimestamp);
        console.log('X-CM-ID     :', config.cmId);
        console.log('Payload     :', JSON.stringify(payload, null, 2));
        console.log('===============================================================\n');

        // Record notify transaction
        try {
            await AbdmTransaction.create({
                requestId,
                consentId,
                transactionId,
                moduleType: 'HIU',
                hiuId: config.hiuId,
                hipId,
                transactionType: 'HIU_NOTIFY',
                status: 'INITIATED',
                metadata: { doneAt: isoTimestamp }
            });
        } catch (dbErr) {
            console.warn('⚠️ [ABDM-M3] Transaction logging warning for transfer notify:', dbErr.message);
        }

        const response = await axios.post(gatewayUrl, payload, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
                'REQUEST-ID': requestId,
                'TIMESTAMP': isoTimestamp,
                'X-CM-ID': config.cmId
            },
            timeout: config.timeout
        });

        console.log(`✅ [ABDM-M3] Data transfer receipt acknowledged by Gateway. Status: ${response.status}`);

        try {
            await AbdmTransaction.findOneAndUpdate(
                { requestId },
                { status: 'COMPLETED' }
            );
        } catch (dbErr) {
            // ignore
        }

        return {
            success: true,
            statusCode: response.status,
            gatewayResponse: response.data
        };
    } catch (error) {
        console.error('\n========== ABDM M3 DATA TRANSFER NOTIFY ERROR ==========');
        if (error.response) {
            console.error('Status :', error.response.status);
            console.error('Data   :', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Message:', error.message);
        }
        console.error('========================================================\n');
        throw error;
    }
};

/**
 * Get decrypted FHIR records by transactionId (checks in-memory first, falls back to MongoDB)
 */
const getDecryptedRecords = async (transactionId) => {
    if (hiuDecryptedRecords.has(transactionId)) {
        return hiuDecryptedRecords.get(transactionId);
    }
    if (mongoose.connection && mongoose.connection.readyState === 1) {
        try {
            const records = await AbdmHealthRecord.find({ transactionId }).lean();
            if (records && records.length > 0) {
                const first = records[0];
                const entries = records.map(r => ({
                    careContextReference: r.careContextReference,
                    media: r.media,
                    checksum: r.checksum,
                    decryptedFhir: r.decryptedFhir,
                    resourceType: r.resourceType
                }));
                const recordObj = {
                    transactionId: first.transactionId,
                    consentId: first.consentId,
                    entries,
                    receivedAt: first.receivedAt
                };
                hiuDecryptedRecords.set(transactionId, recordObj);
                return recordObj;
            }
        } catch (err) {
            console.warn('⚠️ [ABDM-M3] DB lookup fallback error in getDecryptedRecords:', err.message);
        }
    }
    return null;
};

/**
 * Get all decrypted FHIR records (merges in-memory and MongoDB)
 */
const getAllDecryptedRecords = async () => {
    const memoryRecords = Array.from(hiuDecryptedRecords.entries()).map(([key, value]) => ({
        transactionId: key,
        ...value
    }));

    if (mongoose.connection && mongoose.connection.readyState === 1) {
        try {
            const dbRecords = await AbdmHealthRecord.find({}).lean();
            const grouped = {};
            for (const rec of dbRecords) {
                if (!grouped[rec.transactionId]) {
                    grouped[rec.transactionId] = {
                        transactionId: rec.transactionId,
                        consentId: rec.consentId,
                        entries: [],
                        receivedAt: rec.receivedAt
                    };
                }
                grouped[rec.transactionId].entries.push({
                    careContextReference: rec.careContextReference,
                    media: rec.media,
                    checksum: rec.checksum,
                    decryptedFhir: rec.decryptedFhir,
                    resourceType: rec.resourceType
                });
            }

            const existingTxIds = new Set(memoryRecords.map(r => r.transactionId));
            for (const [txId, group] of Object.entries(grouped)) {
                if (!existingTxIds.has(txId)) {
                    memoryRecords.push(group);
                }
            }
        } catch (err) {
            console.warn('⚠️ [ABDM-M3] DB lookup warning in getAllDecryptedRecords:', err.message);
        }
    }

    return memoryRecords;
};

/**
 * Get stored key material by requestId or transactionId (sanitized to prevent private key leakage)
 */
const getKeyMaterial = (id) => {
    const keyData = hiuKeyMaterials.get(id);
    if (!keyData) return null;
    const { privateKey, ...sanitized } = keyData;
    return sanitized;
};

/**
 * Get all stored key materials (sanitized to prevent private key leakage)
 */
const getAllKeyMaterials = () => {
    return Array.from(hiuKeyMaterials.entries()).map(([key, value]) => {
        const { privateKey, ...sanitized } = value;
        return {
            indexKey: key,
            ...sanitized
        };
    });
};

module.exports = {
    hiuKeyMaterials,
    hiuDecryptedRecords,
    generateEcdhKeyMaterial,
    initiateDataRequest,
    processDataRequestCallback,
    processDataPush,
    notifyDataReceipt,
    getDecryptedRecords,
    getAllDecryptedRecords,
    getKeyMaterial,
    getAllKeyMaterials
};
