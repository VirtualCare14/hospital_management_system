const StatCard = ({ icon: Icon, label, value }) => (
  <div className="card p-5">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-semibold text-gray-500">{label}</p>
        <p className="mt-2 text-3xl font-extrabold text-gray-800">{value}</p>
      </div>
      <div className="rounded-2xl bg-orange-100 p-3 text-orange-600">
        <Icon className="h-6 w-6" />
      </div>
    </div>
  </div>
);

export default StatCard;
