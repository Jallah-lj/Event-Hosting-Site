import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import {
  LogOut, Home, Calendar, Settings, User as UserIcon, Ticket,
  QrCode, Moon, Sun, Users, Menu, X, Wallet,
  Flag, BarChart3, LayoutDashboard, PlusCircle
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark';
    }
    return false;
  });

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const newValue = !prev;
      localStorage.setItem('theme', newValue ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', newValue);
      return newValue;
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getNavItems = () => {
    switch (user?.role) {
      case UserRole.ATTENDEE:
        return [
          { label: 'Browse Events', icon: Home, path: '/dashboard' },
          { label: 'My Schedule', icon: Calendar, path: '/schedule' },
          { label: 'My Tickets', icon: Ticket, path: '/tickets' },
          { label: 'Settings', icon: Settings, path: '/settings' },
        ];
      case UserRole.ORGANIZER:
        return [
          { label: 'Dashboard', icon: Home, path: '/organizer' },
          { label: 'Create Event', icon: PlusCircle, path: '/organizer/create' },
          { label: 'Scan Tickets', icon: QrCode, path: '/organizer/scanner' },
          { label: 'Attendees', icon: Users, path: '/organizer/attendees' },
          { label: 'Team', icon: Users, path: '/organizer/team' },
          { label: 'Settings', icon: Settings, path: '/organizer/settings' },
        ];
      case UserRole.MODERATOR:
        return [
          { label: 'Dashboard', icon: Home, path: '/moderator' },
          { label: 'Attendees', icon: Users, path: '/moderator/attendees' },
          { label: 'Scan Tickets', icon: QrCode, path: '/moderator/scanner' },
          { label: 'Broadcasts', icon: Flag, path: '/moderator/broadcasts' },
        ];
      case UserRole.ADMIN:
        return [
          { label: 'Overview', icon: LayoutDashboard, path: '/admin' },
          { label: 'Events', icon: Calendar, path: '/admin/events' },
          { label: 'Users', icon: Users, path: '/admin/users' },
          { label: 'Finance', icon: Wallet, path: '/admin/finance' },
          { label: 'Moderation', icon: Flag, path: '/admin/reports' },
          { label: 'Analytics', icon: BarChart3, path: '/admin/analytics' },
          { label: 'Settings', icon: Settings, path: '/admin/settings' },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <div className={`flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden ${isDarkMode ? 'dark' : ''}`}>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-liberia-blue text-white flex flex-col flex-shrink-0 pattern-bg shadow-xl transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-blue-800 flex items-center justify-between bg-liberia-blue/90 backdrop-blur-sm h-20">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-liberia-red flex items-center justify-center font-serif font-bold text-white border-2 border-white shrink-0">
              LC
            </div>
            <span className="font-serif text-lg font-bold tracking-wide">LiberiaConnect</span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden text-blue-200 hover:text-white p-1 rounded-md hover:bg-blue-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 bg-liberia-blue/90 backdrop-blur-sm">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => (
              <li key={item.label}>
                <NavLink
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={({ isActive }) => `
                    w-full flex items-center px-4 py-3 rounded-lg transition-colors
                    ${isActive
                      ? 'bg-liberia-red text-white shadow-lg'
                      : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                    }
                  `}
                >
                  <item.icon className="w-5 h-5 mr-3 shrink-0" />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-blue-800 bg-liberia-blue/90 backdrop-blur-sm">
          <button
            onClick={toggleDarkMode}
            className="w-full flex items-center justify-between mb-4 px-2 py-2 rounded-md hover:bg-blue-800 transition-colors text-left group text-blue-200 hover:text-white"
          >
            <div className="flex items-center">
              {isDarkMode ? <Sun size={16} className="mr-3 shrink-0" /> : <Moon size={16} className="mr-3 shrink-0" />}
              <span className="text-sm font-medium">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </div>
          </button>

          <NavLink
            to="/profile"
            onClick={() => setIsSidebarOpen(false)}
            className="w-full flex items-center mb-4 px-2 py-2 rounded-md hover:bg-blue-800 transition-colors text-left group"
          >
            <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center mr-3 group-hover:bg-blue-600 transition-colors overflow-hidden shrink-0">
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <UserIcon size={16} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-blue-200 truncate">{user?.role}</p>
            </div>
          </NavLink>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-4 py-2 rounded-md bg-blue-800 hover:bg-blue-700 text-sm transition-colors"
          >
            <LogOut className="w-4 h-4 mr-2 shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Mobile Header */}
        <header className="md:hidden bg-white dark:bg-gray-800 border-b dark:border-gray-700 h-16 px-4 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 mr-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
            >
              <Menu size={24} />
            </button>
            <span className="font-serif font-bold text-liberia-blue dark:text-blue-400 text-lg truncate">LiberiaConnect</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
