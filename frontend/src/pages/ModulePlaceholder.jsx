import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getModuleById } from '../utils/moduleRoutes';

const ModulePlaceholder = () => {
  const { moduleId } = useParams();
  const { user } = useAuth();
  const module = getModuleById(moduleId);
  const hasAccess = user?.role === 'admin' || user?.moduleAccess?.includes(Number(moduleId));

  if (!hasAccess) {
    return (
      <div className="card p-6">
        <p className="text-sm font-bold text-red-600">Access denied</p>
        <h1 className="mt-1 text-2xl font-extrabold text-gray-900">Module {moduleId} is not assigned to this user</h1>
        <p className="mt-2 text-sm text-gray-500">Ask admin to assign this module from the admin dashboard.</p>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <p className="text-sm font-bold text-orange-600">Module {moduleId}</p>
      <h1 className="mt-1 text-2xl font-extrabold text-gray-900">{module?.title || 'Module'} Access Granted</h1>
      <p className="mt-2 max-w-2xl text-sm text-gray-500">
        This module has its own login and permission path, so it can be opened from a separate system or device using credentials created by admin. The current working scope includes Modules 1, 2, and 3; this module page is reserved for future implementation.
      </p>
    </div>
  );
};

export default ModulePlaceholder;
