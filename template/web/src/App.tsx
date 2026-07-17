import { lazy, type ReactNode } from "react";
import { Route, Routes } from "react-router";
import { Toaster } from "./components/ui/sonner";
import { AppShell } from "./components/saas-shell";
import { RequireAuth, RequireGuest } from "./lib/auth-guards";

const ForgotPassword = lazy(() =>
  import("./pages/forgot-password").then(({ ForgotPassword }) => ({ default: ForgotPassword })),
);
const Landing = lazy(() => import("./pages/landing").then(({ Landing }) => ({ default: Landing })));
const Login = lazy(() => import("./pages/login").then(({ Login }) => ({ default: Login })));
const ResetPassword = lazy(() =>
  import("./pages/reset-password").then(({ ResetPassword }) => ({ default: ResetPassword })),
);
const Signup = lazy(() => import("./pages/signup").then(({ Signup }) => ({ default: Signup })));
const loadSaasPages = () => import("./pages/saas");
const AdminPage = lazy(() => loadSaasPages().then(({ AdminPage }) => ({ default: AdminPage })));
const AdminTicketPage = lazy(() =>
  loadSaasPages().then(({ AdminTicketPage }) => ({ default: AdminTicketPage })),
);
const DashboardPage = lazy(() => loadSaasPages().then(({ DashboardPage }) => ({ default: DashboardPage })));
const FaqPage = lazy(() => loadSaasPages().then(({ FaqPage }) => ({ default: FaqPage })));
const InvitePage = lazy(() => loadSaasPages().then(({ InvitePage }) => ({ default: InvitePage })));
const NewTicketPage = lazy(() => loadSaasPages().then(({ NewTicketPage }) => ({ default: NewTicketPage })));
const OnboardingPage = lazy(() =>
  loadSaasPages().then(({ OnboardingPage }) => ({ default: OnboardingPage })),
);
const PublicPage = lazy(() => loadSaasPages().then(({ PublicPage }) => ({ default: PublicPage })));
const SettingsPage = lazy(() => loadSaasPages().then(({ SettingsPage }) => ({ default: SettingsPage })));
const SupportPage = lazy(() => loadSaasPages().then(({ SupportPage }) => ({ default: SupportPage })));
const TicketPage = lazy(() => loadSaasPages().then(({ TicketPage }) => ({ default: TicketPage })));

const Protected = ({ children }: { children: ReactNode }) => (
  <RequireAuth>
    <AppShell>{children}</AppShell>
  </RequireAuth>
);
export default function App() {
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
