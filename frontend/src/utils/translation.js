// Multilingual Translation Dictionary for HMS Prescription Generation
// Supported Languages: English, Hindi, Tamil, Bengali, Marathi, Gujarati, Assamese, Telugu

export const LANGUAGES = [
  { code: 'English', label: 'English' },
  { code: 'Hindi', label: 'हिन्दी (Hindi)' },
  { code: 'Tamil', label: 'தமிழ் (Tamil)' },
  { code: 'Bengali', label: 'বাংলা (Bengali)' },
  { code: 'Marathi', label: 'मराठी (Marathi)' },
  { code: 'Gujarati', label: 'ગુજરાતી (Gujarati)' },
  { code: 'Assamese', label: 'অসমীয়া (Assamese)' },
  { code: 'Telugu', label: 'తెలుగు (Telugu)' }
];

export const dictionary = {
  // Headings & Layout Labels
  'Prescription': {
    English: 'Prescription',
    Hindi: 'औषध पत्र (Prescription)',
    Tamil: 'மருந்துச் சீட்டு (Prescription)',
    Bengali: 'প্রেসক্রিপশন (Prescription)',
    Marathi: 'औषधोपचार पत्रक',
    Gujarati: 'દવા પ્રિસ્ક્રિપ્શન',
    Assamese: 'প্ৰেছক্ৰিপচন',
    Telugu: 'వైద్య చిట్టీ (Prescription)'
  },
  'Patient Information': {
    English: 'Patient Information',
    Hindi: 'मरीज की जानकारी',
    Tamil: 'நோயாளி விவரங்கள்',
    Bengali: 'রোগীর তথ্য',
    Marathi: 'रुग्णाची माहिती',
    Gujarati: 'દર્દીની માહિતી',
    Assamese: 'ৰোগীৰ তথ্য',
    Telugu: 'రోగి సమాచారం'
  },
  'Doctor Information': {
    English: 'Doctor Information',
    Hindi: 'चिकित्सक की जानकारी',
    Tamil: 'மருத்துவர் விவரங்கள்',
    Bengali: 'ডাক্তারের তথ্য',
    Marathi: 'डॉक्टरांची माहिती',
    Gujarati: 'ડોક્ટરની માહિતી',
    Assamese: 'চিকিৎসকৰ তথ্য',
    Telugu: 'వైద్యుని సమాచారం'
  },
  'Patient Name': {
    English: 'Patient Name',
    Hindi: 'मरीज का नाम',
    Tamil: 'நோயாளி பெயர்',
    Bengali: 'রোগীর নাম',
    Marathi: 'रुग्णाचे नाव',
    Gujarati: 'દર્દીનું નામ',
    Assamese: 'ৰোগীৰ নাম',
    Telugu: 'రోగి పేరు'
  },
  'UHID': {
    English: 'UHID',
    Hindi: 'यूएचआईडी (UHID)',
    Tamil: 'நோயாளி குறியீடு (UHID)',
    Bengali: 'ইউএইচআইডি (UHID)',
    Marathi: 'युएचआयडी (UHID)',
    Gujarati: 'યુએચઆઈડી (UHID)',
    Assamese: 'ইউএইচআইডি (UHID)',
    Telugu: 'యుహెచ్ఐడి (UHID)'
  },
  'Gender': {
    English: 'Gender',
    Hindi: 'लिंग',
    Tamil: 'பாலினம்',
    Bengali: 'লিঙ্গ',
    Marathi: 'लिंग',
    Gujarati: 'લિંગ',
    Assamese: 'লিঙ্গ',
    Telugu: 'లింగం'
  },
  'Age': {
    English: 'Age',
    Hindi: 'उम्र',
    Tamil: 'வயது',
    Bengali: 'বয়স',
    Marathi: 'वय',
    Gujarati: 'ઉંમર',
    Assamese: 'বয়স',
    Telugu: 'వయస్సు'
  },
  'Mobile Number': {
    English: 'Mobile Number',
    Hindi: 'मोबाइल नंबर',
    Tamil: 'அலைபேசி எண்',
    Bengali: 'মোবাইল নম্বর',
    Marathi: 'मोबाईल नंबर',
    Gujarati: 'મોબાઈલ નંબર',
    Assamese: 'মোবাইল নম্বৰ',
    Telugu: 'మొబైల్ సంఖ్య'
  },
  'Appointment Date': {
    English: 'Appointment Date',
    Hindi: 'अपॉइंटमेंट की तारीख',
    Tamil: 'நியமன தேதி',
    Bengali: 'সাক্ষাতের তারিখ',
    Marathi: 'भेटीची तारीख',
    Gujarati: 'મુલાકાત તારીખ',
    Assamese: 'সাক্ষাৎকাৰৰ তাৰিখ',
    Telugu: 'అపాయింట్‌మెంట్ తేదీ'
  },
  'Doctor Name': {
    English: 'Doctor Name',
    Hindi: 'डॉक्टर का नाम',
    Tamil: 'மருத்துவர் பெயர்',
    Bengali: 'ডাক্তারের নাম',
    Marathi: 'डॉक्टरांचे नाव',
    Gujarati: 'ડોક્ટરનું નામ',
    Assamese: 'চিকিৎসকৰ নাম',
    Telugu: 'వైద్యుని పేరు'
  },
  'Department': {
    English: 'Department',
    Hindi: 'विभाग',
    Tamil: 'துறை',
    Bengali: 'বিভাগ',
    Marathi: 'विभाग',
    Gujarati: 'વિભાગ',
    Assamese: 'বিভাগ',
    Telugu: 'విభాగం'
  },
  'Symptoms & Diagnosis': {
    English: 'Symptoms & Diagnosis',
    Hindi: 'लक्षण और निदान',
    Tamil: 'அறிகுறிகள் மற்றும் நோய் கண்டறிதல்',
    Bengali: 'লক্ষণ ও রোগ নির্ণয়',
    Marathi: 'लक्षणे आणि निदान',
    Gujarati: 'લક્ષણો અને નિદાન',
    Assamese: 'লক্ষণ আৰু ৰোগ নিৰ্ণয়',
    Telugu: 'లక్షణాలు & వ్యాధి నిర్ధారణ'
  },
  'Symptoms': {
    English: 'Symptoms',
    Hindi: 'लक्षण',
    Tamil: 'அறிகுறிகள்',
    Bengali: 'উপসর্গ',
    Marathi: 'लक्षणे',
    Gujarati: 'લક્ષણો',
    Assamese: 'লক্ষণসমূহ',
    Telugu: 'లక్షణాలు'
  },
  'Diagnosis / Remarks': {
    English: 'Diagnosis / Remarks',
    Hindi: 'निदान / टिप्पणी',
    Tamil: 'நோய் கண்டறிதல் / குறிப்பு',
    Bengali: 'রোগ নির্ণয় / মন্তব্য',
    Marathi: 'निदान / शेरा',
    Gujarati: 'નિદાન / ટિપ્પણી',
    Assamese: 'ৰোগ নিৰ্ণয় / মন্তব্য',
    Telugu: 'వ్యాధి నిర్ధారణ / వ్యాఖ్యలు'
  },
  'Medicines Table': {
    English: 'Medicines',
    Hindi: 'दवाइयाँ',
    Tamil: 'மருந்துகள்',
    Bengali: 'ওষুধপত্র',
    Marathi: 'औषधे',
    Gujarati: 'દવાઓ',
    Assamese: 'ঔষধসমূহ',
    Telugu: 'మందులు'
  },
  'Medicine': {
    English: 'Medicine',
    Hindi: 'दवा',
    Tamil: 'மருந்து',
    Bengali: 'ওষুধ',
    Marathi: 'औषध',
    Gujarati: 'દવા',
    Assamese: 'ঔষধ',
    Telugu: 'మందు'
  },
  'Duration': {
    English: 'Duration',
    Hindi: 'अवधि',
    Tamil: 'கால அளவு',
    Bengali: 'স্থায়ীত্বকাল',
    Marathi: 'कालावधी',
    Gujarati: 'સમયગાળો',
    Assamese: 'সময়সীমা',
    Telugu: 'వ్యవధి'
  },
  'Morning': {
    English: 'Morning',
    Hindi: 'सुबह',
    Tamil: 'காலை',
    Bengali: 'সকাল',
    Marathi: 'सकाळ',
    Gujarati: 'સવાર',
    Assamese: 'ৰাতিপুৱা',
    Telugu: 'ఉదయం'
  },
  'Afternoon': {
    English: 'Afternoon',
    Hindi: 'दोपहर',
    Tamil: 'மதியம்',
    Bengali: 'দুপুর',
    Marathi: 'दुपार',
    Gujarati: 'બપોર',
    Assamese: 'দুপৰীয়া',
    Telugu: 'మధ్యాహ్నం'
  },
  'Night': {
    English: 'Night',
    Hindi: 'रात',
    Tamil: 'இரவு',
    Bengali: 'রাত',
    Marathi: 'रात्र',
    Gujarati: 'રાત્રિ',
    Assamese: 'ৰাতি',
    Telugu: 'రాత్రి'
  },
  'Remarks': {
    English: 'Remarks',
    Hindi: 'निर्देश / टिप्पणी',
    Tamil: 'குறிப்புகள்',
    Bengali: 'মন্তব্য',
    Marathi: 'सूचना',
    Gujarati: 'ટિપ્પણી',
    Assamese: 'মন্তব্য',
    Telugu: 'సూచనలు'
  },
  'Follow-up Date': {
    English: 'Follow-up Date',
    Hindi: 'अगली मुलाकात की तारीख',
    Tamil: 'அடுத்த பரிசோதனை தேதி',
    Bengali: 'পরবর্তী সাক্ষাতের তারিখ',
    Marathi: 'पुढील भेटीची तारीख',
    Gujarati: 'ફરી મુલાકાત તારીખ',
    Assamese: 'পৰৱৰ্তী সাক্ষাৎকাৰৰ তাৰিখ',
    Telugu: 'తదుపరి అపాయింట్‌మెంట్ తేదీ'
  },

  // Timings & Frequencies
  'After Food': {
    English: 'After Food',
    Hindi: 'खाने के बाद',
    Tamil: 'உணவுக்கு பின்',
    Bengali: 'খাবারের পর',
    Marathi: 'जेवणानंतर',
    Gujarati: 'જમ્યા પછી',
    Assamese: 'খোৱাৰ পিছত',
    Telugu: 'భోజనం తర్వాత'
  },
  'Before Food': {
    English: 'Before Food',
    Hindi: 'खाने से पहले',
    Tamil: 'உணவுக்கு முன்',
    Bengali: 'খাবারের আগে',
    Marathi: 'जेवणापूर्वी',
    Gujarati: 'જમ્યા પહેલા',
    Assamese: 'খোৱাৰ আগত',
    Telugu: 'భోజనం ముందు'
  },
  'Empty Stomach': {
    English: 'Empty Stomach',
    Hindi: 'खाली पेट',
    Tamil: 'வெறும் வயிற்றில்',
    Bengali: 'খালি পেটে',
    Marathi: 'उपाशी पोटी',
    Gujarati: 'ખાલી પેટે',
    Assamese: 'খালী পেটত',
    Telugu: 'పరగడుపున'
  },

  // Units
  'Days': {
    English: 'Days',
    Hindi: 'दिन',
    Tamil: 'நாட்கள்',
    Bengali: 'দিন',
    Marathi: 'दिवस',
    Gujarati: 'દિવસો',
    Assamese: 'দিন',
    Telugu: 'రోజులు'
  },
  'Weeks': {
    English: 'Weeks',
    Hindi: 'सप्ताह',
    Tamil: 'வாரங்கள்',
    Bengali: 'সপ্তাহ',
    Marathi: 'आठवडे',
    Gujarati: 'અઠવાડિયા',
    Assamese: 'সপ্তাহ',
    Telugu: 'వారాలు'
  },
  'Months': {
    English: 'Months',
    Hindi: 'महीने',
    Tamil: 'மாதங்கள்',
    Bengali: 'মাস',
    Marathi: 'महिने',
    Gujarati: 'મહિના',
    Assamese: 'মাহ',
    Telugu: 'నెలలు'
  },
  'Hours': {
    English: 'Hours',
    Hindi: 'घंटे',
    Tamil: 'மணிநேரம்',
    Bengali: 'ঘণ্টা',
    Marathi: 'तास',
    Gujarati: 'કલાક',
    Assamese: 'ঘণ্টা',
    Telugu: 'గంటలు'
  },
  'Years': {
    English: 'Years',
    Hindi: 'साल',
    Tamil: 'ஆண்டுகள்',
    Bengali: 'বছর',
    Marathi: 'वर्षे',
    Gujarati: 'વર્ષો',
    Assamese: 'বছৰ',
    Telugu: 'సంవత్సరాలు'
  },

  // Common Symptoms
  'fever': {
    English: 'Fever',
    Hindi: 'बुखार (Fever)',
    Tamil: 'காய்ச்சல் (Fever)',
    Bengali: 'জ্বর (Fever)',
    Marathi: 'ताप',
    Gujarati: 'તાવ',
    Assamese: 'জ্বৰ',
    Telugu: 'జ్వరం (Fever)'
  },
  'cough': {
    English: 'Cough',
    Hindi: 'खांसी (Cough)',
    Tamil: 'இருமல் (Cough)',
    Bengali: 'কাশি (Cough)',
    Marathi: 'खोकला',
    Gujarati: 'ખાંસી',
    Assamese: 'কাহ',
    Telugu: 'దగ్గు (Cough)'
  },
  'cold': {
    English: 'Cold',
    Hindi: 'जुकाम (Cold)',
    Tamil: 'சளி (Cold)',
    Bengali: 'সর্দি (Cold)',
    Marathi: 'सर्दी',
    Gujarati: 'શરદી',
    Assamese: 'চৰ্দি',
    Telugu: 'జలుబు (Cold)'
  },
  'headache': {
    English: 'Headache',
    Hindi: 'सिरदर्द',
    Tamil: 'தலைவலி',
    Bengali: 'মাথাব্যথা',
    Marathi: 'डोकेदुखी',
    Gujarati: 'માથાનો દુખાવો',
    Assamese: 'মূৰৰ বিষ',
    Telugu: 'తలనొప్పి'
  },
  'body pain': {
    English: 'Body Pain',
    Hindi: 'बदन दर्द',
    Tamil: 'உடல் வலி',
    Bengali: 'গায়ে ব্যথা',
    Marathi: 'अंगदुखी',
    Gujarati: 'શરીરનો દુખાવો',
    Assamese: 'গাৰ বিষ',
    Telugu: 'ఒంటి నొప్పులు'
  },
  'abdominal pain': {
    English: 'Abdominal Pain',
    Hindi: 'पेट दर्द',
    Tamil: 'வயிற்று வலி',
    Bengali: 'পেটে ব্যথা',
    Marathi: 'पोटदुखी',
    Gujarati: 'પેટનો દુખાવો',
    Assamese: 'পেটৰ বিষ',
    Telugu: 'కడుపు నొప్పి'
  },
  'diarrhea': {
    English: 'Diarrhea',
    Hindi: 'दस्त',
    Tamil: 'வயிற்றுப்போக்கு',
    Bengali: 'ডায়রিয়া',
    Marathi: 'अतिसार / जुलाब',
    Gujarati: 'ઝાડા',
    Assamese: 'পেট চলা',
    Telugu: 'అతిసారం'
  },
  'vomiting': {
    English: 'Vomiting',
    Hindi: 'उल्टी',
    Tamil: 'வாந்தி',
    Bengali: 'বমি',
    Marathi: 'उलट्या',
    Gujarati: 'ઊલટી',
    Assamese: 'বমি',
    Telugu: 'వాంతులు'
  }
};

// Advanced translation helper with duration parser:
// e.g. "cough - 2 weeks" -> "खांसी (Cough) - 2 सप्ताह" (for Hindi)
export const translate = (text, targetLang = 'English') => {
  if (!text) return '';
  if (targetLang === 'English') return text;

  const normalized = text.trim();
  const lower = normalized.toLowerCase();

  // 1. Direct exact dictionary match
  for (const key in dictionary) {
    if (key.toLowerCase() === lower) {
      return dictionary[key][targetLang] || normalized;
    }
  }

  // 2. Parse compound pattern: "symptom - duration" (e.g., "cough - 2 weeks" or "fever - 3 days")
  if (normalized.includes('-')) {
    const parts = normalized.split('-');
    if (parts.length === 2) {
      const leftTrans = translate(parts[0].trim(), targetLang);
      const rightTrans = translate(parts[1].trim(), targetLang);
      return `${leftTrans} - ${rightTrans}`;
    }
  }

  // 3. Parse duration structure: "number unit" (e.g. "3 days", "2 weeks", "1 month")
  const durationMatch = normalized.match(/^(\d+)\s+([a-zA-Z]+)$/);
  if (durationMatch) {
    const number = durationMatch[1];
    const unit = durationMatch[2];
    const translatedUnit = translate(unit, targetLang);
    return `${number} ${translatedUnit}`;
  }

  // Fallback to original text if no match found
  return normalized;
};
