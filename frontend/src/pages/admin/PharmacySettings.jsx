import BillingSettingsView from '../pharmacy/BillingSettingsView';

const PharmacySettings = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Pharmacy Settings</h1>
        <p className="text-sm text-gray-500">Configure billing parameters, tax configuration, and manage the medicine inventory database.</p>
      </div>

      <BillingSettingsView isAdmin={true} />
    </div>
  );
};

export default PharmacySettings;
