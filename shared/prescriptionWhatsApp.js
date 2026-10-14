let whatsappShareWindow = null;

function getWhatsAppPopupFeatures() {
  const screen = window.screen;
  const width = Math.max(320, Math.min(1280, screen.availWidth - 40));
  const height = Math.max(500, Math.min(900, screen.availHeight - 80));
  const left = window.screenX + Math.max(0, (screen.availWidth - width) / 2);
  const top = window.screenY + Math.max(0, (screen.availHeight - height) / 2);

  return `popup=yes,width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`;
}

export function openWhatsAppShareWindow() {
  // Resolve the named browsing context on every user click. A retained
  // WindowProxy can become stale after WhatsApp's cross-origin navigation.
  whatsappShareWindow = window.open(
    '',
    'medora-whatsapp-share',
    getWhatsAppPopupFeatures()
  );
  return whatsappShareWindow;
}

export function navigateWhatsAppShareWindow(url) {
  if (whatsappShareWindow && !whatsappShareWindow.closed) {
    whatsappShareWindow.location.href = url;
    whatsappShareWindow.focus();
    return;
  }

  // Retarget the named window if WhatsApp's cross-origin isolation invalidated
  // the original Window reference after the first navigation.
  const reusedWindow = window.open(url, 'medora-whatsapp-share', getWhatsAppPopupFeatures());
  if (reusedWindow) {
    whatsappShareWindow = reusedWindow;
    reusedWindow.focus();
  }
}

export function normalizeWhatsAppNumber(phone) {
  const input = String(phone ?? '').trim();
  if (!input) return null;

  let digits = input.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) {
    digits = digits.slice(1).replace(/\D/g, '');
  } else {
    digits = digits.replace(/\D/g, '');
    if (digits.startsWith('00')) digits = digits.slice(2);
    if (digits.length === 10) digits = `91${digits}`;
    else if (digits.length === 11 && digits.startsWith('0')) digits = `91${digits.slice(1)}`;
  }

  return digits.length >= 8 && digits.length <= 15 ? digits : null;
}

export function buildPrescriptionWhatsAppMessage({
  patientName,
  doctorName,
  prescription = {}
}) {
  const formatDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Kolkata'
    }).format(date);
  };

  const lines = [
    `*Hello ${patientName || 'Patient'} ji* 👋`,
    '',
    '*Your Prescription* 🩺'
  ];

  const prescriptionDate = formatDate(prescription.prescriptionDate || prescription.createdAt);
  if (prescriptionDate) lines.push(`📅 *Date:* ${prescriptionDate}`);

  if (prescription.diagnosisRemark?.trim()) {
    lines.push(`🩺 *Diagnosis:* ${prescription.diagnosisRemark.trim()}`);
  }

  const medicines = Array.isArray(prescription.medicines) ? prescription.medicines : [];
  if (medicines.length) {
    lines.push('', '*💊 Medicines*');
    medicines.forEach((medicine, index) => {
      const name = [medicine.medicine, medicine.strength].filter(Boolean).join(' ');
      const form = medicine.dosageForm ? ` (${medicine.dosageForm})` : '';
      const timings = [
        medicine.morning && 'Morning 🌅',
        medicine.afternoon && 'Afternoon ☀️',
        medicine.night && 'Night 🌙'
      ].filter(Boolean);

      lines.push(`${index + 1}. *${name}${form}*`);
      if (medicine.dose) {
        const dosageForm = medicine.dosageForm ? ` ${medicine.dosageForm.toLowerCase()}` : '';
        lines.push(`   • Dose: ${medicine.dose}${dosageForm}`);
      }
      if (timings.length) lines.push(`   • Timing: ${timings.join(' and ')}`);
      if (medicine.duration) {
        const unit = medicine.durationUnit || 'days';
        lines.push(`   • Duration: ${medicine.duration} ${unit.toLowerCase()}`);
      }
      if (medicine.remarks) lines.push(`   • Instructions: ${medicine.remarks}`);
    });
  }

  if (prescription.patientAdvice?.trim()) {
    lines.push('', `💡 *Advice:* ${prescription.patientAdvice.trim()}`);
  }
  const followUpDate = formatDate(prescription.followUpDate);
  if (followUpDate) lines.push(`📆 *Follow-up visit:* ${followUpDate}`);
  if (prescription.followUpRemarks?.trim()) {
    lines.push(`   • ${prescription.followUpRemarks.trim()}`);
  }
  if (doctorName) lines.push('', `*Prescribed by:* ${doctorName}`);
  lines.push('', '_Please take your medicines as advised._');

  return lines.join('\n');
}

export function buildPrescriptionWhatsAppUrl({ phone, patientName, doctorName, prescription }) {
  const number = normalizeWhatsAppNumber(phone);
  if (!number) {
    throw new Error('Enter a valid patient WhatsApp number, including the country code if needed.');
  }

  const message = buildPrescriptionWhatsAppMessage({ patientName, doctorName, prescription });
  const params = new URLSearchParams({
    phone: number,
    text: message,
    type: 'phone_number',
    app_absent: '0'
  });
  return `https://web.whatsapp.com/send/?${params.toString()}`;
}
