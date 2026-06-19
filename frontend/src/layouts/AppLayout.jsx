import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Sidebar from '../components/Sidebar.jsx';

const AppLayout = () => (
  <div className="min-h-screen bg-orange-50/70">
    <div className="flex">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <Navbar />
        <main className="p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  </div>
);

export default AppLayout;
