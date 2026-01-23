import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { UserRole } from './types';

// Pages
import LandingPage from './pages/LandingPage';
import SignIn from './pages/auth/SignIn';
import SignUp from './pages/auth/SignUp';
import ForgotPassword from './pages/auth/ForgotPassword';

// Protected Pages
import AttendeeDashboard from './pages/attendee/Dashboard';
import AttendeeSchedule from './pages/attendee/Schedule';
import AttendeeTickets from './pages/attendee/Tickets';
import AttendeeSettings from './pages/attendee/Settings';

import OrganizerDashboard from './pages/organizer/Dashboard';
import OrganizerCreateEvent from './pages/organizer/CreateEvent';
import OrganizerScanner from './pages/organizer/Scanner';
import OrganizerAttendees from './pages/organizer/Attendees';
import OrganizerSettings from './pages/organizer/Settings';
import TeamManagement from './pages/organizer/TeamManagement';

import ScannerDashboard from './pages/scanner/Dashboard';

import ModeratorDashboard from './pages/moderator/Dashboard';
import ModeratorAttendees from './pages/moderator/Attendees';
import ModeratorScanner from './pages/moderator/Scanner';
import ModeratorBroadcasts from './pages/moderator/Broadcasts';

import AdminDashboard from './pages/admin/Dashboard';
import AdminEvents from './pages/admin/Events';
import AdminUsers from './pages/admin/Users';
import AdminFinance from './pages/admin/Finance';
import AdminSettings from './pages/admin/Settings';
import AdminModeration from './pages/admin/Moderation';
import AdminAnalytics from './pages/admin/Analytics';

import EventDetails from './pages/EventDetails';
import Layout from './components/Layout';

// Loading component
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="w-16 h-16 bg-liberia-blue text-white rounded-full flex items-center justify-center mx-auto mb-4 font-serif font-bold text-2xl animate-pulse">
        LC
      </div>
      <p className="text-gray-500">Loading...</p>
    </div>
  </div>
);

// Protected Route wrapper
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/signin" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    switch (user.role) {
      case UserRole.ADMIN:
        return <Navigate to="/admin" replace />;
      case UserRole.ORGANIZER:
        return <Navigate to="/organizer" replace />;
      case UserRole.SCANNER:
        return <Navigate to="/scanner" replace />;
      case UserRole.ANALYST:
        return <Navigate to="/organizer" replace />;
      case UserRole.MODERATOR:
        return <Navigate to="/moderator" replace />;
      case UserRole.ATTENDEE:
      default:
        return <Navigate to="/dashboard" replace />;
    }
  }

  return <Layout>{children}</Layout>;
};

const App: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  // Get home route based on user role
  const getHomeRoute = () => {
    if (!isAuthenticated || !user) return '/';
    switch (user.role) {
      case UserRole.ADMIN:
        return '/admin';
      case UserRole.ORGANIZER:
        return '/organizer';
      case UserRole.SCANNER:
        return '/scanner';
      case UserRole.ANALYST:
        return '/organizer'; // Analysts see the organizer dashboard
      case UserRole.MODERATOR:
        return '/moderator';
      case UserRole.ATTENDEE:
      default:
        return '/dashboard';
    }
  };

  return (
    <div className="min-h-screen font-sans">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={
          isAuthenticated ? <Navigate to={getHomeRoute()} replace /> : <LandingPage />
        } />
        <Route path="/auth/signin" element={
          isAuthenticated ? <Navigate to={getHomeRoute()} replace /> : <SignIn />
        } />
        <Route path="/auth/signup" element={
          isAuthenticated ? <Navigate to={getHomeRoute()} replace /> : <SignUp />
        } />
        <Route path="/auth/forgot-password" element={<ForgotPassword />} />

        {/* Public Event Details */}
        <Route path="/events/:id" element={<EventDetails />} />

        {/* Attendee Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={[UserRole.ATTENDEE]}>
            <AttendeeDashboard />
          </ProtectedRoute>
        } />
        <Route path="/schedule" element={
          <ProtectedRoute allowedRoles={[UserRole.ATTENDEE]}>
            <AttendeeSchedule />
          </ProtectedRoute>
        } />
        <Route path="/tickets" element={
          <ProtectedRoute allowedRoles={[UserRole.ATTENDEE]}>
            <AttendeeTickets />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute allowedRoles={[UserRole.ATTENDEE]}>
            <AttendeeSettings />
          </ProtectedRoute>
        } />

        {/* Organizer Routes */}
        <Route path="/organizer" element={
          <ProtectedRoute allowedRoles={[UserRole.ORGANIZER, UserRole.ANALYST]}>
            <OrganizerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/organizer/create" element={
          <ProtectedRoute allowedRoles={[UserRole.ORGANIZER]}>
            <OrganizerCreateEvent />
          </ProtectedRoute>
        } />
        <Route path="/organizer/edit/:id" element={
          <ProtectedRoute allowedRoles={[UserRole.ORGANIZER]}>
            <OrganizerCreateEvent />
          </ProtectedRoute>
        } />
        <Route path="/organizer/scanner/:eventId" element={
          <ProtectedRoute allowedRoles={[UserRole.ORGANIZER, UserRole.SCANNER]}>
            <OrganizerScanner />
          </ProtectedRoute>
        } />
        <Route path="/organizer/attendees/:eventId" element={
          <ProtectedRoute allowedRoles={[UserRole.ORGANIZER]}>
            <OrganizerAttendees />
          </ProtectedRoute>
        } />
        <Route path="/organizer/team" element={
          <ProtectedRoute allowedRoles={[UserRole.ORGANIZER]}>
            <TeamManagement />
          </ProtectedRoute>
        } />
        <Route path="/organizer/settings" element={
          <ProtectedRoute allowedRoles={[UserRole.ORGANIZER]}>
            <OrganizerSettings />
          </ProtectedRoute>
        } />

        {/* Scanner Routes */}
        <Route path="/scanner" element={
          <ProtectedRoute allowedRoles={[UserRole.SCANNER]}>
            <ScannerDashboard />
          </ProtectedRoute>
        } />

        {/* Moderator Routes */}
        <Route path="/moderator" element={
          <ProtectedRoute allowedRoles={[UserRole.MODERATOR]}>
            <ModeratorDashboard />
          </ProtectedRoute>
        } />
        <Route path="/moderator/attendees" element={
          <ProtectedRoute allowedRoles={[UserRole.MODERATOR]}>
            <ModeratorAttendees />
          </ProtectedRoute>
        } />
        <Route path="/moderator/scanner" element={
          <ProtectedRoute allowedRoles={[UserRole.MODERATOR]}>
            <ModeratorScanner />
          </ProtectedRoute>
        } />
        <Route path="/moderator/broadcasts" element={
          <ProtectedRoute allowedRoles={[UserRole.MODERATOR]}>
            <ModeratorBroadcasts />
          </ProtectedRoute>
        } />

        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/events" element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <AdminEvents />
          </ProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <AdminUsers />
          </ProtectedRoute>
        } />
        <Route path="/admin/finance" element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <AdminFinance />
          </ProtectedRoute>
        } />
        <Route path="/admin/reports" element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <AdminModeration />
          </ProtectedRoute>
        } />
        <Route path="/admin/analytics" element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <AdminAnalytics />
          </ProtectedRoute>
        } />
        <Route path="/admin/settings" element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <AdminSettings />
          </ProtectedRoute>
        } />

        {/* Profile (accessible by all authenticated users) */}
        <Route path="/profile" element={
          <ProtectedRoute>
            <AttendeeSettings />
          </ProtectedRoute>
        } />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

export default App;
