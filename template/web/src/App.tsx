import { Route, Routes } from "react-router";
import { Toaster } from "./components/ui/sonner";
import { AppShell } from "./components/saas-shell";
import { RequireAuth, RequireGuest } from "./lib/auth-guards";
import { ForgotPassword } from "./pages/forgot-password";
import { Landing } from "./pages/landing";
import { Login } from "./pages/login";
import { ResetPassword } from "./pages/reset-password";
import {
  AdminPage,
  AdminTicketPage,
  DashboardPage,
  FaqPage,
  InvitePage,
  NewTicketPage,
  OnboardingPage,
  PublicPage,
  SettingsPage,
  SupportPage,
  TicketPage,
} from "./pages/saas";
import { Signup } from "./pages/signup";

const Protected = ({ children }: { children: React.ReactNode }) => (
  <RequireAuth>
    <AppShell>{children}</AppShell>
  </RequireAuth>
);
export function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/sign-in"
          element={
            <RequireGuest>
              <Login />
            </RequireGuest>
          }
        />
        <Route
          path="/login"
          element={
            <RequireGuest>
              <Login />
            </RequireGuest>
          }
        />
        <Route
          path="/sign-up"
          element={
            <RequireGuest>
              <Signup />
            </RequireGuest>
          }
        />
        <Route
          path="/signup"
          element={
            <RequireGuest>
              <Signup />
            </RequireGuest>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <RequireGuest>
              <ForgotPassword />
            </RequireGuest>
          }
        />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/terms" element={<PublicPage kind="terms" />} />
        <Route path="/privacy" element={<PublicPage kind="privacy" />} />
        <Route path="/contact" element={<PublicPage kind="contact" />} />
        <Route path="/error" element={<PublicPage kind="error" />} />
        <Route
          path="/onboarding"
          element={
            <RequireAuth>
              <OnboardingPage />
            </RequireAuth>
          }
        />
        <Route
          path="/invite/:token"
          element={
            <RequireAuth>
              <InvitePage />
            </RequireAuth>
          }
        />
        <Route
          path="/app/*"
          element={
            <Protected>
              <DashboardPage />
            </Protected>
          }
        />
        <Route
          path="/settings/:section"
          element={
            <Protected>
              <SettingsPage />
            </Protected>
          }
        />
        <Route
          path="/support"
          element={
            <Protected>
              <SupportPage />
            </Protected>
          }
        />
        <Route
          path="/support/new"
          element={
            <Protected>
              <NewTicketPage />
            </Protected>
          }
        />
        <Route
          path="/support/tickets/:ticketId"
          element={
            <Protected>
              <TicketPage />
            </Protected>
          }
        />
        <Route
          path="/support/faq"
          element={
            <Protected>
              <FaqPage />
            </Protected>
          }
        />
        <Route
          path="/admin"
          element={
            <Protected>
              <AdminPage />
            </Protected>
          }
        />
        <Route
          path="/admin/:section"
          element={
            <Protected>
              <AdminPage />
            </Protected>
          }
        />
        <Route
          path="/admin/support/:ticketId"
          element={
            <Protected>
              <AdminTicketPage />
            </Protected>
          }
        />
        <Route path="*" element={<PublicPage kind="not-found" />} />
      </Routes>
      <Toaster />
    </>
  );
}
export default App;
