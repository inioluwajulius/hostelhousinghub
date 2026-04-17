import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { useBrowserNotifications } from "@/hooks/useBrowserNotifications";
import { useAdminShortcut } from "@/hooks/useAdminShortcut";
import Index from "./pages/Index";
import SearchPage from "./pages/SearchPage";
import ListingDetailPage from "./pages/ListingDetailPage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import StudentDashboard from "./pages/StudentDashboard";
import HostDashboard from "./pages/HostDashboard";
import MessagesPage from "./pages/MessagesPage";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLoginPage from "./pages/AdminLoginPage";
import RoommateFinderPage from "./pages/RoommateFinderPage";
import BookingCallbackPage from "./pages/BookingCallbackPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppRoutes = () => {
  useBrowserNotifications();
  useAdminShortcut();

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/listing/:id" element={<ListingDetailPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/dashboard" element={<StudentDashboard />} />
      <Route path="/host/dashboard" element={<HostDashboard />} />
      <Route path="/messages" element={<MessagesPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/roommates" element={<RoommateFinderPage />} />
      <Route path="/booking-callback" element={<BookingCallbackPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
