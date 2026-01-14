import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Navbar } from './Navbar';
import { LoadingScreen } from '../ui';

export function Layout() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen message="Loading your care dashboard..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-transparent flex flex-col">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-grow w-full">
        <Outlet />
      </main>
      <footer className="border-t border-[#d2d2d7] bg-[#f5f5f7] mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center space-y-2">
            <p className="text-[13px] text-[#86868b] font-medium">Connecting hearts, one moment at a time.</p>
            <p className="text-[11px] text-[#86868b]">Copyrights. 2026.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
