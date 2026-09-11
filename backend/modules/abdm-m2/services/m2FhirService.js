const { v4: uuidv4 } = require('uuid');

/**
 * Normalize patient gender for FHIR R4 (male | female | other | unknown)
 */
const toFhirGender = (genderStr) => {
    if (!genderStr) return 'unknown';
    const g = String(genderStr).trim().toLowerCase();
    if (g.startsWith('m')) return 'male';
    if (g.startsWith('f')) return 'female';
    if (g.startsWith('o')) return 'other';
    return 'unknown';
};

/**
 * Generate a comprehensive and structured FHIR R4 Document Bundle for an ABDM HIP Clinical Record
 * 
 * Supports discrete structured FHIR resources:
 * - Composition (Document header & section linking)
 * - Patient (Demographics & ABHA identifiers)
 * - Encounter (Ambulatory or Inpatient encounter)
 * - Practitioner (Attending Doctor/Provider)
 * - Organization (Hospital / Healthcare Facility)
 * - Condition (Clinical Diagnoses & Symptoms)
 * - MedicationRequest (Discrete Prescriptions & Discharge Medications)
 * - DiagnosticReport & Observation (Laboratory Results & Discrete Parameters)
 * 
 * @param {Object} patient - MongoDB Patient document or plain object
 * @param {Object} record - MongoDB Visit / IpdAdmission / IpdDischarge / LabRequest / Prescription document
 * @param {string} [recordType] - Explicit record type: 'OPD' | 'IPD' | 'DischargeSummary' | 'Lab' | 'Prescription' | 'Registration'
 * @param {Object} [extraContext] - Optional related models: { doctor, hospital, consultation, prescription, admission, discharge, labRequest }
 * @returns {string} Stringified FHIR R4 JSON Bundle
 */
const generateFhirBundle = (patient, record = {}, recordType = 'OPD', extraContext = {}) => {
    const bundleId = uuidv4();
    const compositionId = uuidv4();
    const patientId = uuidv4();
    const encounterId = uuidv4();
    const practitionerId = uuidv4();
    const organizationId = uuidv4();

    // 1. Patient Details
    const patientName = patient?.patientName || 'Patient';
    const uhid = patient?.uhid || 'UHID-UNKNOWN';
    const mobile = patient?.mobile || '';
    const birthDate = patient?.dob
        ? new Date(patient.dob).toISOString().split('T')[0]
        : '1990-01-01';
    const gender = toFhirGender(patient?.gender);

    // 2. Doctor / Practitioner Details
    const doctorObj = extraContext.doctor || record.doctor || {};
    let doctorName = doctorObj.doctorName || record.doctorName;
    if (!doctorName && (record.dischargingPhysicianFirstName || record.dischargingPhysicianLastName)) {
        doctorName = [record.dischargingPhysicianTitle || 'Dr.', record.dischargingPhysicianFirstName, record.dischargingPhysicianLastName].filter(Boolean).join(' ');
    }
    if (!doctorName && doctorObj.username) {
        doctorName = `Dr. ${doctorObj.username}`;
    }
    if (!doctorName) {
        doctorName = 'Attending Physician';
    }
    const doctorSpec = doctorObj.specialization || doctorObj.department || record.department || '';
    const doctorMobile = doctorObj.mobile || '';
    const doctorIdStr = doctorObj._id ? doctorObj._id.toString() : (record.doctorId ? record.doctorId.toString() : (record.doctorInCharge ? record.doctorInCharge.toString() : 'DOC-001'));

    // 3. Hospital / Organization Details
    const hospitalObj = extraContext.hospital || record.hospital || {};
    const hospitalName = hospitalObj.name || 'Medora360 Healthcare Facility';
    const hospitalCode = hospitalObj.code || (hospitalObj._id ? hospitalObj._id.toString() : 'MEDORA-HOSP');

    // 4. Auto-detect recordType
    let detectedType = recordType;
    if (record?.tests || record?.labId) detectedType = 'Lab';
    else if (record?.dischargeDate || record?.diagnosisAtInternment) detectedType = 'DischargeSummary';
    else if (record?.ipdNumber || record?.bedHistory) detectedType = 'IPD';
    else if (record?.medicines && Array.isArray(record?.medicines)) detectedType = 'Prescription';
    else if (record?.registrationNumber || record?.visitType) detectedType = 'OPD';

    // 5. Encounter Configuration
    let encounterRefNo = record?.registrationNumber || record?.ipdNumber || record?.labId || (record?._id ? record._id.toString() : 'ENC-001');
    let encounterClassCode = 'AMB';
    let encounterClassDisplay = 'ambulatory';
    let encounterStartDate = new Date().toISOString();
    let department = record?.department || doctorSpec || 'General Medicine';

    if (detectedType === 'IPD' || detectedType === 'DischargeSummary') {
        encounterClassCode = 'IMP';
        encounterClassDisplay = 'inpatient encounter';
        encounterStartDate = record?.admissionDate ? new Date(record.admissionDate).toISOString() : new Date().toISOString();
        department = 'Inpatient Department';
    } else if (record?.visitType === 'Emergency') {
        encounterClassCode = 'EMER';
        encounterClassDisplay = 'emergency';
    } else if (record?.appointmentDate) {
        encounterStartDate = new Date(record.appointmentDate).toISOString();
    } else if (record?.bookingDate) {
        encounterStartDate = new Date(record.bookingDate).toISOString();
    }

    // 6. Structured Resource Accumulators
    const entries = [];
    const sectionEntries = [];
    let narrativeHtml = '';

    // A. Create Core Patient Resource
    const patientResource = {
        resourceType: 'Patient',
        id: patientId,
        meta: {
            versionId: '1',
            lastUpdated: new Date().toISOString(),
            profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/Patient']
        },
        identifier: [
            {
                system: 'https://medora360.com/uhid',
                value: uhid
            },
            ...(patient?.abhaNumber ? [{ system: 'https://ndhm.in/abha-number', value: patient.abhaNumber }] : []),
            ...(patient?.abhaAddress ? [{ system: 'https://ndhm.in/abha-address', value: patient.abhaAddress }] : [])
        ],
        name: [
            {
                text: patientName
            }
        ],
        telecom: mobile ? [
            {
                system: 'phone',
                value: mobile,
                use: 'mobile'
            }
        ] : [],
        gender: gender,
        birthDate: birthDate,
        ...(patient?.address && patient.address !== 'Not specified' ? {
            address: [{ text: patient.address }]
        } : {})
    };

    // B. Create Core Practitioner Resource
    const practitionerResource = {
        resourceType: 'Practitioner',
        id: practitionerId,
        meta: {
            versionId: '1',
            lastUpdated: new Date().toISOString(),
            profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/Practitioner']
        },
        identifier: [
            {
                system: 'https://medora360.com/doctor-id',
                value: doctorIdStr
            }
        ],
        name: [
            {
                text: doctorName
            }
        ],
        ...(doctorSpec ? {
            qualification: [
                {
                    code: {
                        text: doctorSpec
                    }
                }
            ]
        } : {}),
        ...(doctorMobile ? {
            telecom: [
                {
                    system: 'phone',
                    value: doctorMobile
                }
            ]
        } : {})
    };

    // C. Create Core Organization Resource
    const organizationResource = {
        resourceType: 'Organization',
        id: organizationId,
        meta: {
            versionId: '1',
            lastUpdated: new Date().toISOString(),
            profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/Organization']
        },
        identifier: [
            {
                system: 'https://medora360.com/hospital-id',
                value: hospitalCode
            }
        ],
        name: hospitalName
    };

    // D. Create Core Encounter Resource
    const encounterResource = {
        resourceType: 'Encounter',
        id: encounterId,
        meta: {
            versionId: '1',
            lastUpdated: new Date().toISOString(),
            profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/Encounter']
        },
        identifier: [
            {
                system: 'https://medora360.com/encounter',
                value: encounterRefNo
            }
        ],
        status: 'finished',
        class: {
            system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
            code: encounterClassCode,
            display: encounterClassDisplay
        },
        serviceType: {
            coding: [
                {
                    system: 'http://terminology.hl7.org/CodeSystem/service-type',
                    display: department
                }
            ]
        },
        subject: {
            reference: `urn:uuid:${patientId}`,
            display: patientName
        },
        participant: [
            {
                individual: {
                    reference: `urn:uuid:${practitionerId}`,
                    display: doctorName
                }
            }
        ],
        serviceProvider: {
            reference: `urn:uuid:${organizationId}`,
            display: hospitalName
        },
        period: {
            start: encounterStartDate,
            end: record?.dischargeDate ? new Date(record.dischargeDate).toISOString() : encounterStartDate
        }
    };

    // 7. Generate Clinical Domain-Specific Resources
    let docTypeCode = 'OPC';
    let docTypeDisplay = 'OP Consultation Record';
    let docProfile = 'https://nrces.in/ndhm/fhir/r4/StructureDefinition/OPConsultationRecord';
    let docTitle = 'OPD Consultation Record';

    // Helper: Add Condition Resource
    const addCondition = (diagnosisText, recordedDate = new Date().toISOString()) => {
        if (!diagnosisText || !diagnosisText.trim()) return null;
        const condId = uuidv4();
        const condResource = {
            resourceType: 'Condition',
            id: condId,
            meta: {
                versionId: '1',
                lastUpdated: new Date().toISOString(),
                profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/Condition']
            },
            clinicalStatus: {
                coding: [
                    {
                        system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
                        code: 'active',
                        display: 'Active'
                    }
                ]
            },
            verificationStatus: {
                coding: [
                    {
                        system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
                        code: 'confirmed',
                        display: 'Confirmed'
                    }
                ]
            },
            code: {
                text: diagnosisText.trim()
            },
            subject: {
                reference: `urn:uuid:${patientId}`,
                display: patientName
            },
            encounter: {
                reference: `urn:uuid:${encounterId}`
            },
            recordedDate: recordedDate
        };
        entries.push({ fullUrl: `urn:uuid:${condId}`, resource: condResource });
        sectionEntries.push({ reference: `urn:uuid:${condId}`, display: diagnosisText.trim() });
        return condId;
    };

    // Helper: Add MedicationRequest Resource
    const addMedication = (med, authoredOn = new Date().toISOString()) => {
        const medName = med.medicine || med.medicineName || 'Medication';
        const medReqId = uuidv4();
        const dosageInstructions = [];

        const timingParts = [];
        if (med.morning) timingParts.push('Morning');
        if (med.afternoon) timingParts.push('Afternoon');
        if (med.night) timingParts.push('Night');
        const frequencyStr = med.frequency || (timingParts.length > 0 ? timingParts.join(' - ') : '');

        const textInstruction = [
            med.dose ? `Dose: ${med.dose}` : '',
            med.dosageForm ? `Form: ${med.dosageForm}` : '',
            frequencyStr ? `Freq: ${frequencyStr}` : '',
            med.duration ? `Duration: ${med.duration}` : '',
            med.remarks ? `Remarks: ${med.remarks}` : ''
        ].filter(Boolean).join(' | ');

        const medReqResource = {
            resourceType: 'MedicationRequest',
            id: medReqId,
            meta: {
                versionId: '1',
                lastUpdated: new Date().toISOString(),
                profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/MedicationRequest']
            },
            status: 'active',
            intent: 'order',
            medicationCodeableConcept: {
                text: medName
            },
            subject: {
                reference: `urn:uuid:${patientId}`,
                display: patientName
            },
            encounter: {
                reference: `urn:uuid:${encounterId}`
            },
            authoredOn: authoredOn,
            requester: {
                reference: `urn:uuid:${practitionerId}`,
                display: doctorName
            },
            dosageInstruction: [
                {
                    text: textInstruction || 'As directed by physician',
                    ...(med.dose ? {
                        doseAndRate: [
                            {
                                doseQuantity: {
                                    value: parseFloat(med.dose) || 1,
                                    unit: med.dosageForm || 'Unit'
                                }
                            }
                        ]
                    } : {})
                }
            ],
            ...(med.qty ? {
                dispenseRequest: {
                    quantity: {
                        value: med.qty,
                        unit: med.dosageForm || 'Unit'
                    }
                }
            } : {})
        };

        entries.push({ fullUrl: `urn:uuid:${medReqId}`, resource: medReqResource });
        sectionEntries.push({ reference: `urn:uuid:${medReqId}`, display: medName });
        return medReqId;
    };

    // --- DOMAIN SPECIFIC MAPPINGS ---

    // 1. Inpatient / Discharge Summary
    if (detectedType === 'DischargeSummary' || detectedType === 'IPD') {
        docTypeCode = 'DIS';
        docTypeDisplay = 'Discharge Summary Record';
        docProfile = 'https://nrces.in/ndhm/fhir/r4/StructureDefinition/DischargeSummaryRecord';
        docTitle = 'Inpatient Discharge Summary';

        const diagnosis = record.diagnosisAtInternment || record.provisionalDiagnosis || extraContext.discharge?.diagnosisAtInternment || extraContext.admission?.provisionalDiagnosis || '';
        if (diagnosis) {
            addCondition(diagnosis, record.admissionDate ? new Date(record.admissionDate).toISOString() : new Date().toISOString());
        }

        // Discharge Prescriptions
        const dischargeMeds = Array.isArray(record.dischargePrescription) && record.dischargePrescription.length > 0
            ? record.dischargePrescription
            : (extraContext.discharge?.dischargePrescription || []);

        for (const med of dischargeMeds) {
            addMedication(med, record.dischargeDate ? new Date(record.dischargeDate).toISOString() : new Date().toISOString());
        }

        narrativeHtml = `<div xmlns="http://www.w3.org/1999/xhtml"><h4>Discharge Summary</h4><p><strong>Patient:</strong> ${patientName} (UHID: ${uhid})</p><p><strong>IPD No:</strong> ${record.ipdNumber || 'N/A'}</p><p><strong>Diagnosis:</strong> ${diagnosis || 'Not specified'}</p><p><strong>Treatment Summary:</strong> ${record.treatmentSummary || 'Inpatient stay completed.'}</p><p><strong>Discharge Reason:</strong> ${record.dischargeReason || 'Patient Treated'}</p></div>`;
    }

    // 2. Laboratory Diagnostic Report & Observations
    else if (detectedType === 'Lab') {
        docTypeCode = 'DLR';
        docTypeDisplay = 'Diagnostic Lab Report';
        docProfile = 'https://nrces.in/ndhm/fhir/r4/StructureDefinition/DiagnosticReportRecord';
        docTitle = 'Laboratory Diagnostic Report';

        const diagReportId = uuidv4();
        const obsReferences = [];
        const parameters = record.report?.parameters || extraContext.labRequest?.report?.parameters || [];
        const tests = Array.isArray(record.tests) ? record.tests : (extraContext.labRequest?.tests || []);

        // Create discrete Observation for each test parameter
        if (parameters.length > 0) {
            for (const param of parameters) {
                const obsId = uuidv4();
                const isNumeric = param.value && !isNaN(Number(param.value));

                const obsResource = {
                    resourceType: 'Observation',
                    id: obsId,
                    meta: {
                        versionId: '1',
                        lastUpdated: new Date().toISOString(),
                        profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/Observation']
                    },
                    status: 'final',
                    code: {
                        text: param.displayName || param.name || 'Lab Parameter'
                    },
                    subject: {
                        reference: `urn:uuid:${patientId}`,
                        display: patientName
                    },
                    encounter: {
                        reference: `urn:uuid:${encounterId}`
                    },
                    effectiveDateTime: record.bookingDate ? new Date(record.bookingDate).toISOString() : new Date().toISOString(),
                    ...(isNumeric ? {
                        valueQuantity: {
                            value: Number(param.value),
                            unit: param.unit || ''
                        }
                    } : {
                        valueString: String(param.value || 'Normal')
                    }),
                    ...(param.referenceRange ? {
                        referenceRange: [
                            {
                                text: param.referenceRange
                            }
                        ]
                    } : {}),
                    ...(param.isAbnormal ? {
                        interpretation: [
                            {
                                coding: [
                                    {
                                        system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
                                        code: 'A',
                                        display: 'Abnormal'
                                    }
                                ]
                            }
                        ]
                    } : {})
                };

                entries.push({ fullUrl: `urn:uuid:${obsId}`, resource: obsResource });
                obsReferences.push({ reference: `urn:uuid:${obsId}`, display: param.displayName || param.name });
            }
        }

        // Create DiagnosticReport Resource
        const diagReportResource = {
            resourceType: 'DiagnosticReport',
            id: diagReportId,
            meta: {
                versionId: '1',
                lastUpdated: new Date().toISOString(),
                profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/DiagnosticReportLab']
            },
            identifier: [
                {
                    system: 'https://medora360.com/lab-id',
                    value: record.labId || 'LAB-001'
                }
            ],
            status: record.reportStatus === 'Ready' || record.reportStatus === 'Completed' || record.status === 'completed' || record.status === 'report_ready' ? 'final' : 'preliminary',
            code: {
                text: tests.join(', ') || 'Laboratory Investigation'
            },
            subject: {
                reference: `urn:uuid:${patientId}`,
                display: patientName
            },
            encounter: {
                reference: `urn:uuid:${encounterId}`
            },
            effectiveDateTime: record.bookingDate ? new Date(record.bookingDate).toISOString() : new Date().toISOString(),
            issued: record.report?.completionDate ? new Date(record.report.completionDate).toISOString() : new Date().toISOString(),
            performer: [
                {
                    reference: `urn:uuid:${organizationId}`,
                    display: hospitalName
                }
            ],
            ...(obsReferences.length > 0 ? { result: obsReferences } : {}),
            conclusion: record.report?.interpretation || record.report?.remarks || record.report?.notes || 'Test analysis completed.'
        };

        entries.push({ fullUrl: `urn:uuid:${diagReportId}`, resource: diagReportResource });
        sectionEntries.push({ reference: `urn:uuid:${diagReportId}`, display: tests.join(', ') || 'Diagnostic Report' });

        narrativeHtml = `<div xmlns="http://www.w3.org/1999/xhtml"><h4>Diagnostic Lab Report</h4><p><strong>Patient:</strong> ${patientName} (UHID: ${uhid})</p><p><strong>Order ID:</strong> ${record.labId || 'N/A'}</p><p><strong>Tests:</strong> ${tests.join(', ')}</p><p><strong>Conclusion:</strong> ${diagReportResource.conclusion}</p></div>`;
    }

    // 3. Prescription
    else if (detectedType === 'Prescription') {
        docTypeCode = 'PRE';
        docTypeDisplay = 'Prescription record';
        docProfile = 'https://nrces.in/ndhm/fhir/r4/StructureDefinition/PrescriptionRecord';
        docTitle = 'Prescription Record';

        const diagnosis = record.diagnosisRemark || extraContext.consultation?.diagnosisRemark || '';
        if (diagnosis) {
            addCondition(diagnosis, record.prescriptionDateTime ? new Date(record.prescriptionDateTime).toISOString() : new Date().toISOString());
        }

        const medicines = Array.isArray(record.medicines) ? record.medicines : [];
        for (const med of medicines) {
            addMedication(med, record.prescriptionDateTime ? new Date(record.prescriptionDateTime).toISOString() : new Date().toISOString());
        }

        narrativeHtml = `<div xmlns="http://www.w3.org/1999/xhtml"><h4>Prescription</h4><p><strong>Patient:</strong> ${patientName} (UHID: ${uhid})</p><p><strong>Prescribed by:</strong> ${doctorName}</p><p><strong>Advice:</strong> ${record.patientAdvice || 'Follow dosage schedule.'}</p></div>`;
    }

    // 4. OPD Encounter & Consultation
    else {
        docTypeCode = 'OPC';
        docTypeDisplay = 'OP Consultation Record';
        docProfile = 'https://nrces.in/ndhm/fhir/r4/StructureDefinition/OPConsultationRecord';
        docTitle = 'OPD Consultation Record';

        const consultDoc = extraContext.consultation || {};
        const diagnosis = consultDoc.diagnosisRemark || record.diagnosisRemark || '';
        if (diagnosis) {
            addCondition(diagnosis, consultDoc.consultationDateTime ? new Date(consultDoc.consultationDateTime).toISOString() : encounterStartDate);
        }

        // Consult Symptoms
        if (Array.isArray(consultDoc.symptoms) && consultDoc.symptoms.length > 0) {
            for (const sym of consultDoc.symptoms) {
                if (sym.symptom) {
                    addCondition(`Symptom: ${sym.symptom}${sym.durationDays ? ` (${sym.durationDays} ${sym.durationUnit || 'Days'})` : ''}`);
                }
            }
        }

        // Prescriptions associated with this visit
        const presDoc = extraContext.prescription || {};
        if (Array.isArray(presDoc.medicines) && presDoc.medicines.length > 0) {
            for (const med of presDoc.medicines) {
                addMedication(med, presDoc.prescriptionDateTime ? new Date(presDoc.prescriptionDateTime).toISOString() : encounterStartDate);
            }
        }

        narrativeHtml = `<div xmlns="http://www.w3.org/1999/xhtml"><h4>OPD Consultation Record</h4><p><strong>Patient:</strong> ${patientName} (UHID: ${uhid})</p><p><strong>Department:</strong> ${department}</p><p><strong>Doctor:</strong> ${doctorName}</p><p><strong>Diagnosis:</strong> ${diagnosis || 'General Consultation'}</p></div>`;
    }

    // 8. Create Composition Document Header
    const compositionResource = {
        resourceType: 'Composition',
        id: compositionId,
        meta: {
            versionId: '1',
            lastUpdated: new Date().toISOString(),
            profile: [docProfile]
        },
        language: 'en',
        identifier: {
            system: 'https://medora360.com/document',
            value: compositionId
        },
        status: 'final',
        type: {
            coding: [
                {
                    system: 'https://projectndhm.in/fhir/ndhm/CodeSystem/ndhm-document-types',
                    code: docTypeCode,
                    display: docTypeDisplay
                }
            ],
            text: docTypeDisplay
        },
        subject: {
            reference: `urn:uuid:${patientId}`,
            display: patientName
        },
        encounter: {
            reference: `urn:uuid:${encounterId}`,
            display: `${detectedType} Encounter - ${encounterRefNo}`
        },
        date: new Date().toISOString(),
        author: [
            {
                reference: `urn:uuid:${practitionerId}`,
                display: doctorName
            }
        ],
        title: docTitle,
        custodian: {
            reference: `urn:uuid:${organizationId}`,
            display: hospitalName
        },
        section: [
            {
                title: docTitle,
                code: {
                    coding: [
                        {
                            system: 'http://snomed.info/sct',
                            code: '4241000179101',
                            display: docTypeDisplay
                        }
                    ]
                },
                ...(sectionEntries.length > 0 ? { entry: sectionEntries } : {}),
                text: {
                    status: 'generated',
                    div: narrativeHtml
                }
            }
        ]
    };

    // 9. Assemble Full Bundle
    // ABDM specification requires the Composition resource to be the first entry
    const finalEntries = [
        { fullUrl: `urn:uuid:${compositionId}`, resource: compositionResource },
        { fullUrl: `urn:uuid:${patientId}`, resource: patientResource },
        { fullUrl: `urn:uuid:${practitionerId}`, resource: practitionerResource },
        { fullUrl: `urn:uuid:${organizationId}`, resource: organizationResource },
        { fullUrl: `urn:uuid:${encounterId}`, resource: encounterResource },
        ...entries
    ];

    const bundle = {
        resourceType: 'Bundle',
        id: bundleId,
        meta: {
            versionId: '1',
            lastUpdated: new Date().toISOString(),
            profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/DocumentBundle']
        },
        identifier: {
            system: 'https://medora360.com/bundle',
            value: bundleId
        },
        type: 'document',
        timestamp: new Date().toISOString(),
        entry: finalEntries
    };

    return JSON.stringify(bundle);
};

module.exports = {
    toFhirGender,
    generateFhirBundle
};
