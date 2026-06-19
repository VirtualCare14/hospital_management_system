import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles = [], requiredModule }) => {
  const { user, loading, hasAccess } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-orange-50/30">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check role restriction
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex h-[calc(100vh-120px)] flex-col items-center justify-center px-4 text-center">
        <h1 className="text-3xl font-bold text-red-500">Access Denied</h1>
        <p className="mt-2 text-gray-600 max-w-md">
          Your account role ({user.role}) does not have permission to view this section.
        </p>
      </div>
    );
  }

  // Check module access restriction
  if (requiredModule !== undefined && !hasAccess([requiredModule])) {
    return (
      <div className="flex h-[calc(100vh-120px)] flex-col items-center justify-center px-4 text-center">
        <h1 className="text-3xl font-bold text-red-500">Module Access Denied</h1>
        <p className="mt-2 text-gray-600 max-w-md">
          You do not have access to Module {requiredModule}. Please contact the administrator to request permissions.
        </p>
      </div>
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
