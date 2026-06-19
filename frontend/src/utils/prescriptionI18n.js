const dictionary = {
  English: {
    prescription: 'Prescription',
    patientInfo: 'Patient Information',
    doctorInfo: 'Doctor Information',
    symptomsDiagnosis: 'Symptoms & Diagnosis',
    medicines: 'Medicines',
    followUp: 'Follow-up',
    morning: 'Morning',
    afternoon: 'Afternoon',
    night: 'Night',
    remarks: 'Remarks',
    duration: 'Duration',
    medicine: 'Medicine',
    diagnosis: 'Diagnosis / Remarks',
    symptoms: 'Symptoms',
    instructions: 'Please follow up as scheduled.'
  },
  Hindi: {
    prescription: 'प्रिस्क्रिप्शन',
    patientInfo: 'रोगी जानकारी',
    doctorInfo: 'डॉक्टर जानकारी',
    symptomsDiagnosis: 'लक्षण और निदान',
    medicines: 'दवाइयां',
    followUp: 'फॉलो-अप',
    morning: 'सुबह',
    afternoon: 'दोपहर',
    night: 'रात',
    remarks: 'टिप्पणी',
    duration: 'अवधि',
    medicine: 'दवा',
    diagnosis: 'निदान / टिप्पणी',
    symptoms: 'लक्षण',
    instructions: 'कृपया निर्धारित समय पर फॉलो-अप करें।'
  },
  Tamil: {
    prescription: 'மருந்து சீட்டு',
    patientInfo: 'நோயாளர் விவரம்',
    doctorInfo: 'மருத்துவர் விவரம்',
    symptomsDiagnosis: 'அறிகுறிகள் மற்றும் நோயறிதல்',
    medicines: 'மருந்துகள்',
    followUp: 'மீண்டும் பரிசோதனை',
    morning: 'காலை',
    afternoon: 'மதியம்',
    night: 'இரவு',
    remarks: 'குறிப்புகள்',
    duration: 'காலம்',
    medicine: 'மருந்து',
    diagnosis: 'நோயறிதல் / குறிப்புகள்',
    symptoms: 'அறிகுறிகள்',
    instructions: 'திட்டமிட்டபடி மீண்டும் வரவும்.'
  },
  Bengali: {
    prescription: 'প্রেসক্রিপশন',
    patientInfo: 'রোগীর তথ্য',
    doctorInfo: 'ডাক্তারের তথ্য',
    symptomsDiagnosis: 'উপসর্গ ও রোগ নির্ণয়',
    medicines: 'ওষুধ',
    followUp: 'ফলো-আপ',
    morning: 'সকাল',
    afternoon: 'দুপুর',
    night: 'রাত',
    remarks: 'মন্তব্য',
    duration: 'সময়কাল',
    medicine: 'ওষুধ',
    diagnosis: 'রোগ নির্ণয় / মন্তব্য',
    symptoms: 'উপসর্গ',
    instructions: 'নির্ধারিত সময়ে ফলো-আপ করুন।'
  },
  Marathi: {
    prescription: 'प्रिस्क्रिप्शन',
    patientInfo: 'रुग्ण माहिती',
    doctorInfo: 'डॉक्टर माहिती',
    symptomsDiagnosis: 'लक्षणे आणि निदान',
    medicines: 'औषधे',
    followUp: 'फॉलो-अप',
    morning: 'सकाळ',
    afternoon: 'दुपार',
    night: 'रात्र',
    remarks: 'टीप',
    duration: 'कालावधी',
    medicine: 'औषध',
    diagnosis: 'निदान / टीप',
    symptoms: 'लक्षणे',
    instructions: 'कृपया नियोजित वेळी फॉलो-अप करा.'
  },
  Gujarati: {
    prescription: 'પ્રિસ્ક્રિપ્શન',
    patientInfo: 'દર્દીની માહિતી',
    doctorInfo: 'ડોક્ટરની માહિતી',
    symptomsDiagnosis: 'લક્ષણો અને નિદાન',
    medicines: 'દવાઓ',
    followUp: 'ફોલો-અપ',
    morning: 'સવાર',
    afternoon: 'બપોર',
    night: 'રાત',
    remarks: 'નોંધ',
    duration: 'અવધિ',
    medicine: 'દવા',
    diagnosis: 'નિદાન / નોંધ',
    symptoms: 'લક્ષણો',
    instructions: 'કૃપા કરીને નક્કી કરેલા સમયે ફોલો-અપ કરો.'
  },
  Assamese: {
    prescription: 'প্ৰেছক্ৰিপচন',
    patientInfo: 'ৰোগীৰ তথ্য',
    doctorInfo: 'চিকিৎসকৰ তথ্য',
    symptomsDiagnosis: 'লক্ষণ আৰু নিৰ্ণয়',
    medicines: 'ঔষধ',
    followUp: 'ফলো-আপ',
    morning: 'পুৱা',
    afternoon: 'দুপৰীয়া',
    night: 'ৰাতি',
    remarks: 'মন্তব্য',
    duration: 'সময়',
    medicine: 'ঔষধ',
    diagnosis: 'নিৰ্ণয় / মন্তব্য',
    symptoms: 'লক্ষণ',
    instructions: 'অনুগ্ৰহ কৰি নিৰ্ধাৰিত সময়ত ফলো-আপ কৰক।'
  },
  Telugu: {
    prescription: 'ప్రిస్క్రిప్షన్',
    patientInfo: 'రోగి సమాచారం',
    doctorInfo: 'డాక్టర్ సమాచారం',
    symptomsDiagnosis: 'లక్షణాలు మరియు నిర్ధారణ',
    medicines: 'మందులు',
    followUp: 'ఫాలో-అప్',
    morning: 'ఉదయం',
    afternoon: 'మధ్యాహ్నం',
    night: 'రాత్రి',
    remarks: 'గమనికలు',
    duration: 'వ్యవధి',
    medicine: 'మందు',
    diagnosis: 'నిర్ధారణ / గమనికలు',
    symptoms: 'లక్షణాలు',
    instructions: 'దయచేసి నిర్ణయించిన సమయంలో ఫాలో-అప్ చేయండి.'
  }
};

export const t = (language, key) => dictionary[language]?.[key] || dictionary.English[key] || key;

const clinicalTerms = {
  Hindi: {
    cough: 'खांसी',
    fever: 'बुखार',
    pain: 'दर्द',
    headache: 'सिरदर्द',
    cold: 'जुकाम',
    vomiting: 'उल्टी',
    weakness: 'कमजोरी',
    infection: 'संक्रमण',
    allergy: 'एलर्जी',
    rest: 'आराम',
    'after food': 'भोजन के बाद',
    'before food': 'भोजन से पहले',
    days: 'दिन',
    weeks: 'सप्ताह',
    months: 'महीने',
    years: 'वर्ष',
    hours: 'घंटे'
  },
  Tamil: {
    cough: 'இருமல்',
    fever: 'காய்ச்சல்',
    pain: 'வலி',
    headache: 'தலைவலி',
    cold: 'சளி',
    vomiting: 'வாந்தி',
    weakness: 'பலவீனம்',
    infection: 'தொற்று',
    allergy: 'ஒவ்வாமை',
    rest: 'ஓய்வு',
    'after food': 'உணவுக்குப் பிறகு',
    'before food': 'உணவுக்கு முன்',
    days: 'நாட்கள்',
    weeks: 'வாரங்கள்',
    months: 'மாதங்கள்',
    years: 'ஆண்டுகள்',
    hours: 'மணி நேரம்'
  }
};

const fallbackTerms = {
  Bengali: 'Hindi',
  Marathi: 'Hindi',
  Gujarati: 'Hindi',
  Assamese: 'Hindi',
  Telugu: 'Tamil'
};

export const translateClinicalText = (text = '', language = 'English') => {
  if (!text) return '-';
  if (language === 'English') return text;

  const termLanguage = clinicalTerms[language] ? language : fallbackTerms[language];
  const terms = clinicalTerms[termLanguage];
  if (!terms) return text;

  return Object.entries(terms).reduce((value, [source, target]) => {
    return value.replace(new RegExp(`\\b${source}\\b`, 'gi'), target);
  }, text);
};
