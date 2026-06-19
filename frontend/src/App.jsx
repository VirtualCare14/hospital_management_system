import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AppLayout from './layouts/AppLayout.jsx';
import Home from './pages/Home.jsx';
import ModulePlaceholder from './pages/ModulePlaceholder.jsx';
import Login from './pages/auth/Login.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import CreateUser from './pages/admin/CreateUser.jsx';
import ManageDepartments from './pages/admin/ManageDepartments.jsx';
import PatientRegistration from './pages/reception/PatientRegistration.jsx';
import PatientList from './pages/reception/PatientList.jsx';
import PatientDetails from './pages/reception/PatientDetails.jsx';
import DoctorDashboard from './pages/doctor/DoctorDashboard.jsx';
import DoctorPatientList from './pages/doctor/DoctorPatientList.jsx';
import CompletedConsultations from './pages/doctor/CompletedConsultations.jsx';
import CompletedConsultationDetails from './pages/doctor/CompletedConsultationDetails.jsx';
import ConsultationPage from './pages/doctor/ConsultationPage.jsx';
import PrescriptionPage from './pages/doctor/PrescriptionPage.jsx';
import PatientConsultationTrack from './pages/doctor/PatientConsultationTrack.jsx';
import SuperAdminLogin from './pages/superadmin/SuperAdminLogin.jsx';
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard.jsx';
import LabWorkspace from './pages/lab/LabWorkspace.jsx';
import LabAssistantLogin from './pages/lab/LabAssistantLogin.jsx';
import LabAssistantPortal from './pages/lab/LabAssistantPortal.jsx';
import HospitalSettings from './pages/admin/HospitalSettings.jsx';
import IpdAdminWorkspace from './pages/admin/IpdAdminWorkspace.jsx';
import ConsumableServiceSettings from './pages/admin/ConsumableServiceSettings.jsx';
import MedicineSettings from './pages/admin/MedicineSettings.jsx';
import IpdAdmission from './pages/ipd/IpdAdmission.jsx';
import IpdPatientList from './pages/ipd/IpdPatientList.jsx';
import IpdPatientDetails from './pages/ipd/IpdPatientDetails.jsx';
import IpdServices from './pages/ipd/IpdServices.jsx';
import PharmacyWorkspace from './pages/pharmacy/PharmacyWorkspace.jsx';
import IpdOtForm from './pages/ipd/IpdOtForm.jsx';
import IpdOtFlow from './pages/ipd/IpdOtFlow.jsx';
import IpdDischargeForm from './pages/ipd/IpdDischargeForm.jsx';
import OperationTheatreSettings from './pages/admin/OperationTheatreSettings.jsx';
import IpdOtDashboard from './pages/ipd/IpdOtDashboard.jsx';
import SameDayTreatmentSettings from './pages/admin/SameDayTreatmentSettings.jsx';
import NursingWorkspace from './pages/nursing/NursingWorkspace.jsx';
import SameDayTreatmentForm from './pages/nursing/SameDayTreatmentForm.jsx';
import BillingPage from './pages/billing/BillingPage.jsx';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/hospital/:hospitalId" element={<Home />} />
      <Route path="/hospital/:hospitalId/login" element={<Login />} />
      <Route path="/super-admin" element={<SuperAdminLogin />} />
      <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
      <Route path="/lab-assistant" element={<LabAssistantLogin />} />
      <Route element={<ProtectedRoute allowedRoles={['lab']} />}>
        <Route path="/lab-assistant/portal" element={<LabAssistantPortal />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<CreateUser />} />
            <Route path="/admin/departments" element={<ManageDepartments />} />
            <Route path="/admin/hospital-settings" element={<HospitalSettings />} />          </Route>
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin/room-settings" element={<IpdAdminWorkspace />} />
            <Route path="/admin/consumable-services" element={<ConsumableServiceSettings />} />
            <Route path="/admin/medicine-settings" element={<MedicineSettings />} />
            <Route path="/admin/ot-settings" element={<OperationTheatreSettings />} />
            <Route path="/admin/same-day-treatment" element={<SameDayTreatmentSettings />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['admin', 'reception']} requiredModule={1} />}>
            <Route path="/reception/register" element={<PatientRegistration />} />
            <Route path="/reception/patients" element={<PatientList />} />
            <Route path="/reception/patients/:id" element={<PatientDetails />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['admin', 'doctor']} />}>
            <Route path="/doctor" element={<DoctorDashboard />} />
            <Route path="/doctor/patients" element={<DoctorPatientList />} />
            <Route path="/doctor/completed" element={<CompletedConsultations />} />
            <Route path="/doctor/completed/:consultationId" element={<CompletedConsultationDetails />} />
            <Route path="/doctor/consultation/:patientId" element={<ConsultationPage />} />
            <Route path="/doctor/prescription/:patientId" element={<PrescriptionPage />} />
            <Route path="/doctor/consultation-track/:patientId" element={<PatientConsultationTrack />} />
          </Route>
          <Route path="/module/:moduleId" element={<ModulePlaceholder />} />
          <Route element={<ProtectedRoute allowedRoles={['admin', 'billing']} requiredModule={8} />}>
            <Route path="/module/8" element={<BillingPage />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['admin', 'lab']} requiredModule={4} />}>
            <Route path="/lab" element={<LabWorkspace />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['admin', 'reception', 'ipd']} requiredModule={5} />}>
            <Route path="/ipd/admission" element={<IpdAdmission />} />
            <Route path="/ipd/patients" element={<IpdPatientList />} />
            <Route path="/ipd/patient/:id" element={<IpdPatientDetails />} />
            <Route path="/ipd/services" element={<IpdServices />} />
            <Route path="/ipd/ot-flow/:id" element={<IpdOtFlow />} />
            <Route path="/ipd/ot/:id" element={<IpdOtForm />} />
            <Route path="/ipd/discharge/:id" element={<IpdDischargeForm />} />
            <Route path="/ipd/ot-management" element={<IpdOtDashboard />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['admin', 'nursing']} requiredModule={6} />}>
            <Route path="/nursing" element={<NursingWorkspace />} />
            <Route path="/nursing/treatment/:patientId" element={<SameDayTreatmentForm />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['admin', 'pharmacy']} requiredModule={7} />}>
            <Route path="/pharmacy" element={<PharmacyWorkspace />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;