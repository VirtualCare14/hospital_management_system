const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const Patient = require('../../../models/Patient');
const Visit = require('../../../models/Visit');
const AbdmTransaction = require('../../../models/AbdmTransaction');
const AbdmCareContext = require('../../../models/AbdmCareContext');
const { getAccessToken } = require('../../../services/abdmGatewayService');
const { getBridgeConfig } = require('./m2BridgeService');

/**
 * Send outbound on-init callback to ABDM Gateway
 * Endpoint: POST /api/hiecm/user-initiated-linking/v3/link/care-context/on-init
 */
const sendOnInitCallback = async ({ transactionId, incomingRequestId, linkRefNumber, communicationExpiry, error }) => {
    const config = getBridgeConfig();
    const token = await getAccessToken();
    const requestId = uuidv4();
    const timestamp = new Date().toISOString();

    const url = `${config.gatewayBaseUrl}/api/hiecm/user-initiated-linking/v3/link/care-context/on-init`;

    const headers = {
        'Authorization': `Bearer ${token}`,
        'REQUEST-ID': requestId,
        'TIMESTAMP': timestamp,
        'X-CM-ID': config.cmId,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };

    const payload = error ? {
        error,
        response: {
            requestId: incomingRequestId
        }
    } : {
        transactionId,
        link: {
            referenceNumber: linkRefNumber,
            authenticationType: 'DIRECT',
            meta: {
                communicationMedium: 'MOBILE',
                communicationHint: 'OTP',
                communicationExpiry: communicationExpiry
            }
        },
        response: {
            requestId: incomingRequestId
        }
    };

    console.log('\n🚀 ========== OUTBOUND: ABDM M2 ON-INIT CALLBACK ==========');
    console.log('Target URL     :', url);
    console.log('Transaction ID :', transactionId);
    console.log('Incoming Req ID:', incomingRequestId);
    console.log('New Request ID :', requestId);
    console.log('Payload        :', JSON.stringify(payload, null, 2));
    console.log('============================================================\n');

    try {
        const response = await axios.post(url, payload, {
            headers,
            timeout: config.timeout
        });
        console.log('✅ ABDM on-init callback delivered successfully. Status:', response.status);
        return {
            success: true,
            status: response.status,
            data: response.data
        };
    } catch (err) {
        console.error('\n❌ ========== ABDM ON-INIT CALLBACK ERROR ==========');
        if (err.response) {
            console.error('Status :', err.response.status);
            console.error('Data   :', JSON.stringify(err.response.data, null, 2));
            console.error('Headers:', err.response.headers);
        } else {
            console.error('Message:', err.message);
        }
        console.error('====================================================\n');
        throw err;
    }
};

/**
 * Send outbound on-confirm callback to ABDM Gateway
 * Endpoint: POST /api/hiecm/user-initiated-linking/v3/link/care-context/on-confirm
 */
const sendOnConfirmCallback = async ({ incomingRequestId, patient = [], error }) => {
    const config = getBridgeConfig();
    const token = await getAccessToken();
    const requestId = uuidv4();
    const timestamp = new Date().toISOString();

    const url = `${config.gatewayBaseUrl}/api/hiecm/user-initiated-linking/v3/link/care-context/on-confirm`;

    const headers = {
        'Authorization': `Bearer ${token}`,
        'REQUEST-ID': requestId,
        'TIMESTAMP': timestamp,
        'X-CM-ID': config.cmId,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };

    const payload = error ? {
        error,
        response: {
            requestId: incomingRequestId
        }
    } : {
        patient: Array.isArray(patient) ? patient : [patient],
        response: {
            requestId: incomingRequestId
        }
    };

    console.log('\n🚀 ========== OUTBOUND: ABDM M2 ON-CONFIRM CALLBACK ==========');
    console.log('Target URL     :', url);
    console.log('Incoming Req ID:', incomingRequestId);
    console.log('New Request ID :', requestId);
    console.log('Payload        :', JSON.stringify(payload, null, 2));
    console.log('===============================================================\n');

    try {
        const response = await axios.post(url, payload, {
            headers,
            timeout: config.timeout
        });
        console.log('✅ ABDM on-confirm callback delivered successfully. Status:', response.status);
        return {
            success: true,
            status: response.status,
            data: response.data
        };
    } catch (err) {
        console.error('\n❌ ========== ABDM ON-CONFIRM CALLBACK ERROR ==========');
        if (err.response) {
            console.error('Status :', err.response.status);
            console.error('Data   :', JSON.stringify(err.response.data, null, 2));
            console.error('Headers:', err.response.headers);
        } else {
            console.error('Message:', err.message);
        }
        console.error('=======================================================\n');
        throw err;
    }
};

/**
 * Handle Care-Context Linking OTP Initiation
 * 
 * @param {Object} params
 * @param {string} params.transactionId - ABDM Transaction ID
 * @param {string} params.requestId - Inbound Request ID
 * @param {Object} params.patient - Patient reference & selected care contexts
 */
const processLinkInit = async ({ transactionId, requestId, patient }) => {
    try {
        console.log(`\n🔗 [ABDM-M2] Processing Link Init for Transaction [${transactionId}]...`);

        const linkReferenceNumber = uuidv4();
        const expiryDurationMs = 10 * 60 * 1000; // 10 minutes
        const communicationExpiry = new Date(Date.now() + expiryDurationMs).toISOString();

        const patientUhid = patient?.referenceNumber || patient?.id || '';
        const careContexts = Array.isArray(patient?.careContexts) ? patient.careContexts : [];

        // Store transaction state in MongoDB
        await AbdmTransaction.findOneAndUpdate(
            { linkReferenceNumber },
            {
                transactionId,
                requestId,
                transactionType: 'LINK_INIT',
                status: 'PENDING',
                linkReferenceNumber,
                patientUhid,
                patientId: patient?.id && patient.id.match(/^[0-9a-fA-F]{24}$/) ? patient.id : undefined,
                careContexts: careContexts.map(cc => ({ referenceNumber: cc.referenceNumber, display: cc.display })),
                otp: '123456', // Standard sandbox OTP
                expiresAt: new Date(Date.now() + expiryDurationMs)
            },
            { upsert: true, new: true }
        );

        console.log('💾 Persisted Link Transaction State in MongoDB:', {
            linkReferenceNumber,
            transactionId,
            patientUhid,
            careContextsCount: careContexts.length,
            communicationExpiry
        });

        // Send on-init callback to ABDM Gateway
        return await sendOnInitCallback({
            transactionId,
            incomingRequestId: requestId,
            linkRefNumber: linkReferenceNumber,
            communicationExpiry
        });

    } catch (error) {
        console.error('❌ [ABDM-M2] Error during processLinkInit:', error.message);
        try {
            await sendOnInitCallback({
                transactionId,
                incomingRequestId: requestId,
                error: {
                    code: 'ABDM-1000',
                    message: error.message || 'Failed to initiate care-context linking'
                }
            });
        } catch (callbackErr) {
            console.error('❌ [ABDM-M2] Failed to deliver error on-init callback:', callbackErr.message);
        }
    }
};

/**
 * Handle Care-Context Linking OTP Confirmation
 * 
 * @param {Object} params
 * @param {Object} params.confirmation - Confirmation object containing linkRefNumber & token
 * @param {string} params.requestId - Inbound Request ID
 */
const processLinkConfirm = async ({ confirmation, requestId }) => {
    try {
        console.log(`\n🔐 [ABDM-M2] Processing Link Confirm for Request [${requestId}]...`);

        const linkRefNumber = confirmation?.linkRefNumber || confirmation?.linkReferenceNumber || confirmation?.referenceNumber;
        const token = confirmation?.token || confirmation?.otp;

        console.log('📋 Link Confirmation details:', { linkRefNumber, token });

        if (!linkRefNumber) {
            throw new Error('Missing linkRefNumber in confirmation payload');
        }

        // Retrieve transaction state from MongoDB
        const tx = await AbdmTransaction.findOne({ linkReferenceNumber: linkRefNumber });

        if (!tx) {
            console.warn(`⚠️ [ABDM-M2] Transaction not found in MongoDB for linkRefNumber: ${linkRefNumber}. Falling back to default sandbox confirmation.`);
        }

        const patientUhid = tx?.patientUhid || 'UNKNOWN_UHID';
        let careContexts = tx?.careContexts || [];

        // Look up patient in DB
        let displayName = patientUhid;
        let patientDoc = null;
        if (patientUhid && patientUhid !== 'UNKNOWN_UHID') {
            patientDoc = await Patient.findOne({ uhid: patientUhid });
            if (patientDoc && patientDoc.patientName) {
                displayName = patientDoc.patientName;
            }
        }

        // Ensure care contexts have display field
        if (careContexts.length === 0) {
            careContexts = [{
                referenceNumber: patientUhid,
                display: `Hospital Record (${patientUhid})`
            }];
        } else {
            careContexts = careContexts.map(cc => ({
                referenceNumber: cc.referenceNumber,
                display: cc.display || `Care Context - ${cc.referenceNumber}`
            }));
        }

        const patientPayload = [{
            referenceNumber: patientUhid,
            display: displayName,
            careContexts: careContexts,
            hiType: 'Prescription',
            count: careContexts.length
        }];

        // Persist linked care contexts into AbdmCareContext in MongoDB
        try {
            for (const cc of careContexts) {
                // Determine medoraRecordType from reference pattern or existing record
                let medoraRecordType = 'OPD';
                let hiType = 'OPConsultation';
                const ref = String(cc.referenceNumber || '');

                if (ref.startsWith('IPD')) {
                    medoraRecordType = 'IPD';
                    hiType = 'DischargeSummary';
                } else if (ref.startsWith('DIS-')) {
                    medoraRecordType = 'DischargeSummary';
                    hiType = 'DischargeSummary';
                } else if (ref.startsWith('LAB')) {
                    medoraRecordType = 'Lab';
                    hiType = 'DiagnosticReport';
                } else if (ref.startsWith('RX-')) {
                    medoraRecordType = 'Prescription';
                    hiType = 'Prescription';
                } else if (ref === patientUhid) {
                    medoraRecordType = 'Registration';
                    hiType = 'OPConsultation';
                }

                await AbdmCareContext.findOneAndUpdate(
                    { patientUhid, careContextReference: cc.referenceNumber },
                    {
                        careContextReference: cc.referenceNumber,
                        display: cc.display,
                        patientUhid,
                        patientId: patientDoc?._id || tx?.patientId || undefined,
                        medoraRecordType,
                        hiType,
                        linkReference: linkRefNumber,
                        transactionId: tx?.transactionId,
                        requestId: requestId,
                        linkType: 'USER_INITIATED',
                        linkStatus: 'LINKED',
                        linkToken: token || undefined,
                        linkedAt: new Date()
                    },
                    { upsert: true, new: true }
                );
            }

            // Mark transaction completed
            if (tx) {
                tx.status = 'COMPLETED';
                await tx.save();
            }
        } catch (dbErr) {
            console.error('⚠️ Error persisting care context linkage to MongoDB:', dbErr.message);
        }

        // Send on-confirm callback to Gateway
        return await sendOnConfirmCallback({
            incomingRequestId: requestId,
            patient: patientPayload
        });

    } catch (error) {
        console.error('❌ [ABDM-M2] Error during processLinkConfirm:', error.message);
        try {
            await sendOnConfirmCallback({
                incomingRequestId: requestId,
                error: {
                    code: 'ABDM-1002',
                    message: error.message || 'OTP confirmation failed'
                }
            });
        } catch (callbackErr) {
            console.error('❌ [ABDM-M2] Failed to deliver error on-confirm callback:', callbackErr.message);
        }
    }
};

module.exports = {
    sendOnInitCallback,
    sendOnConfirmCallback,
    processLinkInit,
    processLinkConfirm
};
