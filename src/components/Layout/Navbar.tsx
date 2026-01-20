import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui';
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
    <nav className="bg-[#f5f5f7]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-[80px] items-center">
          {/* Minimal Logo */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center gap-2 group">
              <Heart className="h-4 w-4 text-[#1d1d1f]" fill="#1d1d1f" />
              <span className="font-semibold text-[17px] text-[#1d1d1f] tracking-tight">
                CareConnect
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-[60px]">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'text-[14px] text-[#1d1d1f]/80 hover:text-[#0071e3] transition-colors',
                    isActive && 'text-[#1d1d1f]'
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Use Menu */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-4">
              <span className="text-[14px] text-[#1d1d1f] hover:text-[#1d1d1f]/70 transition-colors cursor-pointer">
                {caregiver?.name}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="hidden md:flex hover:bg-black/5 rounded-full p-2">
              <LogOut className="h-4 w-4 text-[#1d1d1f]" />
            </Button>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[#1d1d1f]"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#d2d2d7] bg-[#f5f5f7] absolute w-full left-0 z-50 shadow-lg">
          <div className="px-8 py-8 space-y-4">
            {navItems.map((item) => {
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-[28px] font-bold text-[#1d1d1f] leading-tight hover:text-[#1d1d1f]/70 transition-colors"
                >
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={handleSignOut}
              className="block text-[17px] text-[#1d1d1f] mt-8 pt-8 border-t border-[#d2d2d7] w-full text-left"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
