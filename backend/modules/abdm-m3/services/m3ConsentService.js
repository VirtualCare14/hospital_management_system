const axios = require('axios');
const crypto = require('crypto');
const mongoose = require('mongoose');
const { getAccessToken } = require('../../../services/abdmGatewayService');
const AbdmConsent = require('../../../models/AbdmConsent');
const AbdmTransaction = require('../../../models/AbdmTransaction');

/**
 * In-memory map to track outgoing HIU consent requests and their lifecycle states.
 * Key: requestId (UUID) or consentRequestId
 * Value: { patientId, consentRequestId, status, details, initiatedAt, updatedAt }
 */
const hiuConsentState = new Map();

/**
 * In-memory map to track fetched HIU Consent Artefacts.
 * Key: consentId (UUID)
 * Value: consentDetail object (patient, hip, hiu, hiTypes, permission, signature, etc.)
 */
const hiuConsentArtefacts = new Map();

/**
 * Helper to get ABDM M3 HIU Configuration
 */
const getM3Config = () => {
    const gatewayBaseUrl = (process.env.ABDM_GATEWAY_BASE_URL || 'https://dev.abdm.gov.in').replace(/\/$/, '');
    const hiuId = process.env.ABDM_HIU_ID || process.env.ABDM_CLIENT_ID || process.env.ABDM_HIP_ID || '';
    const cmId = process.env.ABDM_CM_ID || 'sbx';
    const timeout = Number(process.env.ABDM_TIMEOUT || 30000);

    if (!hiuId) {
        console.warn('⚠️ [ABDM-M3] ABDM_HIU_ID / ABDM_CLIENT_ID is not configured in .env');
    }

    return {
        gatewayBaseUrl,
        hiuId,
        cmId,
        timeout
    };
};

/**
 * Initiate an HIU Consent Request to ABDM Gateway
 * Allows a Medora360 doctor to request a patient's historical records from the ABDM network.
 * 
 * @param {Object} params
 * @param {string} params.patientId - ABHA ID / Address (e.g. "patient@sbx")
 * @param {string} [params.purposeCode="CAREMGT"] - Purpose code (e.g. CAREMGT, BTG, PUBHLTH)
 * @param {string} [params.purposeText="Care Management"] - Purpose description text
 * @param {Array<string>|string} [params.hiTypes] - Types of health information requested (e.g. ["Prescription", "DiagnosticReport"])
 * @param {string} [params.dateRangeFrom] - ISO string for historical record start date
 * @param {string} [params.dateRangeTo] - ISO string for historical record end date
 * @param {string} [params.dataEraseAt] - ISO string for when HIU will erase the granted data (must be future date)
 * @param {string} [params.requesterName] - Doctor / Caregiver name
 * @param {string} [params.requesterId] - Doctor registration number / identifier
 * @returns {Promise<Object>} Object containing requestId, gatewayResponse, and status
 */
const initiateConsentRequest = async ({
    patientId,
    purposeCode = 'CAREMGT',
    purposeText = 'Care Management',
    hiTypes = ['Prescription', 'DiagnosticReport', 'OPConsultation', 'DischargeSummary'],
    dateRangeFrom,
    dateRangeTo,
    dataEraseAt,
    requesterName = 'Dr. Medora Provider',
    requesterId = 'MH1001'
}) => {
    try {
        if (!patientId) {
            throw new Error('patientId (ABHA address e.g. "user@sbx") is required to initiate consent');
        }

        const config = getM3Config();
        const requestId = crypto.randomUUID();
        const isoTimestamp = new Date().toISOString();

        // Calculate default dates if not provided
        const now = new Date();
        const defaultFrom = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString(); // 1 year ago
        const defaultTo = now.toISOString();
        const defaultErase = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days in future

        const effectiveFrom = dateRangeFrom || defaultFrom;
        const effectiveTo = dateRangeTo || defaultTo;
        const effectiveErase = dataEraseAt || defaultErase;
        const normalizedHiTypes = Array.isArray(hiTypes) ? hiTypes : [hiTypes];

        // 1. Store context in memory
        const memoryState = {
            requestId,
            patientId,
            status: 'INITIATED',
            purposeCode,
            purposeText,
            hiTypes: normalizedHiTypes,
            dateRange: { from: effectiveFrom, to: effectiveTo },
            dataEraseAt: effectiveErase,
            requester: { name: requesterName, id: requesterId },
            initiatedAt: isoTimestamp,
            updatedAt: isoTimestamp
        };
        hiuConsentState.set(requestId, memoryState);

        // 2. Persist in MongoDB (AbdmConsent and AbdmTransaction)
        if (mongoose.connection && mongoose.connection.readyState === 1) {
            try {
                await AbdmConsent.findOneAndUpdate(
                    { requestId },
                    {
                        requestId,
                        patientAbha: patientId,
                        moduleType: 'HIU',
                        hiuId: config.hiuId,
                        status: 'INITIATED',
                        requester: { name: requesterName, id: requesterId },
                        purpose: { code: purposeCode, text: purposeText },
                        permission: {
                            accessMode: 'VIEW',
                            dateRange: { from: effectiveFrom, to: effectiveTo },
                            dataEraseAt: effectiveErase
                        },
                        hiTypes: normalizedHiTypes
                    },
                    { upsert: true, returnDocument: 'after' }
                );

                await AbdmTransaction.create({
                    requestId,
                    moduleType: 'HIU',
                    hiuId: config.hiuId,
                    transactionType: 'HIU_CONSENT_INIT',
                    status: 'INITIATED',
                    abhaAddress: patientId,
                    metadata: {
                        purposeCode,
                        hiTypes: normalizedHiTypes,
                        initiatedAt: isoTimestamp
                    }
                });
            } catch (dbErr) {
                console.warn('⚠️ [ABDM-M3] MongoDB persistence warning during consent init:', dbErr.message);
            }
        }

        // 3. Construct consent request payload as per ABDM v3 API contract
        const payload = {
            consent: {
                purpose: {
                    text: purposeText,
                    code: purposeCode,
                    refUri: 'www.abdm.gov.in'
                },
                patient: {
                    id: patientId
                },
                hiu: {
                    id: config.hiuId
                },
                requester: {
                    name: requesterName,
                    identifier: {
                        type: 'REGNO1',
                        value: requesterId,
                        system: 'https://www.nmc.org.in'
                    }
                },
                hiTypes: normalizedHiTypes,
                permission: {
                    accessMode: 'VIEW',
                    dateRange: {
                        from: effectiveFrom,
                        to: effectiveTo
                    },
                    dataEraseAt: effectiveErase,
                    frequency: {
                        unit: 'HOUR',
                        value: 0,
                        repeats: 0
                    }
                }
            }
        };

        // 4. Obtain ABDM Gateway Bearer Token
        const token = await getAccessToken();
        const gatewayUrl = `${config.gatewayBaseUrl}/api/hiecm/consent/v3/request/init`;

        console.log('\n================ ABDM M3 CONSENT INIT ================');
        console.log('Gateway URL :', gatewayUrl);
        console.log('REQUEST-ID  :', requestId);
        console.log('TIMESTAMP   :', isoTimestamp);
        console.log('X-CM-ID     :', config.cmId);
        console.log('Payload     :', JSON.stringify(payload, null, 2));
        console.log('======================================================\n');

        // 5. Call ABDM Gateway POST /api/hiecm/consent/v3/request/init
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

        console.log(`✅ [ABDM-M3] Consent init request accepted by Gateway. Status: ${response.status}`);

        return {
            success: true,
            requestId,
            status: 'INITIATED',
            statusCode: response.status,
            gatewayResponse: response.data
        };
    } catch (error) {
        console.error('\n========== ABDM M3 CONSENT INIT ERROR ==========');
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
 * Outbound: Check Consent Request Status via ABDM Gateway
 * Method: POST /api/hiecm/consent/v3/request/status
 * 
 * @param {string} consentRequestId - The Consent Request ID returned by Gateway
 * @returns {Promise<Object>} Response from Gateway
 */
const getConsentRequestStatus = async (consentRequestId) => {
    try {
        if (!consentRequestId) {
            throw new Error('consentRequestId is required to check consent request status');
        }

        const config = getM3Config();
        const requestId = crypto.randomUUID();
        const isoTimestamp = new Date().toISOString();
        const token = await getAccessToken();

        const statusUrl = `${config.gatewayBaseUrl}/api/hiecm/consent/v3/request/status`;
        const payload = {
            consentRequestId
        };

        console.log('\n================ ABDM M3 GET CONSENT REQUEST STATUS ================');
        console.log('Gateway URL :', statusUrl);
        console.log('REQUEST-ID  :', requestId);
        console.log('TIMESTAMP   :', isoTimestamp);
        console.log('X-CM-ID     :', config.cmId);
        console.log('X-HIU-ID    :', config.hiuId);
        console.log('Payload     :', JSON.stringify(payload, null, 2));
        console.log('====================================================================\n');

        // Record transaction in DB if connected
        if (mongoose.connection && mongoose.connection.readyState === 1) {
            try {
                await AbdmTransaction.create({
                    requestId,
                    consentRequestId,
                    moduleType: 'HIU',
                    hiuId: config.hiuId,
                    transactionType: 'HIU_CONSENT_STATUS',
                    status: 'INITIATED',
                    metadata: { consentRequestId, requestedAt: isoTimestamp }
                });
            } catch (dbErr) {
                console.warn('⚠️ [ABDM-M3] Failed to log consent status transaction to MongoDB:', dbErr.message);
            }
        }

        const response = await axios.post(statusUrl, payload, {
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

        console.log(`✅ [ABDM-M3] Consent status poll accepted by Gateway for ConsentRequestId: ${consentRequestId}. Status: ${response.status}`);

        return {
            success: true,
            consentRequestId,
            requestId,
            statusCode: response.status,
            gatewayResponse: response.data
        };
    } catch (error) {
        console.error(`\n========== ABDM M3 CONSENT STATUS ERROR (${consentRequestId}) ==========`);
        if (error.response) {
            console.error('Status :', error.response.status);
            console.error('Data   :', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Message:', error.message);
        }
        console.error('========================================================================\n');
        throw error;
    }
};

/**
 * Process Consent Notification from ABDM Gateway (/v3/hiu/consent/request/notify)
 * 1. Updates hiuConsentState map & MongoDB AbdmConsent
 * 2. Acknowledges Gateway via POST /api/hiecm/consent/v3/request/hiu/on-notify
 * 3. If GRANTED, automatically initiates fetchConsentArtefact for all granted artefacts
 * 
 * @param {Object} params
 * @param {Object} params.notification - Notification payload from Gateway
 * @param {string} params.requestId - Incoming request ID from header/body
 */
const processConsentNotification = async ({ notification, requestId }) => {
    try {
        if (!notification) {
            throw new Error('Notification payload is missing in processConsentNotification');
        }

        const config = getM3Config();
        const consentRequestId = notification.consentRequestId;
        const status = notification.status;
        const consentArtefacts = notification.consentArtefacts || [];

        console.log(`🚀 [ABDM-M3] Processing consent notification for consentRequestId: ${consentRequestId}, status: ${status}, artefacts count: ${consentArtefacts.length}`);

        // 1. Update tracking map
        let matchedKey = null;
        for (const [k, v] of hiuConsentState.entries()) {
            if (v.consentRequestId === consentRequestId || k === requestId) {
                matchedKey = k;
                break;
            }
        }

        if (matchedKey) {
            updateConsentState(matchedKey, {
                consentRequestId,
                status,
                consentArtefacts,
                notifiedAt: new Date().toISOString()
            });
        } else {
            hiuConsentState.set(consentRequestId || requestId, {
                consentRequestId,
                status,
                consentArtefacts,
                notifiedAt: new Date().toISOString()
            });
        }

        // 2. Persist updated status in MongoDB (AbdmConsent) if connected
        if (mongoose.connection && mongoose.connection.readyState === 1) {
            try {
                await AbdmConsent.findOneAndUpdate(
                    { $or: [{ consentRequestId }, { requestId }] },
                    {
                        consentRequestId,
                        status: status || 'GRANTED',
                        moduleType: 'HIU',
                        hiuId: config.hiuId
                    },
                    { upsert: false }
                );
            } catch (dbErr) {
                console.warn('⚠️ [ABDM-M3] MongoDB update warning in processConsentNotification:', dbErr.message);
            }
        }

        // 3. Acknowledge Gateway notification via POST /api/hiecm/consent/v3/request/hiu/on-notify
        const ackArtefacts = consentArtefacts.length > 0
            ? consentArtefacts.map(a => ({
                status: 'OK',
                consentId: a.id || a.consentId || consentRequestId
            }))
            : [{
                status: 'OK',
                consentId: consentRequestId
            }];

        const ackPayload = {
            acknowledgement: ackArtefacts,
            response: {
                requestId: requestId || crypto.randomUUID()
            }
        };

        const token = await getAccessToken();
        const ackRequestId = crypto.randomUUID();
        const ackTimestamp = new Date().toISOString();
        const onNotifyUrl = `${config.gatewayBaseUrl}/api/hiecm/consent/v3/request/hiu/on-notify`;

        console.log('\n================ ABDM M3 CONSENT HIU ON-NOTIFY ACK ================');
        console.log('Gateway URL :', onNotifyUrl);
        console.log('REQUEST-ID  :', ackRequestId);
        console.log('TIMESTAMP   :', ackTimestamp);
        console.log('X-CM-ID     :', config.cmId);
        console.log('Payload     :', JSON.stringify(ackPayload, null, 2));
        console.log('====================================================================\n');

        const ackResponse = await axios.post(onNotifyUrl, ackPayload, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
                'REQUEST-ID': ackRequestId,
                'TIMESTAMP': ackTimestamp,
                'X-CM-ID': config.cmId
            },
            timeout: config.timeout
        });

        console.log(`✅ [ABDM-M3] Consent on-notify acknowledgment accepted by Gateway. Status: ${ackResponse.status}`);

        // Record Ack Transaction if connected
        if (mongoose.connection && mongoose.connection.readyState === 1) {
            try {
                await AbdmTransaction.create({
                    requestId: ackRequestId,
                    consentRequestId,
                    moduleType: 'HIU',
                    hiuId: config.hiuId,
                    transactionType: 'CONSENT_NOTIFY',
                    status: 'ACKNOWLEDGED',
                    metadata: {
                        originalRequestId: requestId,
                        consentArtefactsCount: consentArtefacts.length,
                        status
                    }
                });
            } catch (dbErr) {
                console.warn('⚠️ [ABDM-M3] Transaction logging warning for consent notification ack:', dbErr.message);
            }
        }

        // 4. If status is GRANTED, fetch each consent artefact
        if (status === 'GRANTED' && Array.isArray(consentArtefacts)) {
            for (const artefact of consentArtefacts) {
                const consentId = artefact.id || artefact.consentId;
                if (consentId) {
                    console.log(`🚀 [ABDM-M3] Automatically triggering fetch for Consent Artefact: ${consentId}`);
                    await fetchConsentArtefact(consentId);
                }
            }
        }

        return {
            success: true,
            status,
            ackStatusCode: ackResponse.status
        };
    } catch (error) {
        console.error('\n========== ABDM M3 PROCESS NOTIFICATION ERROR ==========');
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
 * Trigger Fetch Consent Artefact from ABDM Gateway
 * Method: POST /api/hiecm/consent/v3/fetch
 * Headers include: X-HIU-ID
 * 
 * @param {string} consentId - The Consent Artefact ID
 * @returns {Promise<Object>} Response from Gateway
 */
const fetchConsentArtefact = async (consentId) => {
    try {
        if (!consentId) {
            throw new Error('consentId is required to fetch consent artefact');
        }

        const config = getM3Config();
        const requestId = crypto.randomUUID();
        const isoTimestamp = new Date().toISOString();
        const token = await getAccessToken();

        const fetchUrl = `${config.gatewayBaseUrl}/api/hiecm/consent/v3/fetch`;
        const payload = {
            consentId
        };

        console.log('\n================ ABDM M3 FETCH CONSENT ARTEFACT ================');
        console.log('Gateway URL :', fetchUrl);
        console.log('REQUEST-ID  :', requestId);
        console.log('TIMESTAMP   :', isoTimestamp);
        console.log('X-CM-ID     :', config.cmId);
        console.log('X-HIU-ID    :', config.hiuId);
        console.log('Payload     :', JSON.stringify(payload, null, 2));
        console.log('=================================================================\n');

        // Record fetch initiation in DB if connected
        if (mongoose.connection && mongoose.connection.readyState === 1) {
            try {
                await AbdmTransaction.create({
                    requestId,
                    consentId,
                    moduleType: 'HIU',
                    hiuId: config.hiuId,
                    transactionType: 'HIU_CONSENT_FETCH',
                    status: 'INITIATED',
                    metadata: { consentId, initiatedAt: isoTimestamp }
                });
            } catch (dbErr) {
                console.warn('⚠️ [ABDM-M3] Transaction logging warning for consent fetch:', dbErr.message);
            }
        }

        const response = await axios.post(fetchUrl, payload, {
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

        console.log(`✅ [ABDM-M3] Consent fetch request accepted by Gateway for ConsentId: ${consentId}. Status: ${response.status}`);

        return {
            success: true,
            consentId,
            requestId,
            statusCode: response.status,
            gatewayResponse: response.data
        };
    } catch (error) {
        console.error(`\n========== ABDM M3 FETCH CONSENT ARTEFACT ERROR (${consentId}) ==========`);
        if (error.response) {
            console.error('Status :', error.response.status);
            console.error('Data   :', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Message:', error.message);
        }
        console.error('=========================================================================\n');

        throw error;
    }
};

/**
 * Process Consent Artefact delivered via /v3/hiu/consent/on-fetch callback
 * Stores the verified consent artefact in memory and MongoDB for subsequent health information data requests.
 * 
 * @param {Object} params
 * @param {Object} params.consent - The delivered consent artefact object
 * @param {string} params.requestId - The incoming request ID
 */
const processConsentFetchCallback = async ({ consent, requestId }) => {
    try {
        if (!consent) {
            throw new Error('consent object is missing in processConsentFetchCallback');
        }

        const status = consent.status;
        const consentDetail = consent.consentDetail;
        const signature = consent.signature;

        if (!consentDetail || !consentDetail.consentId) {
            throw new Error('consentDetail or consentDetail.consentId is missing in consent on-fetch payload');
        }

        const consentId = consentDetail.consentId;

        // 1. Store artefact in memory
        const artefactData = {
            consentId,
            status: status || consentDetail.status || 'GRANTED',
            consentDetail,
            signature: signature || null,
            patientId: consentDetail.patient?.id,
            hipId: consentDetail.hip?.id,
            hiuId: consentDetail.hiu?.id,
            hiTypes: consentDetail.hiTypes,
            permission: consentDetail.permission,
            careContexts: consentDetail.careContexts,
            schemaVersion: consentDetail.schemaVersion,
            consentManager: consentDetail.consentManager,
            fetchedAt: new Date().toISOString()
        };
        hiuConsentArtefacts.set(consentId, artefactData);

        // 2. Persist in MongoDB (AbdmConsent) if connected
        if (mongoose.connection && mongoose.connection.readyState === 1) {
            try {
                await AbdmConsent.findOneAndUpdate(
                    { consentId },
                    {
                        consentId,
                        status: status || consentDetail.status || 'GRANTED',
                        patientAbha: consentDetail.patient?.id,
                        hipId: consentDetail.hip?.id,
                        hiuId: consentDetail.hiu?.id,
                        moduleType: 'HIU',
                        hiTypes: consentDetail.hiTypes || [],
                        permission: consentDetail.permission || {},
                        purpose: consentDetail.purpose || {},
                        requester: consentDetail.requester || {},
                        careContexts: consentDetail.careContexts || [],
                        signature: signature || null,
                        schemaVersion: consentDetail.schemaVersion || null,
                        consentDetail: consentDetail,
                        grantedAt: consentDetail.createdAt ? new Date(consentDetail.createdAt) : new Date(),
                        expiresAt: consentDetail.permission?.dataEraseAt ? new Date(consentDetail.permission.dataEraseAt) : undefined
                    },
                    { upsert: true, returnDocument: 'after' }
                );

                await AbdmTransaction.findOneAndUpdate(
                    { consentId, transactionType: 'HIU_CONSENT_FETCH' },
                    { status: 'COMPLETED' },
                    { sort: { createdAt: -1 } }
                );
            } catch (dbErr) {
                console.warn('⚠️ [ABDM-M3] MongoDB persistence warning during consent fetch callback:', dbErr.message);
            }
        }

        console.log(`\n🎉 ================= ABDM M3 CONSENT ARTEFACT STORED =================`);
        console.log(`Consent ID   : ${consentId}`);
        console.log(`Patient ABHA : ${consentDetail.patient?.id}`);
        console.log(`Source HIP   : ${consentDetail.hip?.id}`);
        console.log(`HI Types     : ${JSON.stringify(consentDetail.hiTypes)}`);
        console.log(`Status       : ${status}`);
        console.log(`Permission   : From ${consentDetail.permission?.dateRange?.from} to ${consentDetail.permission?.dateRange?.to}, EraseAt: ${consentDetail.permission?.dataEraseAt}`);
        console.log(`======================================================================\n`);

        return {
            success: true,
            consentId,
            storedArtefact: hiuConsentArtefacts.get(consentId)
        };
    } catch (error) {
        console.error('\n========== ABDM M3 PROCESS FETCH CALLBACK ERROR ==========');
        console.error('Message:', error.message);
        console.error('==========================================================\n');
        throw error;
    }
};

/**
 * Get a stored consent artefact by consentId (checks in-memory first, falls back to MongoDB)
 */
const getConsentArtefact = async (consentId) => {
    if (hiuConsentArtefacts.has(consentId)) {
        return hiuConsentArtefacts.get(consentId);
    }
    if (mongoose.connection && mongoose.connection.readyState === 1) {
        try {
            const doc = await AbdmConsent.findOne({ consentId }).lean();
            if (doc) {
                const memoryData = {
                    consentId: doc.consentId,
                    status: doc.status,
                    consentDetail: doc.consentDetail || {},
                    signature: doc.signature,
                    patientId: doc.patientAbha,
                    hipId: doc.hipId,
                    hiuId: doc.hiuId,
                    hiTypes: doc.hiTypes,
                    permission: doc.permission,
                    careContexts: doc.careContexts,
                    schemaVersion: doc.schemaVersion,
                    fetchedAt: doc.createdAt
                };
                hiuConsentArtefacts.set(doc.consentId, memoryData);
                return memoryData;
            }
        } catch (err) {
            console.warn('⚠️ [ABDM-M3] DB lookup fallback error in getConsentArtefact:', err.message);
        }
    }
    return null;
};

/**
 * Get all stored consent artefacts (merges in-memory and MongoDB)
 */
const getAllConsentArtefacts = async () => {
    const memoryArtefacts = Array.from(hiuConsentArtefacts.entries()).map(([key, value]) => ({
        consentId: key,
        ...value
    }));

    if (mongoose.connection && mongoose.connection.readyState === 1) {
        try {
            const dbDocs = await AbdmConsent.find({ moduleType: 'HIU', consentId: { $exists: true, $ne: null } }).lean();
            const existingIds = new Set(memoryArtefacts.map(a => a.consentId));
            for (const doc of dbDocs) {
                if (!existingIds.has(doc.consentId)) {
                    memoryArtefacts.push({
                        consentId: doc.consentId,
                        status: doc.status,
                        consentDetail: doc.consentDetail,
                        patientId: doc.patientAbha,
                        hipId: doc.hipId,
                        hiuId: doc.hiuId,
                        hiTypes: doc.hiTypes,
                        permission: doc.permission,
                        careContexts: doc.careContexts,
                        signature: doc.signature,
                        schemaVersion: doc.schemaVersion,
                        fetchedAt: doc.createdAt
                    });
                }
            }
        } catch (err) {
            console.warn('⚠️ [ABDM-M3] DB lookup warning in getAllConsentArtefacts:', err.message);
        }
    }

    return memoryArtefacts;
};

/**
 * Get the current state of a consent request by requestId
 */
const getConsentState = async (requestId) => {
    if (hiuConsentState.has(requestId)) {
        return hiuConsentState.get(requestId);
    }
    if (mongoose.connection && mongoose.connection.readyState === 1) {
        try {
            const doc = await AbdmConsent.findOne({
                $or: [{ requestId }, { consentRequestId: requestId }, { consentId: requestId }]
            }).lean();
            if (doc) {
                return {
                    requestId: doc.requestId,
                    consentRequestId: doc.consentRequestId,
                    consentId: doc.consentId,
                    patientId: doc.patientAbha,
                    status: doc.status,
                    hiTypes: doc.hiTypes,
                    permission: doc.permission,
                    requester: doc.requester,
                    purpose: doc.purpose,
                    initiatedAt: doc.createdAt,
                    updatedAt: doc.updatedAt
                };
            }
        } catch (err) {
            console.warn('⚠️ [ABDM-M3] DB lookup warning in getConsentState:', err.message);
        }
    }
    return null;
};

/**
 * Get all tracked consent requests
 */
const getAllConsentStates = async () => {
    const memoryStates = Array.from(hiuConsentState.entries()).map(([key, value]) => ({
        requestId: key,
        ...value
    }));

    if (mongoose.connection && mongoose.connection.readyState === 1) {
        try {
            const dbDocs = await AbdmConsent.find({ moduleType: 'HIU' }).lean();
            const existingKeys = new Set(memoryStates.map(s => s.requestId || s.consentRequestId));
            for (const doc of dbDocs) {
                const key = doc.requestId || doc.consentRequestId || doc.consentId;
                if (key && !existingKeys.has(key)) {
                    memoryStates.push({
                        requestId: doc.requestId,
                        consentRequestId: doc.consentRequestId,
                        consentId: doc.consentId,
                        patientId: doc.patientAbha,
                        status: doc.status,
                        hiTypes: doc.hiTypes,
                        permission: doc.permission,
                        requester: doc.requester,
                        purpose: doc.purpose,
                        initiatedAt: doc.createdAt,
                        updatedAt: doc.updatedAt
                    });
                }
            }
        } catch (err) {
            console.warn('⚠️ [ABDM-M3] DB lookup warning in getAllConsentStates:', err.message);
        }
    }

    return memoryStates;
};

/**
 * Update state for a given requestId
 */
const updateConsentState = (requestId, patchData) => {
    if (hiuConsentState.has(requestId)) {
        const existing = hiuConsentState.get(requestId);
        hiuConsentState.set(requestId, {
            ...existing,
            ...patchData,
            updatedAt: new Date().toISOString()
        });
        return true;
    }
    return false;
};

module.exports = {
    hiuConsentState,
    hiuConsentArtefacts,
    initiateConsentRequest,
    getConsentRequestStatus,
    processConsentNotification,
    fetchConsentArtefact,
    processConsentFetchCallback,
    getConsentArtefact,
    getAllConsentArtefacts,
    getConsentState,
    getAllConsentStates,
    updateConsentState
};
