import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Avatar, Button } from '../ui';
import {
  Home,
  BookOpen,
  Lightbulb,
  Heart,
  User,
  LogOut,
  Menu,
  X,
  BarChart3,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/utils';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: Home },
  { path: '/memory-book', label: 'Memory Book', icon: BookOpen },
  { path: '/suggestions', label: 'Suggestions', icon: Lightbulb },
  { path: '/preferences', label: 'Preferences', icon: Heart },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/profile', label: 'Profile', icon: User },
];

export function Navbar() {
  const { caregiver, signOut } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  return (
    <nav className="bg-white/80 backdrop-blur-xl border-b-2 border-[#D4725A]/10 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          {/* Elegant Logo */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center gap-3 group">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#D4725A] to-[#C85A44] flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-2xl bg-gradient-to-r from-[#D4725A] to-[#C85A44] bg-clip-text text-transparent tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                CareConnect
              </span>
            </Link>
          </div>

          {/* Elegant Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-300',
                    isActive
                      ? 'bg-gradient-to-br from-[#FBDDD0] to-[#FDEEE7] text-[#D4725A] shadow-md'
                      : 'text-[#5C5550] hover:bg-[#FEF8F5] hover:text-[#D4725A]'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Refined User Menu */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-[#2D312A]">{caregiver?.name}</p>
                <p className="text-xs text-[#5C5550]/60">{caregiver?.role || 'Caregiver'}</p>
              </div>
              <Avatar fallback={caregiver?.name} size="sm" className="ring-2 ring-[#D4725A]/20" />
            </div>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="hidden md:flex hover:bg-[#FEF8F5]">
              <LogOut className="h-4 w-4" />
            </Button>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-2xl text-[#5C5550] hover:bg-[#FEF8F5] transition-colors"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Beautiful Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t-2 border-[#D4725A]/10 bg-white/95 backdrop-blur-xl">
          <div className="px-4 py-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300',
                    isActive
                      ? 'bg-gradient-to-br from-[#FBDDD0] to-[#FDEEE7] text-[#D4725A] shadow-md'
                      : 'text-[#5C5550] hover:bg-[#FEF8F5] hover:text-[#D4725A]'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-red-600 hover:bg-red-50 w-full transition-all"
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
