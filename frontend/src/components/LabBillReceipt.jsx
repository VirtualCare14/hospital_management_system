import React, { useState, useEffect } from 'react';
import { Printer, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

// Utility to convert number to words
function amountInWords(num) {
  const n = Math.round(num || 0);
  if (n === 0) return 'Zero rupees only';
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (val) => {
    if (val < 20) return a[val];
    if (val < 100) return b[Math.floor(val / 10)] + (val % 10 !== 0 ? ' ' + a[val % 10] : '');
    if (val < 1000) return a[Math.floor(val / 100)] + ' Hundred' + (val % 100 !== 0 ? ' ' + inWords(val % 100) : '');
    if (val < 100000) return inWords(Math.floor(val / 1000)) + ' Thousand' + (val % 1000 !== 0 ? ' ' + inWords(val % 1000) : '');
    if (val < 10000000) return inWords(Math.floor(val / 100000)) + ' Lakh' + (val % 100000 !== 0 ? ' ' + inWords(val % 100000) : '');
    return inWords(Math.floor(val / 10000000)) + ' Crore' + (val % 10000000 !== 0 ? ' ' + inWords(val % 10000000) : '');
  };

  const words = inWords(n);
  return `${words.charAt(0).toUpperCase() + words.slice(1).toLowerCase()} rupees only`;
}

export default function LabBillReceipt({ billData, hospitalSettings: initialHospital, onClose }) {
  const { user } = useAuth();
  const [hospital, setHospital] = useState(initialHospital || null);

  useEffect(() => {
    if (!hospital) {
      // Fetch Hospital Settings from Admin module
      client.get('/admin/hospital-settings')
        .then((res) => {
          if (res && res.data) {
            const hospData = res.data.data || res.data;
            setHospital(hospData);
          }
        })
        .catch(() => {});
    }
  }, [hospital]);

  if (!billData) return null;

  const {
    billNo = '1072',
    categoryBadge = 'L1',
    patientName = 'Mr. Ravi Shukla',
    ageSex = '25 YRS / M',
    mobileNumber = '8949895216',
    referredBy = 'Self',
    date = new Date().toLocaleDateString('en-GB'),
    receivedBy: rawReceivedBy,
    investigations = [
      { sno: 1, name: 'Dengue IgG', amount: 100 }
    ],
    totalAmount = 100,
    amountPaid = 100
  } = billData;

  const receivedBy = rawReceivedBy || user?.doctorName || user?.name || user?.username || 'Staff';

  const hospitalName = hospital?.hospitalName || user?.hospitalName || 'Prayascare Hospital';
  
  // Format hospital contact numbers
  const getHospitalPhone = () => {
    const phones = [];
    if (Array.isArray(hospital?.mobileNumbers) && hospital.mobileNumbers.length > 0) {
      phones.push(...hospital.mobileNumbers.filter(Boolean));
    }
    if (Array.isArray(hospital?.phoneNumbers) && hospital.phoneNumbers.length > 0) {
      hospital.phoneNumbers.forEach(p => {
        const num = typeof p === 'object' ? p.number : p;
        if (num && !phones.includes(num)) phones.push(num);
      });
    }
    if (hospital?.phone && !phones.includes(hospital.phone)) {
      phones.push(hospital.phone);
    }
    if (hospital?.alternateMobileNumber && !phones.includes(hospital.alternateMobileNumber)) {
      phones.push(hospital.alternateMobileNumber);
    }
    return phones.length > 0 ? phones.join(', ') : (hospital?.phone || '');
  };

  const hospitalPhone = getHospitalPhone();
  const logoUrl = hospital?.logoUrl || '';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      {/* Dynamic isolated print styles */}
      <style>{`
        @media print {
          @page {
            margin: 0;
            size: portrait;
          }

          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            height: 100% !important;
            overflow: hidden !important;
          }

          body * {
            visibility: hidden !important;
          }

          .lab-receipt-print-area,
          .lab-receipt-print-area * {
            visibility: visible !important;
          }

          .lab-receipt-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 15mm 12mm !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: #ffffff !important;
            font-size: 11px !important;
            line-height: 1.35 !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
          }

          .no-print,
          .no-print * {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-3xl w-full p-6 space-y-6 animate-in fade-in zoom-in-95 my-8">
        
        {/* ACTION BAR (Hidden when printing) */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 no-print">
          <h3 className="text-base font-bold text-slate-800">Lab Bill Receipt</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Receipt</span>
            </button>
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold cursor-pointer transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* PRINTABLE RECEIPT CONTENT CONTAINER */}
        <div className="lab-receipt-print-area print-area bg-white text-slate-900 font-sans p-4 space-y-3 border border-slate-200 rounded-lg">
          
          {/* HEADER: Hospital details with logo from Admin module */}
          <div className="flex items-start justify-between border-b border-slate-300 pb-3">
            <div className="flex items-center gap-3">
              {logoUrl && (
                <img
                  src={logoUrl}
                  alt="Hospital Logo"
                  className="h-12 w-auto object-contain shrink-0"
                />
              )}
              <div>
                <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
                  {hospitalName}
                </h1>
                {hospitalPhone && (
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    Phone no.: {hospitalPhone}
                  </p>
                )}
                {hospital?.address && (
                  <p className="text-xs text-slate-500">{hospital.address}</p>
                )}
              </div>
            </div>
          </div>

          {/* BILL NO */}
          <div className="py-1">
            <p className="text-xs font-bold text-slate-900">
              Bill / Reg. No. {billNo}
            </p>
          </div>

          {/* PATIENT DETAILS GRID */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 border-t border-b border-slate-300 py-2.5 text-xs font-semibold text-slate-800">
            <div>
              <span className="text-slate-900">Name : </span>
              <span className="font-extrabold">{patientName}</span>
            </div>
            <div>
              <span className="text-slate-900">Referred by : </span>
              <span className="font-extrabold">{referredBy}</span>
            </div>

            <div>
              <span className="text-slate-900">Age / Sex : </span>
              <span className="font-extrabold">{ageSex}</span>
            </div>
            <div>
              <span className="text-slate-900">Date : </span>
              <span className="font-extrabold">{date}</span>
            </div>

            <div>
              <span className="text-slate-900">Mobile number : </span>
              <span className="font-extrabold">{mobileNumber}</span>
            </div>
            <div>
              <span className="text-slate-900">Received by : </span>
              <span className="font-extrabold">{receivedBy}</span>
            </div>
          </div>

          {/* INVESTIGATIONS TABLE */}
          <div className="pt-1">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-900 text-slate-900 font-extrabold">
                  <th className="py-1.5 w-14">S. NO.</th>
                  <th className="py-1.5">INVESTIGATIONS</th>
                  <th className="py-1.5 text-right w-24">AMOUNT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800 font-semibold">
                {investigations.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-1.5">{item.sno || idx + 1}.</td>
                    <td className="py-1.5">{item.name}</td>
                    <td className="py-1.5 text-right font-extrabold text-slate-900">
                      Rs.{item.amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* SUMMARY TOTALS ON RIGHT */}
          <div className="pt-2 border-t border-slate-300 flex justify-end">
            <div className="w-72 space-y-1.5 text-xs font-semibold text-slate-800">
              <div className="flex justify-between py-0.5 border-b border-slate-200">
                <span>Total amount</span>
                <span className="font-extrabold text-slate-900">Rs.{totalAmount}</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-slate-200">
                <span>Amount paid</span>
                <span className="font-extrabold text-slate-900">Rs.{amountPaid}</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-slate-200">
                <span>Amount Paid (in words):</span>
                <span className="font-bold text-slate-900 text-[11px] text-right pl-2">
                  {amountInWords(amountPaid)}
                </span>
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="pt-4 text-center text-xs font-bold text-slate-700">
            ~~~ Thank You ~~~
          </div>

        </div>

      </div>
    </div>
  );
}
