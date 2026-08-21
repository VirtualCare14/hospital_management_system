'use client';

import { useState } from 'react';
import { Search, Plus, X, User, Phone, Mail, MapPin, CreditCard, Clock } from 'lucide-react';
import api from '../lib/api';

export default function PatientDetails({ patientData, setPatientData }) {
  const [searching, setSearching] = useState(false);

  // Toggle optional field chips
  const [showFields, setShowFields] = useState({
    email: false,
    address: false,
    aadhaar: false,
    history: false
  });

  const toggleField = (field) => {
    setShowFields(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPatientData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePhoneSearch = async () => {
    if (!patientData.mobileNumber || patientData.mobileNumber.length < 5) return;
    setSearching(true);
    try {
      const res = await api.get(`/patients/lookup?mobile=${encodeURIComponent(patientData.mobileNumber)}`);
      if (res && res.patient) {
        const p = res.patient;
        setPatientData(prev => ({
          ...prev,
          patientId: p._id,
          uhid: p.uhid || '',
          title: p.title || 'Mr.',
          firstName: p.patientName ? p.patientName.split(' ')[0] : (p.firstName || ''),
          lastName: p.patientName ? p.patientName.split(' ').slice(1).join(' ') : (p.lastName || ''),
          gender: p.gender || 'Male',
          ageYears: p.age ? String(p.age) : '30',
          email: p.email || prev.email,
          address: p.address || prev.address,
          aadhaar: p.aadhaarNumber || prev.aadhaar,
          history: p.history || prev.history
        }));
        if (p.email) setShowFields(prev => ({ ...prev, email: true }));
        if (p.address) setShowFields(prev => ({ ...prev, address: true }));
        if (p.aadhaarNumber) setShowFields(prev => ({ ...prev, aadhaar: true }));
      }
    } catch (err) {
      console.log('No patient found with this mobile number, fill manually.');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <User className="w-4 h-4 text-orange-500" />
          <span>Patient Details</span>
        </h2>
        {patientData.uhid && (
          <span className="px-2.5 py-0.5 bg-orange-50 text-orange-700 rounded-md text-xs font-semibold border border-orange-200">
            UHID: {patientData.uhid}
          </span>
        )}
      </div>

      {/* Row 1: Mobile Search, Title, First Name, Last Name */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
        {/* Mobile Number */}
        <div className="md:col-span-4">
          <label className="lab-label">Mobile Number</label>
          <div className="flex items-center">
            <span className="h-9 px-2.5 bg-slate-100 border border-r-0 border-slate-200 rounded-l-lg text-xs font-semibold text-slate-600 flex items-center">
              +91
            </span>
            <div className="relative flex-1">
              <input
                type="text"
                name="mobileNumber"
                value={patientData.mobileNumber || ''}
                onChange={handleChange}
                onBlur={handlePhoneSearch}
                placeholder="Enter mobile no."
                className="w-full h-9 pl-3 pr-8 bg-white border border-slate-200 rounded-r-lg text-xs text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              />
              <button
                type="button"
                onClick={handlePhoneSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-orange-500"
              >
                <Search className={`w-3.5 h-3.5 ${searching ? 'animate-spin text-orange-500' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="md:col-span-2">
          <label className="lab-label">Title*</label>
          <select
            name="title"
            value={patientData.title || 'Mr.'}
            onChange={handleChange}
            className="lab-input text-xs"
          >
            <option value="Mr.">Mr.</option>
            <option value="Mrs.">Mrs.</option>
            <option value="Smt.">Smt.</option>
            <option value="Kumari">Kumari</option>
            <option value="Shri.">Shri.</option>
            <option value="Miss.">Miss.</option>
            <option value="Master">Master</option>
            <option value="Mohd.">Mohd.</option>
            <option value="Baby">Baby</option>
            <option value="Baby of">Baby of</option>
            <option value="Wife of">Wife of</option>
            <option value="Mother of">Mother of</option>
            <option value="Son of">Son of</option>
            <option value="Daughter of">Daughter of</option>
            <option value="Ms.">Ms.</option>
            <option value="Miss./Mrs.">Miss./Mrs.</option>
            <option value="Selvi">Selvi</option>
            <option value="Sk.">Sk.</option>
            <option value="PROF">PROF</option>
            <option value="Dr.">Dr.</option>
          </select>
        </div>

        {/* First Name */}
        <div className="md:col-span-3">
          <label className="lab-label lab-label-required">First Name</label>
          <input
            type="text"
            name="firstName"
            required
            value={patientData.firstName || ''}
            onChange={handleChange}
            placeholder="First name"
            className="lab-input"
          />
        </div>

        {/* Last Name */}
        <div className="md:col-span-3">
          <label className="lab-label">Last Name</label>
          <input
            type="text"
            name="lastName"
            value={patientData.lastName || ''}
            onChange={handleChange}
            placeholder="Last name"
            className="lab-input"
          />
        </div>
      </div>

      {/* Row 2: Sex & Age */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
        {/* Sex */}
        <div className="md:col-span-5">
          <label className="lab-label lab-label-required">Sex</label>
          <div className="flex items-center gap-2 h-9">
            {['Male', 'Female', 'Other'].map((g) => (
              <label
                key={g}
                className={`
                  flex-1 h-full flex items-center justify-center rounded-lg border text-xs font-medium cursor-pointer transition-colors
                  ${patientData.gender === g
                    ? 'border-orange-500 bg-orange-50 text-orange-700 font-semibold'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }
                `}
              >
                <input
                  type="radio"
                  name="gender"
                  value={g}
                  checked={patientData.gender === g}
                  onChange={handleChange}
                  className="sr-only"
                />
                <span>{g}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Age (Years, Months, Days) */}
        <div className="md:col-span-7">
          <label className="lab-label lab-label-required">Age</label>
          <div className="grid grid-cols-3 gap-2">
            <div className="relative">
              <input
                type="number"
                name="ageYears"
                min="0"
                max="120"
                value={patientData.ageYears || ''}
                onChange={handleChange}
                placeholder="Yrs"
                className="lab-input pr-9"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 font-medium pointer-events-none">
                Yrs
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                name="ageMonths"
                min="0"
                max="11"
                value={patientData.ageMonths || ''}
                onChange={handleChange}
                placeholder="M"
                className="lab-input pr-8"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 font-medium pointer-events-none">
                M
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                name="ageDays"
                min="0"
                max="31"
                value={patientData.ageDays || ''}
                onChange={handleChange}
                placeholder="D"
                className="lab-input pr-8"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 font-medium pointer-events-none">
                D
              </span>
            </div>
          </div>
        </div>
      </div>



      {/* Expandable chips for additional details */}
      <div className="pt-2 border-t border-slate-100">
        <div className="flex flex-wrap items-center gap-2">
          {!showFields.email && (
            <button
              type="button"
              onClick={() => toggleField('email')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-orange-50 text-slate-600 hover:text-orange-600 text-xs font-medium border border-slate-200/80 transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Email</span>
            </button>
          )}
          {!showFields.address && (
            <button
              type="button"
              onClick={() => toggleField('address')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-orange-50 text-slate-600 hover:text-orange-600 text-xs font-medium border border-slate-200/80 transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Address</span>
            </button>
          )}
          {!showFields.aadhaar && (
            <button
              type="button"
              onClick={() => toggleField('aadhaar')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-orange-50 text-slate-600 hover:text-orange-600 text-xs font-medium border border-slate-200/80 transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Aadhaar</span>
            </button>
          )}
          {!showFields.history && (
            <button
              type="button"
              onClick={() => toggleField('history')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-orange-50 text-slate-600 hover:text-orange-600 text-xs font-medium border border-slate-200/80 transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Patient History</span>
            </button>
          )}
        </div>

        {/* Dynamic Expanded Input Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          {showFields.email && (
            <div className="relative">
              <label className="lab-label flex items-center justify-between">
                <span>Email Address</span>
                <button type="button" onClick={() => toggleField('email')} className="text-slate-400 hover:text-red-500">
                  <X className="w-3 h-3" />
                </button>
              </label>
              <input
                type="email"
                name="email"
                value={patientData.email || ''}
                onChange={handleChange}
                placeholder="patient@example.com"
                className="lab-input"
              />
            </div>
          )}

          {showFields.address && (
            <div className="relative">
              <label className="lab-label flex items-center justify-between">
                <span>Residential Address</span>
                <button type="button" onClick={() => toggleField('address')} className="text-slate-400 hover:text-red-500">
                  <X className="w-3 h-3" />
                </button>
              </label>
              <input
                type="text"
                name="address"
                value={patientData.address || ''}
                onChange={handleChange}
                placeholder="Street address, city, pin code"
                className="lab-input"
              />
            </div>
          )}

          {showFields.aadhaar && (
            <div className="relative">
              <label className="lab-label flex items-center justify-between">
                <span>Aadhaar Number</span>
                <button type="button" onClick={() => toggleField('aadhaar')} className="text-slate-400 hover:text-red-500">
                  <X className="w-3 h-3" />
                </button>
              </label>
              <input
                type="text"
                name="aadhaar"
                value={patientData.aadhaar || ''}
                onChange={handleChange}
                placeholder="12-digit Aadhaar number"
                className="lab-input"
              />
            </div>
          )}

          {showFields.history && (
            <div className="relative md:col-span-2">
              <label className="lab-label flex items-center justify-between">
                <span>Clinical Notes & Patient History</span>
                <button type="button" onClick={() => toggleField('history')} className="text-slate-400 hover:text-red-500">
                  <X className="w-3 h-3" />
                </button>
              </label>
              <textarea
                name="history"
                rows="2"
                value={patientData.history || ''}
                onChange={handleChange}
                placeholder="Fasting status, ongoing medications, medical conditions..."
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
