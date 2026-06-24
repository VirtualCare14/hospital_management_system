import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import IpdMedicationChartContent from './IpdMedicationChartContent';

const IpdMedicationChart = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Workspace Back Link */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 rounded-xl hover:bg-orange-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            IPD Inpatient Medication Chart
          </h1>
          <p className="text-sm text-gray-500">Workspace Portal</p>
        </div>
      </div>

      <IpdMedicationChartContent admissionId={id} />
    </div>
  );
};

export default IpdMedicationChart;
