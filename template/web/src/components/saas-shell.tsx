import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Command,
  LoaderCircle,
  Menu,
  Plus,
  Search,
  X,
} from "lucide-react";
import type { PropsWithChildren, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { visibleNavigation, type Feature, type Persona, type Role } from "../config/navigation";
import { api, authClient } from "../lib/auth-client";
import { type Me, useMe, type Workspace } from "../lib/app-data";

export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div className="state-card" role="status">
      <LoaderCircle className="spin" />
      <p>{label}…</p>
    </div>
  );
}
export function ErrorState({ error, retry }: { error?: Error | null; retry?: () => void }) {
  return (
    <div className="state-card state-error" role="alert">
      <AlertTriangle />
      <h2>Something went wrong</h2>
      <p>{error?.message || "Please try again."}</p>
      {retry && (
        <button className="button" onClick={retry}>
          Try again
        </button>
      )}
    </div>
  );
}
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="state-card">
      <div className="empty-mark">◇</div>
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function SuccessState({ children }: PropsWithChildren) {
  return (
    <div className="success-banner" role="status">
      <Check size={16} />
      {children}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}
export function Header({
  me,
  workspace,
  openMobile,
  openCommand,
}: {
  me: Me;
  workspace: Workspace;
  openMobile: () => void;
  openCommand: () => void;
}) {
  const location = useLocation();
  const parts = location.pathname.split("/").filter(Boolean);
  return (
    <header className="app-header">
      <button className="icon-button mobile-only" aria-label="Open navigation" onClick={openMobile}>
        <Menu />
      </button>
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/app">{workspace.name}</Link>
        {parts.slice(1).map((part) => (
          <span key={part}>/ {part.replaceAll("-", " ")}</span>
        ))}
      </nav>
      <div className="header-actions">
        <button className="search-trigger" onClick={openCommand}>
          <Search size={16} />
          <span>Search</span>
          <kbd>⌘K</kbd>
        </button>
        <UserMenu me={me} />
      </div>
    </header>
  );
}
export function WorkspaceSwitcher({ me }: { me: Me }) {
  const client = useQueryClient();
  const active = me.workspaces.find((w) => w.id === me.preferences.activeWorkspaceId) || me.workspaces[0];
  const change = useMutation({
    mutationFn: (activeWorkspaceId: string) =>
      api("/api/preferences", { method: "PATCH", body: JSON.stringify({ activeWorkspaceId }) }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["me"] });
      toast.success("Workspace changed");
    },
  });
  return (
    <label className="workspace-switcher">
      <span className="sr-only">Current workspace</span>
      <select value={active?.id} onChange={(event) => change.mutate(event.target.value)}>
        {me.workspaces.map((workspace) => (
          <option key={workspace.id} value={workspace.id}>
            {workspace.name}
          </option>
        ))}
      </select>
      <ChevronDown size={16} />
    </label>
  );
}
export function UserMenu({ me }: { me: Me }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  async function signOut() {
    await authClient.signOut();
    navigate("/sign-in");
  }
  return (
    <div className="user-menu">
      <button
        className="avatar-button"
        aria-expanded={open}
        aria-label="User menu"
        onClick={() => setOpen(!open)}
      >
        {me.user.name.slice(0, 2).toUpperCase()}
      </button>
      {open && (
        <div className="menu-popover">
          <strong>{me.user.name}</strong>
          <small>{me.user.email}</small>
          <Link to="/settings/profile" onClick={() => setOpen(false)}>
            Settings
          </Link>
          <button onClick={signOut}>Sign out</button>
        </div>
      )}
    </div>
  );
}
export function Sidebar({ me, workspace }: { me: Me; workspace: Workspace }) {
  const items = visibleNavigation({
    role:
      me.profile.systemRole === "admin" || me.profile.systemRole === "support"
        ? me.profile.systemRole
        : workspace.role,
    persona: me.profile.persona,
    features: me.config.features,
    workspaceKind: workspace.kind,
    mobile: false,
  });
  return (
    <aside className="sidebar">
      <Link to="/app" className="brand">
        <span className="brand-mark">P</span>
        <span>{me.config.title}</span>
      </Link>
      <WorkspaceSwitcher me={me} />
      <nav>
        {items.map((item) => (
          <NavLink key={item.href} to={item.href} className={({ isActive }) => (isActive ? "active" : "")}>
            <item.icon size={18} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <Link to="/support/new">
          <Plus size={16} /> Get help
        </Link>
        <small>{me.config.designSystem} system</small>
      </div>
    </aside>
  );
}
export function MobileNav({
  open,
  close,
  me,
  workspace,
}: {
  open: boolean;
  close: () => void;
  me: Me;
  workspace: Workspace;
}) {
  if (!open) return null;
  const items = visibleNavigation({
    role:
      me.profile.systemRole === "admin" || me.profile.systemRole === "support"
        ? me.profile.systemRole
        : workspace.role,
    persona: me.profile.persona,
    features: me.config.features,
    workspaceKind: workspace.kind,
    mobile: true,
  });
  return (
    <div className="mobile-drawer" role="dialog" aria-modal="true" aria-label="Navigation">
      <button className="drawer-backdrop" aria-label="Close navigation" onClick={close} />
      <aside>
        <button className="icon-button drawer-close" aria-label="Close navigation" onClick={close}>
          <X />
        </button>
        <Link to="/app" className="brand" onClick={close}>
          <span className="brand-mark">P</span>
          {me.config.title}
        </Link>
        <WorkspaceSwitcher me={me} />
        <nav>
          {items.map((item) => (
            <NavLink key={item.href} to={item.href} onClick={close}>
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </div>
  );
}
export function CommandMenu({
  open,
  close,
  me,
  workspace,
}: {
  open: boolean;
  close: () => void;
  me: Me;
  workspace: Workspace;
}) {
  const [query, setQuery] = useState("");
  const items = useMemo(
    () =>
      visibleNavigation({
        role:
          me.profile.systemRole === "admin" || me.profile.systemRole === "support"
            ? me.profile.systemRole
            : workspace.role,
        persona: me.profile.persona,
        features: me.config.features,
        workspaceKind: workspace.kind,
        mobile: false,
      }).filter((item) => item.label.toLowerCase().includes(query.toLowerCase())),
    [me, workspace, query],
  );
  if (!open) return null;
  return (
    <div
      className="command-layer"
      role="dialog"
      aria-modal="true"
      aria-label="Command menu"
      onMouseDown={close}
    >
      <div className="command-box" onMouseDown={(e) => e.stopPropagation()}>
        <div>
          <Command size={18} />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Where do you want to go?"
            aria-label="Search navigation"
          />
          <kbd>esc</kbd>
        </div>
        <nav>
          {items.length ? (
            items.map((item) => (
              <Link key={item.href} to={item.href} onClick={close}>
                <item.icon size={17} />
                {item.label}
              </Link>
            ))
          ) : (
            <p>No matching destinations.</p>
          )}
        </nav>
      </div>
    </div>
  );
}
export function AppShell({ children }: PropsWithChildren) {
  const me = useMe();
  const [mobile, setMobile] = useState(false);
  const [command, setCommand] = useState(false);
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        setCommand(true);
      }
      if (event.key === "Escape") setCommand(false);
    };
    addEventListener("keydown", listener);
    return () => removeEventListener("keydown", listener);
  }, []);
  if (me.isLoading) return <LoadingState label="Opening your workspace" />;
  if (me.error || !me.data) return <ErrorState error={me.error} retry={() => me.refetch()} />;
  const workspace =
    me.data.workspaces.find((w) => w.id === me.data.preferences.activeWorkspaceId) || me.data.workspaces[0];
  if (!workspace)
    return (
      <EmptyState
        title="No workspace"
        description="Your account needs a workspace. Contact support if refreshing does not fix this."
      />
    );
  return (
    <div className="app-shell">
      <Sidebar me={me.data} workspace={workspace} />
      <MobileNav open={mobile} close={() => setMobile(false)} me={me.data} workspace={workspace} />
      <div className="app-column">
        <Header
          me={me.data}
          workspace={workspace}
          openMobile={() => setMobile(true)}
          openCommand={() => setCommand(true)}
        />
        <main>{children}</main>
      </div>
      <CommandMenu open={command} close={() => setCommand(false)} me={me.data} workspace={workspace} />
    </div>
  );
}

export function SettingsLayout({ children }: PropsWithChildren) {
  const links = [
    "profile",
    "account",
    "security",
    "notifications",
    "appearance",
    "workspace",
    "members",
    "integrations",
    "billing",
    "data",
  ];
  return (
    <div className="split-layout">
      <nav aria-label="Settings">
        {links.map((link) => (
          <NavLink key={link} to={`/settings/${link}`}>
            {link[0]!.toUpperCase() + link.slice(1)}
          </NavLink>
        ))}
      </nav>
      <section>{children}</section>
    </div>
  );
}
export function AdminLayout({ children }: PropsWithChildren) {
  const links = ["", "users", "workspaces", "support", "audit", "system"];
  return (
    <div className="split-layout">
      <nav aria-label="Administration">
        {links.map((link) => (
          <NavLink end={!link} key={link} to={`/admin${link ? `/${link}` : ""}`}>
            {link ? link[0]!.toUpperCase() + link.slice(1) : "Overview"}
          </NavLink>
        ))}
      </nav>
      <section>{children}</section>
    </div>
  );
}
export function SupportLayout({ children }: PropsWithChildren) {
  return (
    <div className="split-layout">
      <nav aria-label="Support">
        <NavLink end to="/support">
          My tickets
        </NavLink>
        <NavLink to="/support/new">New ticket</NavLink>
        <NavLink to="/support/faq">FAQ</NavLink>
      </nav>
      <section>{children}</section>
    </div>
  );
}

export function DataTable<T>({
  rows,
  columns,
  empty,
}: {
  rows: T[];
  columns: Array<{ label: string; render: (row: T) => ReactNode }>;
  empty: string;
}) {
  if (!rows.length) return <EmptyState title={empty} description="Nothing needs your attention here yet." />;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.label}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {columns.map((c) => (
                <td key={c.label}>{c.render(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function StatCard({ label, value, detail }: { label: string; value: ReactNode; detail: string }) {
  return (
    <article className="stat-card">
      <p>{label}</p>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="dialog-layer" role="alertdialog" aria-modal="true">
      <div className="dialog-card">
        <h2>{title}</h2>
        <p>{description}</p>
        <div>
          <button className="button secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="button danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
export function PermissionGuard({
  role,
  allowed,
  children,
  fallback = null,
}: PropsWithChildren<{ role: Role; allowed: Role[]; fallback?: ReactNode }>) {
  return allowed.includes(role) ? children : fallback;
}
export function FeatureGuard({
  feature,
  features,
  children,
  fallback = null,
}: PropsWithChildren<{ feature: Feature; features: Record<Feature, boolean>; fallback?: ReactNode }>) {
  return features[feature] ? children : fallback;
}
export function PersonaGuard({
  persona,
  allowed,
  children,
  fallback = null,
}: PropsWithChildren<{ persona?: Persona | null; allowed: Persona[]; fallback?: ReactNode }>) {
  return persona && allowed.includes(persona) ? children : fallback;
}
export function IntegrationStatus({
  name,
  status,
  description,
}: {
  name: string;
  status: "connected" | "unconfigured" | "unavailable" | "error";
  description: string;
}) {
  return (
    <article className="integration-row">
      <div>
        <strong>{name}</strong>
        <p>{description}</p>
      </div>
      <span className={`status status-${status}`}>{status}</span>
    </article>
  );
}
export function UpgradePrompt({
  title = "Unlock this capability",
  description = "Connect billing and choose a paid plan when your product is ready.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="upgrade-prompt">
      <CreditCardIcon />
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
      <Link className="button" to="/settings/billing">
        View billing
      </Link>
    </div>
  );
}
function CreditCardIcon() {
  return <span className="upgrade-icon">↗</span>;
}
