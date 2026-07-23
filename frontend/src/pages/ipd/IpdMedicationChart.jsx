import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ClipboardList, Pill } from 'lucide-react';
import IpdMedicationChartContent from './IpdMedicationChartContent';
import IpdServicesTracker from './IpdServicesTracker';

const IpdMedicationChart = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('med-chart');

  return (
    <div className="space-y-6">
      {/* Workspace Back Link */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 rounded-xl hover:bg-orange-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              IPD Inpatient Portal
            </h1>
            <p className="text-sm text-gray-500">Workspace Portal</p>
          </div>
        </div>

        {/* Tab Selectors */}
        <div className="flex items-center gap-2 bg-orange-50/50 p-1.5 rounded-2xl border border-orange-100/50">
          <button 
            onClick={() => setActiveTab('med-chart')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'med-chart' ? 'bg-orange-500 text-white shadow-md' : 'text-orange-950 hover:bg-orange-100/50'
            }`}
          >
            <Pill className="h-3.5 w-3.5" />
            Medication Chart
          </button>
          <button 
            onClick={() => setActiveTab('services-tracker')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'services-tracker' ? 'bg-orange-500 text-white shadow-md' : 'text-orange-950 hover:bg-orange-100/50'
            }`}
          >
            <ClipboardList className="h-3.5 w-3.5" />
            Patient Services Tracker
          </button>
        </div>
      </div>

      {activeTab === 'med-chart' ? (
        <IpdMedicationChartContent admissionId={id} />
      ) : (
        <IpdServicesTracker admissionId={id} />
      )}
    </div>
  );
};

export default IpdMedicationChart;
