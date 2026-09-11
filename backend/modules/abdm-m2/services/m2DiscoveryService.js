const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const Patient = require('../../../models/Patient');
const Visit = require('../../../models/Visit');
const IpdAdmission = require('../../../models/IpdAdmission');
const IpdDischarge = require('../../../models/IpdDischarge');
const LabRequest = require('../../../models/LabRequest');
const Prescription = require('../../../models/Prescription');
const AbdmCareContext = require('../../../models/AbdmCareContext');
const { getAccessToken } = require('../../../services/abdmGatewayService');
const { getBridgeConfig } = require('./m2BridgeService');

/**
 * Normalize phone number by extracting the last 10 digits
 */
const normalizeMobile = (mobileStr) => {
    if (!mobileStr) return '';
    const digitsOnly = String(mobileStr).replace(/\D/g, '');
    return digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly;
};

/**
 * Normalize ABDM Gender codes to Medora360 Patient schema
 * ABDM uses 'M', 'F', 'O' / 'U'
 */
const normalizeGender = (genderStr) => {
    if (!genderStr) return null;
    const g = String(genderStr).trim().toUpperCase();
    if (g === 'M' || g === 'MALE') return 'Male';
    if (g === 'F' || g === 'FEMALE') return 'Female';
    if (g === 'O' || g === 'OTHER' || g === 'U') return 'Other';
    return null;
};

/**
 * Extract Year of Birth from incoming patient discovery object
 */
const extractYearOfBirth = (patientCriteria) => {
    if (!patientCriteria) return null;
    if (patientCriteria.yearOfBirth) {
        return Number(patientCriteria.yearOfBirth);
    }
    if (patientCriteria.dateOfBirth) {
        if (typeof patientCriteria.dateOfBirth === 'object' && patientCriteria.dateOfBirth.year) {
            return Number(patientCriteria.dateOfBirth.year);
        }
        if (typeof patientCriteria.dateOfBirth === 'string') {
            const parsedYear = new Date(patientCriteria.dateOfBirth).getFullYear();
            if (!isNaN(parsedYear)) return parsedYear;
        }
    }
    return null;
};

/**
 * Send outbound on-discover callback to ABDM Gateway
 * Endpoint: POST /api/hiecm/user-initiated-linking/v3/patient/care-context/on-discover
 */
const sendOnDiscoverCallback = async ({ transactionId, incomingRequestId, patients = [], matchedBy = ['MR'] }) => {
    const config = getBridgeConfig();
    const token = await getAccessToken();
    const requestId = uuidv4();
    const timestamp = new Date().toISOString();

    const url = `${config.gatewayBaseUrl}/api/hiecm/user-initiated-linking/v3/patient/care-context/on-discover`;

    const headers = {
        'Authorization': `Bearer ${token}`,
        'REQUEST-ID': requestId,
        'TIMESTAMP': timestamp,
        'X-CM-ID': config.cmId,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };

    const payload = {
        transactionId,
        patient: patients,
        matchedBy,
        response: {
            requestId: incomingRequestId
        }
    };

    console.log('\n🚀 ========== OUTBOUND: ABDM M2 ON-DISCOVER CALLBACK ==========');
    console.log('Target URL     :', url);
    console.log('Transaction ID :', transactionId);
    console.log('Incoming Req ID:', incomingRequestId);
    console.log('New Request ID :', requestId);
    console.log('Matched Patients Count:', patients.length);
    console.log('Payload        :', JSON.stringify(payload, null, 2));
    console.log('=================================================================\n');

    try {
        const response = await axios.post(url, payload, {
            headers,
            timeout: config.timeout
        });

        console.log('✅ ABDM on-discover callback delivered successfully. Status:', response.status);
        return {
            success: true,
            status: response.status,
            data: response.data
        };
    } catch (error) {
        console.error('\n❌ ========== ABDM ON-DISCOVER CALLBACK ERROR ==========');
        if (error.response) {
            console.error('Status :', error.response.status);
            console.error('Data   :', JSON.stringify(error.response.data, null, 2));
            console.error('Headers:', error.response.headers);
        } else {
            console.error('Message:', error.message);
        }
        console.error('========================================================\n');
        throw error;
    }
};

/**
 * Discover all clinical Care Contexts for a given Medora Patient
 * Supports: OPD Visits, IPD Admissions, IPD Discharge Summaries, Lab Orders, Prescriptions
 * 
 * @param {Object} patient - Medora Patient document
 * @returns {Array<Object>} List of standardized Care Contexts with Medora metadata
 */
const discoverPatientCareContexts = async (patient) => {
    const careContexts = [];
    const seenRefs = new Set();

    const addCareContext = ({ referenceNumber, display, medoraRecordType, medoraRecordId, hiType }) => {
        if (!referenceNumber || seenRefs.has(referenceNumber)) return;
        seenRefs.add(referenceNumber);
        careContexts.push({
            referenceNumber: String(referenceNumber).trim(),
            display: String(display).trim(),
            medoraRecordType,
            medoraRecordId: medoraRecordId ? String(medoraRecordId) : undefined,
            hiType: hiType || 'OPConsultation'
        });
    };

    // 1. OPD Visits (Visit model)
    try {
        const visits = await Visit.find({
            $or: [
                { patientId: patient._id },
                { uhid: patient.uhid }
            ]
        }).sort({ registrationDate: -1, createdAt: -1 }).lean();

        for (const visit of visits) {
            const refNumber = visit.registrationNumber || visit._id.toString();
            const visitType = visit.visitType || 'OPD';
            const dept = visit.department || 'General Medicine';
            const dateStr = visit.appointmentDate || (visit.registrationDate ? new Date(visit.registrationDate).toISOString().split('T')[0] : 'N/A');

            addCareContext({
                referenceNumber: refNumber,
                display: `${visitType} Visit - ${dept} (${dateStr})`,
                medoraRecordType: 'OPD',
                medoraRecordId: visit._id.toString(),
                hiType: 'OPConsultation'
            });
        }
    } catch (err) {
        console.warn('⚠️ Error discovering OPD visits for patient:', err.message);
    }

    // 2. IPD Admissions (IpdAdmission model)
    try {
        const ipdAdmissions = await IpdAdmission.find({
            $or: [
                { patientId: patient._id },
                { pidNumber: patient.uhid }
            ]
        }).sort({ admissionDate: -1, createdAt: -1 }).lean();

        for (const admission of ipdAdmissions) {
            const refNumber = admission.ipdNumber || admission._id.toString();
            const dateStr = admission.admissionDate ? new Date(admission.admissionDate).toISOString().split('T')[0] : 'N/A';
            const statusStr = admission.status || 'Admitted';

            addCareContext({
                referenceNumber: refNumber,
                display: `IPD Admission - ${admission.ipdNumber || 'IPD'} (${dateStr}) [${statusStr}]`,
                medoraRecordType: 'IPD',
                medoraRecordId: admission._id.toString(),
                hiType: 'DischargeSummary'
            });
        }
    } catch (err) {
        console.warn('⚠️ Error discovering IPD admissions for patient:', err.message);
    }

    // 3. IPD Discharge Summaries (IpdDischarge model)
    try {
        const ipdDischarges = await IpdDischarge.find({
            $or: [
                { patientId: patient._id },
                { uhid: patient.uhid },
                { pidNumber: patient.uhid }
            ]
        }).sort({ dischargeDate: -1, createdAt: -1 }).lean();

        for (const discharge of ipdDischarges) {
            const refNumber = discharge.ipdNumber ? `DIS-${discharge.ipdNumber}` : `DIS-${discharge._id.toString()}`;
            const dateStr = discharge.dischargeDate ? new Date(discharge.dischargeDate).toISOString().split('T')[0] : 'N/A';
            const statusStr = discharge.status || 'Completed';

            addCareContext({
                referenceNumber: refNumber,
                display: `Discharge Summary - ${discharge.ipdNumber || discharge.uhid || 'IPD'} (${dateStr}) [${statusStr}]`,
                medoraRecordType: 'DischargeSummary',
                medoraRecordId: discharge._id.toString(),
                hiType: 'DischargeSummary'
            });
        }
    } catch (err) {
        console.warn('⚠️ Error discovering IPD discharges for patient:', err.message);
    }

    // 4. Lab Reports / Requests (LabRequest model)
    try {
        const labRequests = await LabRequest.find({
            patientId: patient._id
        }).sort({ bookingDate: -1, createdAt: -1 }).lean();

        for (const lab of labRequests) {
            const refNumber = lab.labId || lab._id.toString();
            const testsSummary = Array.isArray(lab.tests) && lab.tests.length > 0
                ? (lab.tests.slice(0, 2).join(', ') + (lab.tests.length > 2 ? '...' : ''))
                : 'Diagnostic Investigation';
            const dateStr = lab.bookingDate ? new Date(lab.bookingDate).toISOString().split('T')[0] : 'N/A';
            const statusStr = lab.reportStatus || lab.status || 'Pending';

            addCareContext({
                referenceNumber: refNumber,
                display: `Lab Order - ${lab.labId || 'LAB'} (${testsSummary}) (${dateStr}) [${statusStr}]`,
                medoraRecordType: 'Lab',
                medoraRecordId: lab._id.toString(),
                hiType: 'DiagnosticReport'
            });
        }
    } catch (err) {
        console.warn('⚠️ Error discovering Lab requests for patient:', err.message);
    }

    // 5. Prescriptions (Prescription model)
    try {
        const prescriptions = await Prescription.find({
            patientId: patient._id
        }).sort({ prescriptionDateTime: -1, createdAt: -1 }).lean();

        for (const rx of prescriptions) {
            const refNumber = `RX-${rx._id.toString().slice(-8).toUpperCase()}`;
            const medCount = Array.isArray(rx.medicines) ? rx.medicines.length : 0;
            const dateStr = rx.prescriptionDateTime
                ? new Date(rx.prescriptionDateTime).toISOString().split('T')[0]
                : (rx.createdAt ? new Date(rx.createdAt).toISOString().split('T')[0] : 'N/A');

            addCareContext({
                referenceNumber: refNumber,
                display: `Prescription (${medCount} medicines) - ${dateStr}`,
                medoraRecordType: 'Prescription',
                medoraRecordId: rx._id.toString(),
                hiType: 'Prescription'
            });
        }
    } catch (err) {
        console.warn('⚠️ Error discovering Prescriptions for patient:', err.message);
    }

    // 6. Default Fallback: Hospital Registration Record
    if (careContexts.length === 0) {
        addCareContext({
            referenceNumber: patient.uhid,
            display: `Hospital Registration (${patient.uhid})`,
            medoraRecordType: 'Registration',
            medoraRecordId: patient._id.toString(),
            hiType: 'OPConsultation'
        });
    }

    return careContexts;
};

/**
 * Main Discovery Logic: Match incoming criteria against Patients and clinical records in MongoDB
 * 
 * @param {Object} params
 * @param {Object} params.patient - Search criteria from discovery webhook
 * @param {string} params.transactionId - ABDM Transaction ID
 * @param {string} params.requestId - Incoming ABDM Request ID
 */
const processPatientDiscovery = async ({ patient: searchCriteria, transactionId, requestId }) => {
    try {
        console.log(`\n🔍 [ABDM-M2] Starting Patient Discovery for Transaction [${transactionId}]...`);

        if (!searchCriteria) {
            console.warn('⚠️ [ABDM-M2] Discovery payload missing search criteria.');
            return await sendOnDiscoverCallback({
                transactionId,
                incomingRequestId: requestId,
                patients: [],
                matchedBy: ['MR']
            });
        }

        // 1. Extract Identifiers
        const verifiedIdentifiers = Array.isArray(searchCriteria.verifiedIdentifiers) ? searchCriteria.verifiedIdentifiers : [];
        const unverifiedIdentifiers = Array.isArray(searchCriteria.unverifiedIdentifiers) ? searchCriteria.unverifiedIdentifiers : [];
        const allIdentifiers = [...verifiedIdentifiers, ...unverifiedIdentifiers];

        // Find Mobile Identifier
        const mobileIdObj = allIdentifiers.find(id => id.type && id.type.toUpperCase() === 'MOBILE');
        const rawMobile = mobileIdObj?.value || searchCriteria.mobile || searchCriteria.phoneNumber || '';
        const normalizedMob = normalizeMobile(rawMobile);

        // Find MR/UHID Identifier if provided
        const mrIdObj = allIdentifiers.find(id => id.type && (id.type.toUpperCase() === 'MR' || id.type.toUpperCase() === 'UHID'));
        const searchUhid = mrIdObj?.value || '';

        // Find ABHA Identifier if provided
        const abhaIdObj = allIdentifiers.find(id => id.type && (id.type.toUpperCase() === 'NDHM_HEALTH_NUMBER' || id.type.toUpperCase() === 'HEALTH_ID'));
        const searchAbha = abhaIdObj?.value || searchCriteria.id || searchCriteria.abhaAddress || searchCriteria.abhaNumber || '';

        // Extract Name, Gender, Year of Birth
        const searchName = (searchCriteria.name || '').trim();
        const searchGender = normalizeGender(searchCriteria.gender);
        const searchBirthYear = extractYearOfBirth(searchCriteria);

        console.log('📋 Parsed Search Criteria:', {
            rawMobile,
            normalizedMob,
            searchUhid,
            searchAbha,
            searchName,
            searchGender,
            searchBirthYear
        });

        // 2. Build MongoDB Query
        const matchConditions = [];

        if (searchUhid) {
            matchConditions.push({ uhid: searchUhid });
        }
        if (searchAbha) {
            matchConditions.push({ abhaNumber: searchAbha });
            matchConditions.push({ abhaAddress: searchAbha });
        }
        if (normalizedMob) {
            matchConditions.push({ mobile: { $regex: `${normalizedMob}$` } });
        }

        if (matchConditions.length === 0) {
            console.warn('⚠️ [ABDM-M2] No mobile, UHID, or ABHA supplied for matching.');
            return await sendOnDiscoverCallback({
                transactionId,
                incomingRequestId: requestId,
                patients: [],
                matchedBy: ['MR']
            });
        }

        const query = matchConditions.length === 1 ? matchConditions[0] : { $or: matchConditions };

        // Optional Gender Filter
        if (searchGender) {
            query.gender = new RegExp(`^${searchGender}$`, 'i');
        }

        const candidatePatients = await Patient.find(query).lean();
        console.log(`🔎 Found ${candidatePatients.length} candidate patient(s) in database matching base query.`);

        // 3. Demographic Filtering (Name and Year of Birth)
        const matchedPatients = candidatePatients.filter(candidate => {
            // Check Year of Birth (+/- 1 year tolerance)
            if (searchBirthYear && candidate.dob) {
                const candidateYear = new Date(candidate.dob).getFullYear();
                if (!isNaN(candidateYear)) {
                    const diff = Math.abs(candidateYear - searchBirthYear);
                    if (diff > 1) {
                        console.log(`ℹ️ Filtered out ${candidate.patientName}: Birth year mismatch (${candidateYear} vs ${searchBirthYear})`);
                        return false;
                    }
                }
            }

            // Check Name Match if name is provided
            if (searchName && candidate.patientName) {
                const searchTokens = searchName.toLowerCase().split(/\s+/).filter(Boolean);
                const candidateNameLower = candidate.patientName.toLowerCase();
                // Check if at least one name token matches
                const nameMatches = searchTokens.some(token => candidateNameLower.includes(token));
                if (!nameMatches) {
                    console.log(`ℹ️ Filtered out ${candidate.patientName}: Name does not match "${searchName}"`);
                    return false;
                }
            }

            return true;
        });

        console.log(`🎯 ${matchedPatients.length} patient(s) passed all demographic filters.`);

        if (matchedPatients.length === 0) {
            return await sendOnDiscoverCallback({
                transactionId,
                incomingRequestId: requestId,
                patients: [],
                matchedBy: searchUhid ? ['MR'] : ['MOBILE']
            });
        }

        // 4. Retrieve Comprehensive Care Contexts (OPD, IPD, Lab, Prescription, Discharge)
        const responsePatients = await Promise.all(
            matchedPatients.map(async (patient) => {
                const discoveredContexts = await discoverPatientCareContexts(patient);

                // Persist/Index discovered care contexts into AbdmCareContext in MongoDB
                for (const cc of discoveredContexts) {
                    await AbdmCareContext.findOneAndUpdate(
                        { patientUhid: patient.uhid, careContextReference: cc.referenceNumber },
                        {
                            careContextReference: cc.referenceNumber,
                            display: cc.display,
                            patientUhid: patient.uhid,
                            patientId: patient._id,
                            medoraRecordType: cc.medoraRecordType,
                            medoraRecordId: cc.medoraRecordId,
                            hiType: cc.hiType,
                            abhaNumber: patient.abhaNumber || undefined,
                            abhaAddress: patient.abhaAddress || undefined,
                            hospitalId: patient.hospitalId || undefined,
                            transactionId: transactionId,
                            requestId: requestId,
                            linkStatus: 'INITIATED'
                        },
                        { upsert: true, new: true }
                    ).catch(err => console.warn(`⚠️ Non-critical care context cache save error: ${err.message}`));
                }

                return {
                    referenceNumber: patient.uhid,
                    display: patient.patientName,
                    careContexts: discoveredContexts.map(cc => ({
                        referenceNumber: cc.referenceNumber,
                        display: cc.display
                    })),
                    hiType: discoveredContexts[0]?.hiType || 'Prescription',
                    count: discoveredContexts.length
                };
            })
        );

        // 5. Send on-discover callback to ABDM Gateway
        const matchedBy = searchUhid ? ['MR'] : (searchAbha ? ['NDHM_HEALTH_NUMBER', 'HEALTH_ID', 'MR'] : ['MOBILE', 'MR']);
        return await sendOnDiscoverCallback({
            transactionId,
            incomingRequestId: requestId,
            patients: responsePatients,
            matchedBy
        });

    } catch (error) {
        console.error('❌ [ABDM-M2] Error processing patient discovery:', error.message);
        // Attempt to send empty patient response so Gateway does not hang on timeout
        try {
            await sendOnDiscoverCallback({
                transactionId,
                incomingRequestId: requestId,
                patients: [],
                matchedBy: ['MR']
            });
        } catch (callbackErr) {
            console.error('❌ [ABDM-M2] Fallback on-discover callback failed:', callbackErr.message);
        }
    }
};

module.exports = {
    normalizeMobile,
    normalizeGender,
    extractYearOfBirth,
    discoverPatientCareContexts,
    sendOnDiscoverCallback,
    processPatientDiscovery
};

