import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AppLayout from './layouts/AppLayout.jsx';
import Home from './pages/Home.jsx';
import Loader from './components/Loader.jsx';
import ModulePlaceholder from './pages/ModulePlaceholder.jsx';
import Login from './pages/auth/Login.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import CreateUser from './pages/admin/CreateUser.jsx';
import ManageDepartments from './pages/admin/ManageDepartments.jsx';
import PatientRegistration from './pages/reception/PatientRegistration.jsx';
import PatientList from './pages/reception/PatientList.jsx';
import PatientDetails from './pages/reception/PatientDetails.jsx';
import PatientFollowUps from './pages/reception/PatientFollowUps.jsx';
import AbhaDashboard from './pages/reception/abha/AbhaDashboard.jsx';
import DoctorDashboard from './pages/doctor/DoctorDashboard.jsx';
import DoctorPatientList from './pages/doctor/DoctorPatientList.jsx';
import CompletedConsultations from './pages/doctor/CompletedConsultations.jsx';
import CompletedConsultationDetails from './pages/doctor/CompletedConsultationDetails.jsx';
import ConsultationPage from './pages/doctor/ConsultationPage.jsx';
import PrescriptionPage from './pages/doctor/PrescriptionPage.jsx';
import PatientConsultationTrack from './pages/doctor/PatientConsultationTrack.jsx';
import DoctorOtPatients from './pages/doctor/DoctorOtPatients.jsx';
import DoctorOtForm from './pages/doctor/DoctorOtForm.jsx';
import DischargeRequestsView from './pages/doctor/DischargeRequestsView.jsx';
import EditPrintRxSettings from './pages/doctor/EditPrintRxSettings.jsx';
import SuperAdminLogin from './pages/superadmin/SuperAdminLogin.jsx';
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard.jsx';
import LabRedirect from './pages/lab/LabRedirect.jsx';
import HospitalSettings from './pages/admin/HospitalSettings.jsx';
import IpdAdminWorkspace from './pages/admin/IpdAdminWorkspace.jsx';
import ConsumableServiceSettings from './pages/admin/ConsumableServiceSettings.jsx';
import IpdAdmission from './pages/ipd/IpdAdmission.jsx';
import IpdPatientList from './pages/ipd/IpdPatientList.jsx';
import IpdDischargedPatients from './pages/ipd/IpdDischargedPatients.jsx';
import IpdPatientDetails from './pages/ipd/IpdPatientDetails.jsx';
import IpdServices from './pages/ipd/IpdServices.jsx';
import PharmacyWorkspace from './pages/pharmacy/PharmacyWorkspace.jsx';
import IpdOtForm from './pages/ipd/IpdOtForm.jsx';
import IpdOtFlow from './pages/ipd/IpdOtFlow.jsx';
import IpdDischargeForm from './pages/ipd/IpdDischargeForm.jsx';
import OperationTheatreSettings from './pages/admin/OperationTheatreSettings.jsx';
import IpdOtDashboard from './pages/ipd/IpdOtDashboard.jsx';
import IpdSameDayDashboard from './pages/ipd/IpdSameDayDashboard.jsx';
import SameDayCareSettings from './pages/admin/SameDayCareSettings.jsx';
import PharmacySettings from './pages/admin/PharmacySettings.jsx';
import DeleteDataPage from './pages/admin/DeleteDataPage.jsx';
import SameDayCareWorkspace from './pages/same-day-care/SameDayCareWorkspace.jsx';
import SameDayCareForm from './pages/same-day-care/SameDayCareForm.jsx';
import SameDayCareIpdPatients from './pages/same-day-care/SameDayCareIpdPatients.jsx';
import DialysisWorkspace from './pages/same-day-care/DialysisWorkspace.jsx';
import DialysisRecordForm from './pages/same-day-care/DialysisRecordForm.jsx';
import BillingPage from './pages/billing/BillingPage.jsx';
import DoctorIpdPatients from './pages/doctor/DoctorIpdPatients.jsx';
import IpdMedicationChart from './pages/ipd/IpdMedicationChart.jsx';

function App() {
  const { loading } = useAuth();

  // Show branded loader while verifying session on startup
  if (loading) {
    return <Loader />;
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/hospital/:hospitalId" element={<Home />} />
      <Route path="/hospital/:hospitalId/login" element={<Login />} />
      <Route path="/super-admin" element={<SuperAdminLogin />} />
      <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
      <Route path="/lab-assistant" element={<LabRedirect />} />
      <Route path="/lab-assistant/portal" element={<LabRedirect />} />
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
            <Route path="/admin/ot-settings" element={<OperationTheatreSettings />} />
            <Route path="/admin/same-day-care" element={<SameDayCareSettings />} />
            <Route path="/admin/pharmacy-settings" element={<PharmacySettings />} />
            <Route path="/admin/delete-data" element={<DeleteDataPage />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['admin', 'reception']} requiredModule={1} />}>
            <Route path="/reception/register" element={<PatientRegistration />} />
            <Route path="/reception/patients" element={<PatientList />} />
            <Route path="/reception/patients/:id" element={<PatientDetails />} />
            <Route path="/reception/follow-ups" element={<PatientFollowUps />} />
            <Route path="/reception/abha" element={<AbhaDashboard />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['admin', 'doctor']} />}>
            <Route path="/doctor" element={<DoctorDashboard />} />
            <Route path="/doctor/patients" element={<DoctorPatientList />} />
            <Route path="/doctor/completed" element={<CompletedConsultations />} />
            <Route path="/doctor/completed/:consultationId" element={<CompletedConsultationDetails />} />
            <Route path="/doctor/consultation/:patientId" element={<ConsultationPage />} />
            <Route path="/doctor/prescription/:patientId" element={<ConsultationPage />} />
            <Route path="/doctor/consultation-track/:patientId" element={<PatientConsultationTrack />} />
            <Route path="/doctor/ot-patients" element={<DoctorOtPatients />} />
            <Route path="/doctor/ot/:id" element={<DoctorOtForm />} />
            <Route path="/doctor/ipd-patients" element={<DoctorIpdPatients />} />
            <Route path="/doctor/ipd-chart/:id" element={<IpdMedicationChart />} />
            <Route path="/doctor/discharge-requests" element={<DischargeRequestsView />} />
            <Route path="/doctor/edit-print-rx" element={<EditPrintRxSettings />} />
          </Route>
          <Route path="/module/:moduleId" element={<ModulePlaceholder />} />
          <Route element={<ProtectedRoute allowedRoles={['admin', 'billing']} requiredModule={8} />}>
            <Route path="/module/8" element={<BillingPage />} />
          </Route>
          <Route path="/lab" element={<LabRedirect />} />
          <Route element={<ProtectedRoute allowedRoles={['admin', 'reception', 'ipd', 'doctor', 'nursing']} />}>
            <Route path="/ipd/patient/:id" element={<IpdPatientDetails />} />
            <Route path="/ipd/discharge/:id" element={<IpdDischargeForm />} />
            <Route path="/ipd/chart/:id" element={<IpdMedicationChart />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['admin', 'reception', 'ipd']} requiredModule={5} />}>
            <Route path="/ipd/admission" element={<IpdAdmission />} />
            <Route path="/ipd/patients" element={<IpdPatientList />} />
            <Route path="/ipd/discharged-patients" element={<IpdDischargedPatients />} />
            <Route path="/ipd/services" element={<IpdServices />} />
            <Route path="/ipd/ot-flow/:id" element={<IpdOtFlow />} />
            <Route path="/ipd/ot/:id" element={<IpdOtForm />} />
            <Route path="/ipd/ot-management" element={<IpdOtDashboard />} />
            <Route path="/ipd/same-day" element={<IpdSameDayDashboard />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['admin', 'nursing', 'reception', 'doctor']} requiredModule={6} />}>
            <Route path="/same-day-care" element={<SameDayCareWorkspace />} />
            <Route path="/same-day-care/treatment/:patientId" element={<SameDayCareForm />} />
            <Route path="/same-day-care/ipd-patients" element={<SameDayCareIpdPatients />} />
            <Route path="/same-day-care/ipd-chart/:id" element={<IpdMedicationChart />} />
            <Route path="/same-day-care/dialysis" element={<DialysisWorkspace />} />
            <Route path="/same-day-care/dialysis/treatment/:patientId" element={<DialysisRecordForm />} />
            <Route path="/same-day-care/discharge-requests" element={<DischargeRequestsView />} />
            <Route path="/same-day-care/billing" element={<BillingPage />} />
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