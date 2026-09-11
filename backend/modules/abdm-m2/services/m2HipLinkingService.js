const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const Patient = require('../../../models/Patient');
const Visit = require('../../../models/Visit');
const IpdAdmission = require('../../../models/IpdAdmission');
const IpdDischarge = require('../../../models/IpdDischarge');
const LabRequest = require('../../../models/LabRequest');
const Prescription = require('../../../models/Prescription');
const AbdmTransaction = require('../../../models/AbdmTransaction');
const AbdmCareContext = require('../../../models/AbdmCareContext');
const { getAccessToken } = require('../../../services/abdmGatewayService');
const { getBridgeConfig } = require('./m2BridgeService');

/**
 * Helper to normalize gender code for ABDM Gateway (M, F, O)
 */
const toAbdmGenderCode = (genderStr) => {
    if (!genderStr) return 'M';
    const g = String(genderStr).trim().toUpperCase();
    if (g.startsWith('F')) return 'F';
    if (g.startsWith('O')) return 'O';
    return 'M';
};

/**
 * Step 1: Request Link Token for HIP-Initiated Linking
 * Gateway Endpoint: POST /api/hiecm/v3/token/generate-token
 * 
 * @param {Object} params
 * @param {string|number} params.abhaNumber - Patient's 14 digit ABHA Number
 * @param {string} params.abhaAddress - Patient's ABHA Address (e.g. user@sbx)
 * @param {string} params.name - Patient name
 * @param {string} params.gender - Gender
 * @param {number|string} params.yearOfBirth - Birth year
 * @param {string} params.patientUhid - Medora360 Patient UHID
 * @param {string} params.visitRegNumber - Medora360 Visit Registration Number
 */
const requestLinkToken = async ({
    abhaNumber,
    abhaAddress,
    name,
    gender,
    yearOfBirth,
    patientUhid,
    visitRegNumber
}) => {
    try {
        const config = getBridgeConfig();
        const token = await getAccessToken();
        const requestId = uuidv4();
        const timestamp = new Date().toISOString();

        if (!config.hipId) {
            throw new Error('ABDM_HIP_ID is required for HIP-Initiated Linking');
        }

        // Store context in MongoDB so we can resume when the webhook callback arrives
        await AbdmTransaction.findOneAndUpdate(
            { requestId },
            {
                requestId,
                transactionType: 'LINK_TOKEN',
                status: 'PENDING',
                abhaNumber: abhaNumber ? String(abhaNumber) : undefined,
                abhaAddress: abhaAddress ? String(abhaAddress).trim() : undefined,
                patientUhid,
                metadata: {
                    name,
                    gender,
                    yearOfBirth,
                    visitRegNumber
                },
                expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 min expiry
            },
            { upsert: true, new: true }
        );

        const url = `${config.gatewayBaseUrl}/api/hiecm/v3/token/generate-token`;

        const headers = {
            'Authorization': `Bearer ${token}`,
            'REQUEST-ID': requestId,
            'TIMESTAMP': timestamp,
            'X-HIP-ID': config.hipId,
            'X-CM-ID': config.cmId,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        const payload = {
            ...(abhaNumber ? { abhaNumber: isNaN(Number(abhaNumber)) ? String(abhaNumber) : Number(abhaNumber) } : {}),
            ...(abhaAddress ? { abhaAddress: String(abhaAddress).trim() } : {}),
            name: name || 'Patient',
            gender: toAbdmGenderCode(gender),
            yearOfBirth: Number(yearOfBirth) || 1990
        };

        console.log('\n🚀 ========== OUTBOUND: REQUEST LINK TOKEN ==========');
        console.log('Target URL     :', url);
        console.log('Request ID     :', requestId);
        console.log('X-HIP-ID       :', config.hipId);
        console.log('Patient UHID   :', patientUhid);
        console.log('Visit Reg No   :', visitRegNumber);
        console.log('Payload        :', JSON.stringify(payload, null, 2));
        console.log('=====================================================\n');

        const response = await axios.post(url, payload, {
            headers,
            timeout: config.timeout
        });

        console.log('✅ Link Token Request submitted to Gateway. Status:', response.status);
        return {
            success: true,
            status: response.status,
            requestId,
            data: response.data
        };

    } catch (error) {
        console.error('\n❌ ========== REQUEST LINK TOKEN ERROR ==========');
        if (error.response) {
            console.error('Status :', error.response.status);
            console.error('Data   :', JSON.stringify(error.response.data, null, 2));
            console.error('Headers:', error.response.headers);
        } else {
            console.error('Message:', error.message);
        }
        console.error('=================================================\n');

        throw {
            success: false,
            message: error.response?.data?.message || error.message,
            statusCode: error.response?.status || 500,
            details: error.response?.data || null
        };
    }
};

/**
 * Step 3: Link Care Context to Patient using received Link Token
 * Gateway Endpoint: POST /api/hiecm/hip/v3/link/carecontext
 */
const linkCareContextWithToken = async ({
    linkToken,
    abhaNumber,
    abhaAddress,
    patientUhid,
    patientName,
    visitRegNumber,
    careContextDisplay,
    medoraRecordType = 'OPD',
    medoraRecordId,
    transactionId,
    requestId: inboundRequestId
}) => {
    const config = getBridgeConfig();
    const token = await getAccessToken();
    const requestId = uuidv4();
    const timestamp = new Date().toISOString();

    const url = `${config.gatewayBaseUrl}/api/hiecm/hip/v3/link/carecontext`;

    const headers = {
        'Authorization': `Bearer ${token}`,
        'REQUEST-ID': requestId,
        'TIMESTAMP': timestamp,
        'X-HIP-ID': config.hipId,
        'X-LINK-TOKEN': linkToken,
        'X-CM-ID': config.cmId,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };

    const payload = {
        ...(abhaNumber ? { abhaNumber: String(abhaNumber) } : {}),
        abhaAddress: abhaAddress,
        patient: [
            {
                referenceNumber: patientUhid,
                display: patientName || patientUhid,
                careContexts: [
                    {
                        referenceNumber: visitRegNumber,
                        display: careContextDisplay || `Care Record - ${visitRegNumber}`
                    }
                ],
                hiType: 'Prescription',
                count: 1
            }
        ]
    };

    console.log('\n🚀 ========== OUTBOUND: HIP LINK CARE-CONTEXT ==========');
    console.log('Target URL     :', url);
    console.log('Request ID     :', requestId);
    console.log('X-HIP-ID       :', config.hipId);
    console.log('ABHA Address   :', abhaAddress);
    console.log('Payload        :', JSON.stringify(payload, null, 2));
    console.log('========================================================\n');

    const response = await axios.post(url, payload, {
        headers,
        timeout: config.timeout
    });

    // Persist care context mapping to MongoDB
    try {
        const patientDoc = await Patient.findOne({ uhid: patientUhid });
        await AbdmCareContext.findOneAndUpdate(
            { patientUhid, careContextReference: visitRegNumber },
            {
                careContextReference: visitRegNumber,
                display: careContextDisplay || `Care Record - ${visitRegNumber}`,
                patientUhid,
                patientId: patientDoc?._id || undefined,
                abhaNumber: abhaNumber || undefined,
                abhaAddress: abhaAddress || undefined,
                medoraRecordType,
                medoraRecordId: medoraRecordId ? String(medoraRecordId) : undefined,
                linkReference: visitRegNumber,
                transactionId,
                requestId: inboundRequestId || requestId,
                linkType: 'HIP_INITIATED',
                linkStatus: 'LINKED',
                linkToken,
                linkedAt: new Date()
            },
            { upsert: true, new: true }
        );
    } catch (dbErr) {
        console.error('⚠️ Error persisting HIP care context to MongoDB:', dbErr.message);
    }

    console.log('✅ HIP Care Context Linked successfully. Status:', response.status);
    return {
        success: true,
        status: response.status,
        data: response.data
    };
};

/**
 * Step 4: Notify Patient of Linked Record
 * Gateway Endpoint: POST /api/hiecm/hip/v3/link/context/notify
 */
const notifyCareContextLinked = async ({
    linkToken,
    abhaAddress,
    patientUhid,
    careContextReference
}) => {
    try {
        const config = getBridgeConfig();
        const token = await getAccessToken();
        const requestId = uuidv4();
        const timestamp = new Date().toISOString();

        const url = `${config.gatewayBaseUrl}/api/hiecm/hip/v3/link/context/notify`;

        const headers = {
            'Authorization': `Bearer ${token}`,
            'REQUEST-ID': requestId,
            'TIMESTAMP': timestamp,
            'X-HIP-ID': config.hipId,
            ...(linkToken ? { 'X-LINK-TOKEN': linkToken } : {}),
            'X-CM-ID': config.cmId,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        const payload = {
            notification: {
                patient: {
                    id: abhaAddress
                },
                careContext: {
                    patientReference: patientUhid || abhaAddress,
                    careContextReference: careContextReference
                },
                hiTypes: [
                    'Prescription'
                ],
                date: timestamp,
                hip: {
                    id: config.hipId
                }
            }
        };

        console.log('\n🚀 ========== OUTBOUND: LINK CONTEXT NOTIFY ==========');
        console.log('Target URL     :', url);
        console.log('Request ID     :', requestId);
        console.log('Payload        :', JSON.stringify(payload, null, 2));
        console.log('======================================================\n');

        const response = await axios.post(url, payload, {
            headers,
            timeout: config.timeout
        });

        console.log('✅ Link Context Notification delivered. Status:', response.status);
        return {
            success: true,
            status: response.status,
            data: response.data
        };
    } catch (error) {
        console.error('❌ [ABDM-M2] Failed to deliver link context notify:', error.message);
    }
};

/**
 * Step 2: Handle Gateway Webhook Callback for Token Generation
 * ABDM Endpoint: POST /v3/hip/token/on-generate-token
 * 
 * @param {Object} params
 * @param {string} params.linkToken - Received Link Token
 * @param {string} params.abhaAddress - ABHA Address
 * @param {Object} params.response - Response metadata containing original requestId
 * @param {Object} params.error - Optional error if generation failed
 */
const processLinkTokenCallback = async ({ linkToken, abhaAddress, response, error }) => {
    try {
        const origRequestId = response?.requestId;
        console.log(`\n🔑 [ABDM-M2] Processing Link Token Callback for original Request [${origRequestId}]...`);

        if (error) {
            console.error('❌ [ABDM-M2] Token generation callback returned error:', error);
            if (origRequestId) {
                await AbdmTransaction.updateOne({ requestId: origRequestId }, { $set: { status: 'FAILED' } });
            }
            return;
        }

        if (!linkToken) {
            throw new Error('Missing linkToken in on-generate-token callback');
        }

        // Retrieve pending token request from MongoDB
        const tx = await AbdmTransaction.findOne({ requestId: origRequestId });

        if (!tx) {
            console.warn(`⚠️ [ABDM-M2] No pending token request found in MongoDB for requestId [${origRequestId}].`);
            return;
        }

        const targetAbhaAddress = abhaAddress || tx.abhaAddress;
        const targetAbhaNumber = tx.abhaNumber;
        const patientUhid = tx.patientUhid;
        const visitRegNumber = tx.metadata?.visitRegNumber;

        console.log('📋 Retrieved Linking Request Context from MongoDB:', {
            targetAbhaAddress,
            targetAbhaNumber,
            patientUhid,
            visitRegNumber
        });

        // Fetch patient and clinical record from MongoDB
        let patientName = tx.metadata?.name || patientUhid;
        let careContextDisplay = `Care Record - ${visitRegNumber}`;
        let medoraRecordType = 'OPD';
        let medoraRecordId = undefined;

        if (patientUhid) {
            const patientDoc = await Patient.findOne({ uhid: patientUhid }).lean();
            if (patientDoc?.patientName) {
                patientName = patientDoc.patientName;
            }
        }

        if (visitRegNumber) {
            const ref = String(visitRegNumber);
            if (ref.startsWith('IPD')) {
                medoraRecordType = 'IPD';
                const admission = await IpdAdmission.findOne({
                    $or: [{ ipdNumber: ref }, { _id: ref.match(/^[0-9a-fA-F]{24}$/) ? ref : null }]
                }).lean();
                if (admission) {
                    medoraRecordId = admission._id.toString();
                    const dateStr = admission.admissionDate ? new Date(admission.admissionDate).toISOString().split('T')[0] : 'N/A';
                    careContextDisplay = `IPD Admission - ${admission.ipdNumber || 'IPD'} (${dateStr}) [${admission.status || 'Admitted'}]`;
                }
            } else if (ref.startsWith('DIS-')) {
                medoraRecordType = 'DischargeSummary';
                const cleanRef = ref.replace(/^DIS-/, '');
                const discharge = await IpdDischarge.findOne({
                    $or: [{ ipdNumber: cleanRef }, { _id: cleanRef.match(/^[0-9a-fA-F]{24}$/) ? cleanRef : null }]
                }).lean();
                if (discharge) {
                    medoraRecordId = discharge._id.toString();
                    const dateStr = discharge.dischargeDate ? new Date(discharge.dischargeDate).toISOString().split('T')[0] : 'N/A';
                    careContextDisplay = `Discharge Summary - ${discharge.ipdNumber || discharge.uhid || 'IPD'} (${dateStr}) [${discharge.status || 'Completed'}]`;
                }
            } else if (ref.startsWith('LAB')) {
                medoraRecordType = 'Lab';
                const lab = await LabRequest.findOne({
                    $or: [{ labId: ref }, { _id: ref.match(/^[0-9a-fA-F]{24}$/) ? ref : null }]
                }).lean();
                if (lab) {
                    medoraRecordId = lab._id.toString();
                    const testsSummary = Array.isArray(lab.tests) ? lab.tests.slice(0, 2).join(', ') : 'Lab Order';
                    const dateStr = lab.bookingDate ? new Date(lab.bookingDate).toISOString().split('T')[0] : 'N/A';
                    careContextDisplay = `Lab Order - ${lab.labId || 'LAB'} (${testsSummary}) (${dateStr}) [${lab.reportStatus || 'Pending'}]`;
                }
            } else if (ref.startsWith('RX-')) {
                medoraRecordType = 'Prescription';
                careContextDisplay = `Prescription Record - ${ref}`;
            } else {
                const visitDoc = await Visit.findOne({
                    $or: [
                        { registrationNumber: visitRegNumber },
                        { _id: visitRegNumber.match(/^[0-9a-fA-F]{24}$/) ? visitRegNumber : null }
                    ]
                }).lean();

                if (visitDoc) {
                    medoraRecordId = visitDoc._id.toString();
                    const visitType = visitDoc.visitType || 'OPD';
                    const department = visitDoc.department || 'General';
                    const dateStr = visitDoc.appointmentDate || (visitDoc.registrationDate ? new Date(visitDoc.registrationDate).toISOString().split('T')[0] : 'N/A');
                    careContextDisplay = `${visitType} Visit - ${department} (${dateStr})`;
                }
            }
        }

        // 1. Link Care Context to Patient
        await linkCareContextWithToken({
            linkToken,
            abhaNumber: targetAbhaNumber,
            abhaAddress: targetAbhaAddress,
            patientUhid,
            patientName,
            visitRegNumber,
            careContextDisplay,
            medoraRecordType,
            medoraRecordId,
            transactionId: tx.transactionId,
            requestId: origRequestId
        });

        // 2. Notify Patient
        await notifyCareContextLinked({
            linkToken,
            abhaAddress: targetAbhaAddress,
            patientUhid,
            careContextReference: visitRegNumber
        });

        // 3. Mark transaction completed in MongoDB
        tx.status = 'COMPLETED';
        tx.linkToken = linkToken;
        await tx.save();

        console.log(`✅ [ABDM-M2] Successfully linked and notified care context [${visitRegNumber}] to ABHA [${targetAbhaAddress}].`);

    } catch (err) {
        console.error('❌ [ABDM-M2] Error during processLinkTokenCallback:', err.message);
    }
};

/**
 * Deep Linking SMS Notification
 * Gateway Endpoint: POST /api/hiecm/hip/v3/link/patient/links/sms/notify2
 * 
 * @param {Object} params
 * @param {string} params.phoneNo - Patient's 10-digit mobile number
 * @param {string} [params.hipName] - Facility/Hospital Name
 */
const sendDeepLinkSmsNotify = async ({ phoneNo, hipName }) => {
    const config = getBridgeConfig();
    const token = await getAccessToken();
    const requestId = uuidv4();
    const timestamp = new Date().toISOString();

    if (!config.hipId) {
        throw new Error('ABDM_HIP_ID is required for Deep Linking SMS Notification');
    }

    if (!phoneNo) {
        throw new Error('phoneNo is required for SMS deep linking notification');
    }

    const cleanPhone = String(phoneNo).replace(/\D/g, '').slice(-10);

    const url = `${config.gatewayBaseUrl}/api/hiecm/hip/v3/link/patient/links/sms/notify2`;

    const headers = {
        'Authorization': `Bearer ${token}`,
        'REQUEST-ID': requestId,
        'TIMESTAMP': timestamp,
        'X-CM-ID': config.cmId,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };

    const payload = {
        requestId,
        timestamp,
        notification: {
            phoneNo: cleanPhone,
            hip: {
                name: hipName || 'Medora360 Healthcare',
                id: config.hipId
            }
        }
    };

    // Store transaction context in MongoDB
    await AbdmTransaction.findOneAndUpdate(
        { requestId },
        {
            requestId,
            transactionType: 'DEEP_LINK_SMS',
            status: 'PENDING',
            metadata: {
                phoneNo: cleanPhone,
                hipName: hipName || 'Medora360 Healthcare'
            },
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        },
        { upsert: true, new: true }
    );

    console.log('\n🚀 ========== OUTBOUND: DEEP LINK SMS NOTIFY ==========');
    console.log('Target URL :', url);
    console.log('Request ID :', requestId);
    console.log('Phone No   :', cleanPhone);
    console.log('HIP ID     :', config.hipId);
    console.log('Payload    :', JSON.stringify(payload, null, 2));
    console.log('========================================================\n');

    const response = await axios.post(url, payload, {
        headers,
        timeout: config.timeout
    });

    console.log('✅ Deep Link SMS notification submitted to Gateway. Status:', response.status);
    return {
        success: true,
        status: response.status,
        requestId,
        data: response.data
    };
};

module.exports = {
    requestLinkToken,
    linkCareContextWithToken,
    notifyCareContextLinked,
    processLinkTokenCallback,
    sendDeepLinkSmsNotify
};

