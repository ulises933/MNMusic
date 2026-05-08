import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import AppLayout from "@/components/layout/AppLayout";

import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import MusicianDashboard from "./pages/musician/MusicianDashboard";
import ExploreEvents from "./pages/musician/ExploreEvents";
import MusicianProfile from "./pages/musician/MusicianProfile";
import Invitations from "./pages/musician/Invitations";
import SentInvitations from "./pages/shared/SentInvitations";
import OrganizerDashboard from "./pages/organizer/OrganizerDashboard";
import OrganizerEvents from "./pages/organizer/OrganizerEvents";
import CreateEditEvent from "./pages/organizer/CreateEditEvent";
import Applications from "./pages/organizer/Applications";
import OrganizerProfile from "./pages/organizer/OrganizerProfile";
import UserDashboard from "./pages/user/UserDashboard";
import UserEvents from "./pages/user/UserEvents";
import BrowseArtists from "./pages/shared/BrowseArtists";
import SubscriptionPage from "./pages/shared/SubscriptionPage";
import HistoryPage from "./pages/shared/HistoryPage";
import EventDetail from "./pages/EventDetail";
import Messages from "./pages/Messages";
import CalendarPage from "./pages/CalendarPage";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminEvents from "./pages/admin/AdminEvents";
import AdminArtists from "./pages/admin/AdminArtists";
import AdminPlans from "./pages/admin/AdminPlans";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminSettings from "./pages/admin/AdminSettings";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  return <AppLayout>{children}</AppLayout>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <AppLayout>{children}</AppLayout>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<Auth />} />
      
      {/* Musician routes */}
      <Route path="/m/dashboard" element={<ProtectedRoute><MusicianDashboard /></ProtectedRoute>} />
      <Route path="/m/events" element={<ProtectedRoute><ExploreEvents /></ProtectedRoute>} />
      <Route path="/m/profile" element={<ProtectedRoute><MusicianProfile /></ProtectedRoute>} />
      <Route path="/m/invitations" element={<ProtectedRoute><Invitations /></ProtectedRoute>} />
      
      {/* Organizer routes */}
      <Route path="/o/dashboard" element={<ProtectedRoute><OrganizerDashboard /></ProtectedRoute>} />
      <Route path="/o/events" element={<ProtectedRoute><OrganizerEvents /></ProtectedRoute>} />
      <Route path="/o/events/new" element={<ProtectedRoute><CreateEditEvent /></ProtectedRoute>} />
      <Route path="/o/events/:id/edit" element={<ProtectedRoute><CreateEditEvent /></ProtectedRoute>} />
      <Route path="/o/applications" element={<ProtectedRoute><Applications /></ProtectedRoute>} />
      <Route path="/o/profile" element={<ProtectedRoute><OrganizerProfile /></ProtectedRoute>} />
      <Route path="/o/artists" element={<ProtectedRoute><BrowseArtists /></ProtectedRoute>} />
      <Route path="/o/invitations" element={<ProtectedRoute><SentInvitations /></ProtectedRoute>} />
      
      {/* User routes */}
      <Route path="/u/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
      <Route path="/u/artists" element={<ProtectedRoute><BrowseArtists /></ProtectedRoute>} />
      <Route path="/u/events" element={<ProtectedRoute><UserEvents /></ProtectedRoute>} />
      <Route path="/u/events/new" element={<ProtectedRoute><CreateEditEvent /></ProtectedRoute>} />
      <Route path="/u/events/:id/edit" element={<ProtectedRoute><CreateEditEvent /></ProtectedRoute>} />
      <Route path="/u/profile" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/u/invitations" element={<ProtectedRoute><SentInvitations /></ProtectedRoute>} />
      
      {/* Admin routes */}
      <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
      <Route path="/admin/events" element={<AdminRoute><AdminEvents /></AdminRoute>} />
      <Route path="/admin/artists" element={<AdminRoute><AdminArtists /></AdminRoute>} />
      <Route path="/admin/plans" element={<AdminRoute><AdminPlans /></AdminRoute>} />
      <Route path="/admin/payments" element={<AdminRoute><AdminPayments /></AdminRoute>} />
      <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
      
      {/* Shared routes */}
      <Route path="/events/:id" element={<ProtectedRoute><EventDetail /></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
      <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/subscription" element={<ProtectedRoute><SubscriptionPage /></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
