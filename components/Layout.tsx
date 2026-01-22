import React, { useState } from 'react';
import { UserRole } from '../types';
import { LogOut, Home, Calendar, Settings, Shield, User as UserIcon, Ticket, AlertTriangle, QrCode, Moon, Sun, Users, Menu, X, Wallet, Flag, BarChart3, LayoutDashboard } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  userRole: UserRole;
  currentView: string;
  onNavigate: (view: any) => void;
  onLogout: () => void;
  userName?: string;
  userProfilePic?: string;
  siteName?: string;
  maintenanceMode?: boolean;
  isDarkMode?: boolean;
  toggleDarkMode?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, userRole, onNavigate, onLogout, userName, userProfilePic, currentView, siteName = 'LiberiaConnect', maintenanceMode = false, isDarkMode, toggleDarkMode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const getNavItems = () => {
    switch (userRole) {
      case UserRole.ATTENDEE:
        return [
          { label: 'Browse Events', icon: Home, view: 'ATTENDEE_DASHBOARD' },
          { label: 'My Schedule', icon: Calendar, view: 'ATTENDEE_SCHEDULE' },
          { label: 'My Tickets', icon: Ticket, view: 'ATTENDEE_TICKETS' },
          { label: 'Settings', icon: Settings, view: 'ATTENDEE_SETTINGS' },
        ];
      case UserRole.ORGANIZER:
        return [
          { label: 'Dashboard', icon: Home, view: 'ORGANIZER_PANEL' },
          { label: 'Create Event', icon: Calendar, view: 'ORGANIZER_CREATE' }, // Sub-view logic handled in parent
          { label: 'Scan Tickets', icon: QrCode, view: 'ORGANIZER_SCANNER' },
          { label: 'Attendee List', icon: Users, view: 'ORGANIZER_ATTENDEES' },
        ];
      case UserRole.ADMIN:
        return [
          { label: 'Overview', icon: LayoutDashboard, view: 'ADMIN_DASHBOARD' },
          { label: 'Events', icon: Calendar, view: 'ADMIN_EVENTS' },
          { label: 'Users', icon: Users, view: 'ADMIN_USERS' },
          { label: 'Finance', icon: Wallet, view: 'ADMIN_FINANCE' },
          { label: 'Moderation', icon: Flag, view: 'ADMIN_REPORTS' },
          { label: 'Analytics', icon: BarChart3, view: 'ADMIN_ANALYTICS' },
          { label: 'Settings', icon: Settings, view: 'ADMIN_SETTINGS' },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  const handleNavigation = (view: string) => {
    onNavigate(view);
    setIsSidebarOpen(false); // Close sidebar on mobile after navigation
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden transition-colors duration-200">
      
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
              {siteName.substring(0, 2).toUpperCase()}
            </div>
            <span className="font-serif text-lg font-bold tracking-wide truncate max-w-[120px]" title={siteName}>{siteName}</span>
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
                <button
                  onClick={() => handleNavigation(item.view)}
                  className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                    currentView === item.view 
                      ? 'bg-liberia-red text-white shadow-lg' 
                      : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-3 shrink-0" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-blue-800 bg-liberia-blue/90 backdrop-blur-sm">
          {toggleDarkMode && (
            <button
              onClick={toggleDarkMode}
              className="w-full flex items-center justify-between mb-4 px-2 py-2 rounded-md hover:bg-blue-800 transition-colors text-left group text-blue-200 hover:text-white"
            >
              <div className="flex items-center">
                {isDarkMode ? <Sun size={16} className="mr-3 shrink-0" /> : <Moon size={16} className="mr-3 shrink-0" />}
                <span className="text-sm font-medium">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
              </div>
            </button>
          )}

          <button 
            onClick={() => handleNavigation('USER_PROFILE')}
            className="w-full flex items-center mb-4 px-2 py-2 rounded-md hover:bg-blue-800 transition-colors text-left group"
            title="Edit Profile"
          >
            <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center mr-3 group-hover:bg-blue-600 transition-colors overflow-hidden shrink-0">
              {userProfilePic ? (
                <img src={userProfilePic} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <UserIcon size={16} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{userName || 'User'}</p>
              <p className="text-xs text-blue-200 truncate group-hover:text-blue-100">{userRole}</p>
            </div>
            <Settings size={14} className="text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1" />
          </button>
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center px-4 py-2 rounded-md bg-blue-800 hover:bg-blue-700 text-sm transition-colors"
          >
            <LogOut className="w-4 h-4 mr-2 shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {maintenanceMode && userRole !== UserRole.ADMIN && (
            <div className="bg-red-600 text-white px-4 py-2 text-center text-sm font-bold flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 mr-2" />
                <span className="truncate">Maintenance Mode is Active</span>
            </div>
        )}
        
        {/* Mobile Header */}
        <header className="md:hidden bg-white dark:bg-gray-800 border-b dark:border-gray-700 h-16 px-4 flex items-center justify-between shrink-0 z-20">
            <div className="flex items-center">
               <button 
                 onClick={() => setIsSidebarOpen(true)} 
                 className="p-2 -ml-2 mr-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
               >
                  <Menu size={24} />
               </button>
               <span className="font-serif font-bold text-liberia-blue dark:text-blue-400 text-lg truncate">{siteName}</span>
            </div>
            {/* Optional: Add a small user avatar or notification icon here for mobile */}
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