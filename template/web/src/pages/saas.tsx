import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, LifeBuoy, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import {
  AdminLayout,
  DataTable,
  EmptyState,
  ErrorState,
  IntegrationStatus,
  LoadingState,
  PageHeader,
  SettingsLayout,
  StatCard,
  SuccessState,
  SupportLayout,
  UpgradePrompt,
} from "../components/saas-shell";
import { api } from "../lib/auth-client";
import { useMe } from "../lib/app-data";

function activeWorkspace(me: NonNullable<ReturnType<typeof useMe>["data"]>) {
  return me.workspaces.find((w) => w.id === me.preferences.activeWorkspaceId) || me.workspaces[0]!;
}

export function DashboardPage() {
  const me = useMe();
  if (me.isLoading) return <LoadingState />;
  if (!me.data) return <ErrorState error={me.error} />;
  const workspace = activeWorkspace(me.data);
  const greeting =
    me.data.profile.persona === "operator"
      ? "Keep the operation moving"
      : me.data.profile.persona === "leader"
        ? "See what needs your decision"
        : me.data.profile.persona === "builder"
          ? "Build the next useful thing"
          : "Welcome back";
  return (
    <>
      <PageHeader
        eyebrow={workspace.kind === "team" ? "Team workspace" : "Personal workspace"}
        title={greeting}
        description={`${workspace.name} is ready. This dashboard adapts to the selected persona without changing permissions.`}
        actions={
          <Link className="button" to="/support/new">
            <LifeBuoy size={16} />
            Get help
          </Link>
        }
      />
      <div className="grid-stats">
        <StatCard
          label="Workspace"
          value={workspace.kind === "team" ? "Team" : "Personal"}
          detail={`Your role: ${workspace.role}`}
        />
        <StatCard
          label="Onboarding"
          value={me.data.onboarding.completedAt ? "Done" : "Active"}
          detail={me.data.onboarding.currentStep.replaceAll("-", " ")}
        />
        <StatCard
          label="Team members"
          value={workspace.kind === "team" ? "Ready" : "1"}
          detail="Managed in workspace settings"
        />
        <StatCard
          label="Plan"
          value="Free"
          detail={me.data.config.features.billing ? "Billing available" : "Billing disabled"}
        />
      </div>
      <section className="panel">
        <h2>Start here</h2>
        <p>
          Your generated product should replace this starter action with the smallest complete workflow that
          creates first-session value.
        </p>
        <button className="button" onClick={() => toast.success("First meaningful action completed")}>
          Complete first action <ArrowRight size={16} />
        </button>
      </section>
      <section className="panel">
        <h2>Recent activity</h2>
        <EmptyState
          title="A clean slate"
          description="Product activity and audit-friendly events will appear here as your application grows."
        />
      </section>
    </>
  );
}

const onboardingSteps = ["profile", "persona", "workspace", "intended-use", "first-action"] as const;
export function OnboardingPage() {
  const me = useMe();
  const client = useQueryClient();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [persona, setPersona] = useState("builder");
  const [intendedUse, setIntendedUse] = useState("");
  useEffect(() => {
    if (me.data) {
      setDisplayName(me.data.profile.displayName);
      setPersona(me.data.profile.persona || "builder");
      const found = onboardingSteps.indexOf(
        me.data.onboarding.currentStep as (typeof onboardingSteps)[number],
      );
      setStep(found < 0 ? 0 : found);
      setIntendedUse(me.data.onboarding.intendedUse);
    }
  }, [me.data]);
  const save = useMutation({
    mutationFn: async () => {
      if (step === 0)
        await api("/api/profile", {
          method: "PATCH",
          body: JSON.stringify({
            displayName,
            bio: me.data?.profile.bio || "",
            jobTitle: me.data?.profile.jobTitle || "",
            timezone: me.data?.profile.timezone || "UTC",
            persona: persona,
          }),
        });
      const next = step === onboardingSteps.length - 1 ? "complete" : onboardingSteps[step + 1];
      return api("/api/onboarding", {
        method: "PATCH",
        body: JSON.stringify({ currentStep: next, persona, intendedUse, firstActionCompleted: step === 4 }),
      });
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["me"] });
      if (step === 4) navigate("/app");
      else setStep((value) => value + 1);
    },
    onError: (error: Error) => toast.error(error.message),
  });
  if (me.isLoading) return <LoadingState label="Resuming onboarding" />;
  if (!me.data) return <ErrorState error={me.error} />;
  const content =
    step === 0 ? (
      <div className="field">
        <label htmlFor="display-name">What should we call you?</label>
        <input
          id="display-name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
        />
      </div>
    ) : step === 1 ? (
      <div className="field">
        <label htmlFor="persona">How will you mainly use the product?</label>
        <select id="persona" value={persona} onChange={(e) => setPersona(e.target.value)}>
          <option value="builder">Builder — create and configure</option>
          <option value="operator">Operator — run repeatable work</option>
          <option value="leader">Leader — review and decide</option>
          <option value="explorer">Explorer — learn what is possible</option>
        </select>
        <small>Personas adapt language and navigation. They never grant access.</small>
      </div>
    ) : step === 2 ? (
      <div>
        <h2>{activeWorkspace(me.data).name}</h2>
        <p>Your personal workspace is ready. You can add a team workspace later.</p>
      </div>
    ) : step === 3 ? (
      <div className="field">
        <label htmlFor="intended-use">What are you hoping to accomplish first?</label>
        <textarea
          id="intended-use"
          value={intendedUse}
          onChange={(e) => setIntendedUse(e.target.value)}
          placeholder="A sentence is enough."
        />
      </div>
    ) : (
      <div>
        <h2>Make it real</h2>
        <p>
          This is the first meaningful action placeholder. Future agents should replace it with the product's
          core action.
        </p>
        <SuccessState>Everything you entered has been saved as you go.</SuccessState>
      </div>
    );
  return (
    <main className="onboarding">
      <Link className="brand" to="/">
        <span className="brand-mark">P</span>
        {me.data.config.title}
      </Link>
      <div className="progress-track" aria-label={`Step ${step + 1} of 5`}>
        {onboardingSteps.map((name, index) => (
          <span key={name} className={index <= step ? "done" : ""} />
        ))}
      </div>
      <PageHeader
        eyebrow={`Step ${step + 1} of 5`}
        title={
          [
            "Your profile",
            "Choose your perspective",
            "Your workspace",
            "Your intended use",
            "First meaningful action",
          ][step]!
        }
        description="This setup is resumable. You can safely leave and return."
      />
      <div className="panel form-grid">
        {content}
        <button
          className="button"
          disabled={save.isPending || (step === 0 && !displayName.trim())}
          onClick={() => save.mutate()}
        >
          {step === 4 ? "Finish onboarding" : "Save and continue"}
          <ArrowRight size={16} />
        </button>
      </div>
    </main>
  );
}

export function SettingsPage() {
  const { section = "profile" } = useParams();
  const me = useMe();
  const client = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState({
    displayName: "",
    bio: "",
    jobTitle: "",
    timezone: "UTC",
    persona: "builder",
  });
  useEffect(() => {
    if (me.data)
      setProfile({
        displayName: me.data.profile.displayName,
        bio: me.data.profile.bio,
        jobTitle: me.data.profile.jobTitle,
        timezone: me.data.profile.timezone,
        persona: me.data.profile.persona || "builder",
      });
  }, [me.data]);
  const mutation = useMutation({
    mutationFn: (payload: { path: string; data: unknown }) =>
      api(payload.path, { method: "PATCH", body: JSON.stringify(payload.data) }),
    onSuccess: () => {
      setSaved(true);
      client.invalidateQueries({ queryKey: ["me"] });
      toast.success("Changes saved");
    },
    onError: (error: Error) => toast.error(error.message),
  });
  if (me.isLoading) return <LoadingState />;
  if (!me.data) return <ErrorState error={me.error} />;
  const workspace = activeWorkspace(me.data);
  let content: React.ReactNode;
  if (section === "profile")
    content = (
      <form
        className="panel form-grid"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate({ path: "/api/profile", data: profile });
        }}
      >
        {saved && <SuccessState>Profile saved.</SuccessState>}
        <div className="form-grid two">
          <Field label="Display name">
            <input
              value={profile.displayName}
              onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
            />
          </Field>
          <Field label="Job title">
            <input
              value={profile.jobTitle}
              onChange={(e) => setProfile({ ...profile, jobTitle: e.target.value })}
            />
          </Field>
        </div>
        <Field label="Bio">
          <textarea value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} />
        </Field>
        <div className="form-grid two">
          <Field label="Timezone">
            <input
              value={profile.timezone}
              onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
            />
          </Field>
          <Field label="Persona">
            <select
              value={profile.persona}
              onChange={(e) => setProfile({ ...profile, persona: e.target.value })}
            >
              <option value="builder">Builder</option>
              <option value="operator">Operator</option>
              <option value="leader">Leader</option>
              <option value="explorer">Explorer</option>
            </select>
          </Field>
        </div>
        <button className="button">Save profile</button>
      </form>
    );
  else if (section === "notifications")
    content = (
      <section className="panel form-grid">
        <label>
          <input
            type="checkbox"
            checked={me.data.preferences.emailNotifications}
            onChange={(e) =>
              mutation.mutate({ path: "/api/preferences", data: { emailNotifications: e.target.checked } })
            }
          />{" "}
          Email me about important account and support activity
        </label>
      </section>
    );
  else if (section === "appearance")
    content = (
      <section className="panel form-grid">
        <Field label="Theme">
          <select
            value={me.data.preferences.theme}
            onChange={(e) => {
              localStorage.setItem("theme", e.target.value);
              document.documentElement.setAttribute("data-theme", e.target.value);
              mutation.mutate({ path: "/api/preferences", data: { theme: e.target.value } });
            }}
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </Field>
        <label>
          <input
            type="checkbox"
            checked={me.data.preferences.reducedMotion}
            onChange={(e) =>
              mutation.mutate({ path: "/api/preferences", data: { reducedMotion: e.target.checked } })
            }
          />{" "}
          Reduce motion
        </label>
      </section>
    );
  else if (section === "workspace")
    content = (
      <section className="panel form-grid">
        <Field label="Workspace name">
          <input
            defaultValue={workspace.name}
            onBlur={(e) =>
              e.target.value !== workspace.name &&
              mutation.mutate({ path: `/api/workspaces/${workspace.id}`, data: { name: e.target.value } })
            }
          />
        </Field>
        <p>
          This is a <strong>{workspace.kind}</strong> workspace. Your role is{" "}
          <strong>{workspace.role}</strong>.
        </p>
      </section>
    );
  else if (section === "members") content = <MembersSettings workspaceId={workspace.id} />;
  else if (section === "integrations") content = <ServicesSettings features={me.data.config.features} />;
  else if (section === "billing")
    content = <BillingSettings workspaceId={workspace.id} enabled={me.data.config.features.billing} />;
  else if (section === "security")
    content = (
      <section className="panel">
        <h2>Password and sessions</h2>
        <p>
          Password changes, reset links, email verification, and session cookies are handled by Better Auth.
          Use password reset if you need to rotate your password.
        </p>
        <Link className="button secondary" to="/forgot-password">
          Reset password
        </Link>
      </section>
    );
  else if (section === "account") content = <AccountSettings email={me.data.user.email} />;
  else if (section === "data")
    content = (
      <section className="panel">
        <h2>Your data</h2>
        <p>Download the safe account and workspace context currently visible to you.</p>
        <button
          className="button"
          onClick={() => {
            const url = URL.createObjectURL(
              new Blob([JSON.stringify(me.data, null, 2)], { type: "application/json" }),
            );
            const a = document.createElement("a");
            a.href = url;
            a.download = "account-data.json";
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          Download JSON
        </button>
      </section>
    );
  else
    content = (
      <section className="panel">
        <h2>{section[0]!.toUpperCase() + section.slice(1)}</h2>
        <EmptyState
          title="No provider connected"
          description="This area is ready for product-specific configuration. It does not pretend an external service is connected."
        />
      </section>
    );
  return (
    <SettingsLayout>
      <PageHeader
        eyebrow="Settings"
        title={section[0]!.toUpperCase() + section.slice(1)}
        description="Changes without external dependencies persist immediately."
      />
      {content}
    </SettingsLayout>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
function AccountSettings({ email }: { email: string }) {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const deletion = useMutation({
    mutationFn: () => api("/api/auth/delete-user", { method: "POST", body: JSON.stringify({ password }) }),
    onSuccess: () => navigate("/", { replace: true }),
    onError: (error: Error) => toast.error(error.message),
  });
  return (
    <section className="panel form-grid">
      <h2>Account</h2>
      <p>
        Signed in as {email}. Account deletion permanently removes authentication and product data through
        Better Auth and cascading database constraints.
      </p>
      <Field label="Confirm with your current password">
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </Field>
      <button
        className="button danger"
        disabled={password.length < 8 || deletion.isPending}
        onClick={() => {
          if (window.confirm("Permanently delete your account? This cannot be undone.")) deletion.mutate();
        }}
      >
        Delete account permanently
      </button>
    </section>
  );
}
type ServiceState = "connected" | "unconfigured" | "unavailable" | "error";
function useServices() {
  return useQuery({
    queryKey: ["service-status"],
    queryFn: () =>
      api<{ services: Record<"ai" | "email" | "storage" | "billing", ServiceState> }>("/api/services"),
  });
}
function ServicesSettings({ features }: { features: Record<string, boolean> }) {
  const services = useServices();
  if (services.isLoading) return <LoadingState />;
  if (!services.data) return <ErrorState error={services.error} />;
  return (
    <section className="panel">
      <IntegrationStatus
        name="AI"
        status={features.ai ? services.data.services.ai : "unavailable"}
        description="Mock is connected for development; OpenAI and Anthropic keys stay server-side."
      />
      <IntegrationStatus
        name="Email"
        status={features.email ? services.data.services.email : "unavailable"}
        description="Console email works in development; Resend provides production delivery."
      />
      <IntegrationStatus
        name="Object storage"
        status={features.storage ? services.data.services.storage : "unavailable"}
        description="Local storage is development-only; configure durable S3 or R2 for production."
      />
    </section>
  );
}
function BillingSettings({ workspaceId, enabled }: { workspaceId: string; enabled: boolean }) {
  const services = useServices();
  const state = useQuery({
    queryKey: ["billing", workspaceId],
    queryFn: () =>
      api<{
        billing: { plan: string; subscriptionStatus: string; cancelAtPeriodEnd: boolean } | null;
        entitlements: { paid: boolean };
      }>(`/api/billing/${workspaceId}`),
  });
  const action = useMutation({
    mutationFn: (path: "checkout" | "portal") =>
      api<{ url: string }>(`/api/billing/${path}`, { method: "POST", body: JSON.stringify({ workspaceId }) }),
    onSuccess: ({ url }) => {
      window.location.href = url;
    },
    onError: (error: Error) => toast.error(error.message),
  });
  if (services.isLoading || state.isLoading) return <LoadingState />;
  if (!services.data || !state.data) return <ErrorState error={services.error || state.error} />;
  const provider = enabled ? services.data.services.billing : "unavailable";
  const billing = state.data.billing;
  return (
    <section className="panel">
      <PageHeader
        title={state.data.entitlements.paid ? "Paid plan" : "Free plan"}
        description={`Subscription status: ${billing?.subscriptionStatus || "inactive"}${billing?.cancelAtPeriodEnd ? " · cancels at period end" : ""}.`}
      />
      <IntegrationStatus
        name="Stripe"
        status={provider}
        description="Checkout and the customer portal become available only after real Stripe variables and a price ID are configured."
      />
      {provider === "connected" ? (
        <div className="page-actions">
          <button
            className="button"
            onClick={() => action.mutate(state.data.entitlements.paid ? "portal" : "checkout")}
          >
            {state.data.entitlements.paid ? "Manage subscription" : "Upgrade"}
          </button>
        </div>
      ) : (
        <UpgradePrompt />
      )}
    </section>
  );
}
function MembersSettings({ workspaceId }: { workspaceId: string }) {
  const detail = useQuery({
    queryKey: ["workspace", workspaceId],
    queryFn: () =>
      api<{ members: Array<{ id: string; name: string; email: string; role: string }> }>(
        `/api/workspaces/${workspaceId}`,
      ),
  });
  const [email, setEmail] = useState("");
  const invite = useMutation({
    mutationFn: () =>
      api(`/api/workspaces/${workspaceId}/invitations`, {
        method: "POST",
        body: JSON.stringify({ email, role: "member" }),
      }),
    onSuccess: () => {
      setEmail("");
      toast.success("Invitation sent");
    },
    onError: (error: Error) => toast.error(error.message),
  });
  if (detail.isLoading) return <LoadingState />;
  if (!detail.data) return <ErrorState error={detail.error} />;
  return (
    <section className="panel">
      <form
        className="form-grid two"
        onSubmit={(e) => {
          e.preventDefault();
          invite.mutate();
        }}
      >
        <Field label="Invite by email">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <button className="button" style={{ alignSelf: "end" }}>
          Send invitation
        </button>
      </form>
      <DataTable
        rows={detail.data.members}
        empty="No members"
        columns={[
          {
            label: "Member",
            render: (row) => (
              <>
                <strong>{row.name}</strong>
                <br />
                <small>{row.email}</small>
              </>
            ),
          },
          { label: "Role", render: (row) => row.role },
        ]}
      />
    </section>
  );
}

type Ticket = {
  id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  updatedAt: string;
};
export function SupportPage() {
  const me = useMe();
  const workspace = me.data ? activeWorkspace(me.data) : null;
  const tickets = useQuery({
    queryKey: ["tickets", workspace?.id],
    enabled: Boolean(workspace),
    queryFn: () => api<{ tickets: Ticket[] }>(`/api/support/tickets?workspaceId=${workspace!.id}`),
  });
  return (
    <SupportLayout>
      <PageHeader
        eyebrow="Support"
        title="My tickets"
        description="Follow each request from first message to resolution."
        actions={
          <Link className="button" to="/support/new">
            <Plus size={16} />
            New ticket
          </Link>
        }
      />
      {tickets.isLoading ? (
        <LoadingState />
      ) : tickets.error ? (
        <ErrorState error={tickets.error} />
      ) : (
        <DataTable
          rows={tickets.data?.tickets || []}
          empty="No support tickets"
          columns={[
            {
              label: "Subject",
              render: (row) => <Link to={`/support/tickets/${row.id}`}>{row.subject}</Link>,
            },
            { label: "Priority", render: (row) => row.priority },
            {
              label: "Status",
              render: (row) => <span className="status">{row.status.replaceAll("_", " ")}</span>,
            },
          ]}
        />
      )}
    </SupportLayout>
  );
}
export function NewTicketPage() {
  const me = useMe();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    subject: "",
    category: "Product question",
    priority: "normal",
    message: "",
  });
  const mutation = useMutation({
    mutationFn: () =>
      api<{ ticket: Ticket }>("/api/support/tickets", {
        method: "POST",
        body: JSON.stringify({ ...form, workspaceId: activeWorkspace(me.data!).id }),
      }),
    onSuccess: (data) => {
      toast.success("Ticket created");
      navigate(`/support/tickets/${data.ticket.id}`);
    },
    onError: (error: Error) => toast.error(error.message),
  });
  return (
    <SupportLayout>
      <PageHeader
        eyebrow="Support"
        title="How can we help?"
        description="Share what you expected, what happened, and anything that might help us reproduce it."
      />
      <form
        className="panel form-grid"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
      >
        <Field label="Subject">
          <input
            required
            minLength={4}
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
          />
        </Field>
        <div className="form-grid two">
          <Field label="Category">
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option>Product question</option>
              <option>Account</option>
              <option>Billing</option>
              <option>Bug</option>
            </select>
          </Field>
          <Field label="Priority">
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </Field>
        </div>
        <Field label="Message">
          <textarea
            required
            minLength={10}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />
        </Field>
        <button className="button" disabled={mutation.isPending}>
          Create ticket
        </button>
      </form>
    </SupportLayout>
  );
}
export function TicketPage() {
  const { ticketId } = useParams();
  const client = useQueryClient();
  const [message, setMessage] = useState("");
  const detail = useQuery({
    queryKey: ["ticket", ticketId],
    queryFn: () =>
      api<{
        ticket: Ticket;
        messages: Array<{ id: string; body: string; authorName: string; createdAt: string }>;
      }>(`/api/support/tickets/${ticketId}`),
  });
  const reply = useMutation({
    mutationFn: () =>
      api(`/api/support/tickets/${ticketId}/messages`, { method: "POST", body: JSON.stringify({ message }) }),
    onSuccess: () => {
      setMessage("");
      client.invalidateQueries({ queryKey: ["ticket", ticketId] });
      toast.success("Reply added");
    },
  });
  const status = useMutation({
    mutationFn: (nextStatus: "open" | "closed") =>
      api(`/api/support/tickets/${ticketId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["ticket", ticketId] });
      toast.success("Ticket status updated");
    },
  });
  if (detail.isLoading)
    return (
      <SupportLayout>
        <LoadingState />
      </SupportLayout>
    );
  if (!detail.data)
    return (
      <SupportLayout>
        <ErrorState error={detail.error} />
      </SupportLayout>
    );
  return (
    <SupportLayout>
      <PageHeader
        eyebrow={detail.data.ticket.status.replaceAll("_", " ")}
        title={detail.data.ticket.subject}
        description={`${detail.data.ticket.category} · ${detail.data.ticket.priority} priority`}
        actions={
          <button
            className="button secondary"
            onClick={() => status.mutate(detail.data.ticket.status === "closed" ? "open" : "closed")}
          >
            {detail.data.ticket.status === "closed" ? "Reopen ticket" : "Close ticket"}
          </button>
        }
      />
      <section className="panel">
        {detail.data.messages.map((item) => (
          <article key={item.id} style={{ borderBottom: "1px solid var(--border)", padding: "1rem 0" }}>
            <strong>{item.authorName}</strong>
            <p>{item.body}</p>
            <small>{new Date(item.createdAt).toLocaleString()}</small>
          </article>
        ))}
        <form
          className="form-grid"
          onSubmit={(e) => {
            e.preventDefault();
            reply.mutate();
          }}
        >
          <Field label="Add a reply">
            <textarea required value={message} onChange={(e) => setMessage(e.target.value)} />
          </Field>
          <button className="button">Send reply</button>
        </form>
      </section>
    </SupportLayout>
  );
}
const faq = [
  {
    q: "How do workspaces protect data?",
    a: "Every workspace API query and mutation verifies your membership on the server.",
  },
  {
    q: "Are integrations already connected?",
    a: "No. Integration screens report connected, unconfigured, unavailable, or error states honestly.",
  },
  {
    q: "Can I reopen a ticket?",
    a: "Yes, closed customer tickets can be reopened when a new reply is needed.",
  },
  {
    q: "Where are secrets stored?",
    a: "Use 1Password locally and Railway Variables in deployments. Browser variables never contain server secrets.",
  },
];
export function FaqPage() {
  const [query, setQuery] = useState("");
  const items = faq.filter((item) => `${item.q} ${item.a}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <SupportLayout>
      <PageHeader
        eyebrow="Support"
        title="Frequently asked questions"
        description="Quick answers about the starter's behavior."
      />
      <label className="field">
        <span>Search FAQ</span>
        <div style={{ position: "relative" }}>
          <Search style={{ position: "absolute", left: ".7rem", top: ".75rem" }} size={18} />
          <input
            className="faq-search"
            style={{ paddingLeft: "2.4rem" }}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </label>
      <section className="panel">
        {items.length ? (
          items.map((item) => (
            <details key={item.q}>
              <summary>
                <strong>{item.q}</strong>
              </summary>
              <p>{item.a}</p>
            </details>
          ))
        ) : (
          <EmptyState
            title="No matching answer"
            description="Try another phrase or create a support ticket."
          />
        )}
      </section>
    </SupportLayout>
  );
}

type AdminOverview = {
  users: Array<{ id: string; name: string; email: string; emailVerified: boolean }>;
  workspaces: Array<{ id: string; name: string; kind: string }>;
  tickets: Ticket[];
  audits: Array<{ id: string; action: string; targetType: string; createdAt: string }>;
};
export function AdminPage() {
  const { section } = useParams();
  const overview = useQuery({
    queryKey: ["admin"],
    queryFn: () => api<AdminOverview>("/api/admin/overview"),
  });
  if (overview.isLoading)
    return (
      <AdminLayout>
        <LoadingState />
      </AdminLayout>
    );
  if (!overview.data)
    return (
      <AdminLayout>
        <ErrorState error={overview.error} />
      </AdminLayout>
    );
  const data = overview.data;
  let content = (
    <div className="grid-stats">
      <StatCard label="Users" value={data.users.length} detail="Safe public account context" />
      <StatCard label="Workspaces" value={data.workspaces.length} detail="Personal and team" />
      <StatCard
        label="Open tickets"
        value={data.tickets.filter((t) => t.status !== "closed").length}
        detail="Across all workspaces"
      />
      <StatCard label="Audit events" value={data.audits.length} detail="Most recent 100" />
    </div>
  );
  if (section === "users")
    content = (
      <DataTable
        rows={data.users}
        empty="No users"
        columns={[
          {
            label: "User",
            render: (row) => (
              <>
                <strong>{row.name}</strong>
                <br />
                <small>{row.email}</small>
              </>
            ),
          },
          { label: "Verified", render: (row) => (row.emailVerified ? "Yes" : "No") },
        ]}
      />
    );
  else if (section === "workspaces")
    content = (
      <DataTable
        rows={data.workspaces}
        empty="No workspaces"
        columns={[
          { label: "Workspace", render: (row) => row.name },
          { label: "Kind", render: (row) => row.kind },
        ]}
      />
    );
  else if (section === "support")
    content = (
      <DataTable
        rows={data.tickets}
        empty="No support tickets"
        columns={[
          { label: "Ticket", render: (row) => <Link to={`/admin/support/${row.id}`}>{row.subject}</Link> },
          { label: "Status", render: (row) => row.status },
        ]}
      />
    );
  else if (section === "audit")
    content = (
      <DataTable
        rows={data.audits}
        empty="No audit events"
        columns={[
          { label: "Action", render: (row) => row.action },
          { label: "Target", render: (row) => row.targetType },
          { label: "Time", render: (row) => new Date(row.createdAt).toLocaleString() },
        ]}
      />
    );
  else if (section === "system") content = <SystemStatus />;
  return (
    <AdminLayout>
      <PageHeader
        eyebrow="Administration"
        title={section ? section[0]!.toUpperCase() + section.slice(1) : "Overview"}
        description="Secrets, hashes, tokens, and complete authentication credentials are never returned."
      />
      {content}
    </AdminLayout>
  );
}
export function AdminTicketPage() {
  const { ticketId } = useParams();
  const client = useQueryClient();
  const [reply, setReply] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [status, setStatus] = useState("in_progress");
  const detail = useQuery({
    queryKey: ["admin-ticket", ticketId],
    queryFn: () =>
      api<{
        ticket: Ticket;
        messages: Array<{ id: string; body: string; authorName: string; createdAt: string }>;
        notes: Array<{ id: string; body: string; authorName: string; createdAt: string }>;
      }>(`/api/admin/support/${ticketId}`),
  });
  const update = useMutation({
    mutationFn: () =>
      api(`/api/admin/support/${ticketId}`, {
        method: "PATCH",
        body: JSON.stringify({ status, reply: reply || undefined, internalNote: internalNote || undefined }),
      }),
    onSuccess: () => {
      setReply("");
      setInternalNote("");
      client.invalidateQueries({ queryKey: ["admin-ticket", ticketId] });
      toast.success("Ticket updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });
  if (detail.isLoading)
    return (
      <AdminLayout>
        <LoadingState />
      </AdminLayout>
    );
  if (!detail.data)
    return (
      <AdminLayout>
        <ErrorState error={detail.error} />
      </AdminLayout>
    );
  return (
    <AdminLayout>
      <PageHeader
        eyebrow="Support administration"
        title={detail.data.ticket.subject}
        description="Replies are visible to the customer. Internal notes never appear in the customer ticket."
      />
      <section className="panel">
        <h2>Conversation</h2>
        {detail.data.messages.map((item) => (
          <article key={item.id} style={{ borderBottom: "1px solid var(--border)", padding: "1rem 0" }}>
            <strong>{item.authorName}</strong>
            <p>{item.body}</p>
          </article>
        ))}
      </section>
      <section className="panel form-grid">
        <Field label="Status">
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="open">Open</option>
            <option value="in_progress">In progress</option>
            <option value="waiting_on_customer">Waiting on customer</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </Field>
        <Field label="Customer reply">
          <textarea value={reply} onChange={(event) => setReply(event.target.value)} />
        </Field>
        <Field label="Internal note">
          <textarea value={internalNote} onChange={(event) => setInternalNote(event.target.value)} />
        </Field>
        <button className="button" onClick={() => update.mutate()}>
          Save ticket update
        </button>
      </section>
      <section className="panel">
        <h2>Internal notes</h2>
        {detail.data.notes.length ? (
          detail.data.notes.map((note) => (
            <article key={note.id}>
              <strong>{note.authorName}</strong>
              <p>{note.body}</p>
            </article>
          ))
        ) : (
          <EmptyState title="No internal notes" description="Private support context will appear here." />
        )}
      </section>
    </AdminLayout>
  );
}
function SystemStatus() {
  const services = useQuery({
    queryKey: ["services"],
    queryFn: () =>
      api<{ services: Record<string, "connected" | "unconfigured" | "unavailable">; environment: string }>(
        "/api/system/services",
      ),
  });
  if (services.isLoading) return <LoadingState />;
  if (!services.data) return <ErrorState error={services.error} />;
  return (
    <section className="panel">
      {Object.entries(services.data.services).map(([name, status]) => (
        <IntegrationStatus
          key={name}
          name={name.toUpperCase()}
          status={status}
          description={`Runtime status in ${services.data.environment}. No secret values are exposed.`}
        />
      ))}
    </section>
  );
}

export function InvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const client = useQueryClient();
  const accept = useMutation({
    mutationFn: () =>
      api<{ workspaceId: string }>(`/api/invitations/${token}/accept`, { method: "POST", body: "{}" }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["me"] });
      toast.success("Invitation accepted");
      navigate("/app");
    },
  });
  return (
    <main className="onboarding">
      <PageHeader
        eyebrow="Workspace invitation"
        title="Join the workspace"
        description="The invitation is checked against your signed-in email and its expiration date."
      />
      <section className="panel">
        {accept.error && <ErrorState error={accept.error} />}
        <button className="button" disabled={accept.isPending} onClick={() => accept.mutate()}>
          Accept invitation
        </button>
      </section>
    </main>
  );
}

export function PublicPage({ kind }: { kind: "terms" | "privacy" | "contact" | "not-found" | "error" }) {
  const content = {
    terms: [
      "Terms of service",
      "Replace this placeholder with terms reviewed for your product and jurisdiction before launch.",
    ],
    privacy: [
      "Privacy policy",
      "Replace this placeholder with a policy describing the data your product actually collects and processes.",
    ],
    contact: [
      "Contact",
      "For product support, sign in and create a ticket. Add your public contact address before launch.",
    ],
    "not-found": ["Page not found", "The page may have moved, or the address may be incomplete."],
    error: [
      "Something went wrong",
      "The application could not complete that request. Try again or contact support.",
    ],
  }[kind];
  return (
    <main className="public-simple">
      <Link className="brand" to="/">
        <span className="brand-mark">P</span>Portable SaaS
      </Link>
      <p className="eyebrow">{kind.replace("-", " ")}</p>
      <h1>{content[0]}</h1>
      <p>{content[1]}</p>
      <Link className="button" to="/">
        Return home
      </Link>
    </main>
  );
}
