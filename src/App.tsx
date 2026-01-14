import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout/Layout';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Dashboard } from './pages/Dashboard';
import { Profile } from './pages/Profile';
import { MemoryBook } from './pages/MemoryBook';
import { LogInteraction } from './pages/LogInteraction';
import { Suggestions } from './pages/Suggestions';
import { Preferences } from './pages/Preferences';
import { Analytics } from './pages/Analytics';
import { FamilyPortal } from './pages/FamilyPortal';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/family/:shareId" element={<FamilyPortal />} />

          {/* Protected routes */}
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/memory-book" element={<MemoryBook />} />
            <Route path="/memory-book/new" element={<LogInteraction />} />
            <Route path="/suggestions" element={<Suggestions />} />
            <Route path="/preferences" element={<Preferences />} />
            <Route path="/analytics" element={<Analytics />} />
          </Route>

          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
