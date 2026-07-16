import {
  BarChart3,
  Building2,
  CircleHelp,
  CreditCard,
  LayoutDashboard,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import type { ComponentType } from "react";

export type Role = "owner" | "admin" | "member" | "support";
export type Persona = "builder" | "operator" | "leader" | "explorer";
export type Feature = "teams" | "support" | "admin" | "billing" | "ai" | "email" | "storage";
export type NavigationContext = {
  role: Role;
  persona?: Persona | null;
  features: Record<Feature, boolean>;
  workspaceKind: "personal" | "team";
  mobile: boolean;
};
export type NavigationItem = {
  label: string;
  href: string;
  icon: ComponentType<{ size?: number }>;
  roles?: Role[];
  personas?: Persona[];
  feature?: Feature;
  workspaceKinds?: Array<"personal" | "team">;
  desktop?: boolean;
  mobile?: boolean;
};

export const navigation: NavigationItem[] = [
  { label: "Dashboard", href: "/app", icon: LayoutDashboard },
  { label: "Activity", href: "/app/activity", icon: BarChart3, personas: ["operator", "leader"] },
  { label: "Team", href: "/settings/members", icon: Users, feature: "teams", workspaceKinds: ["team"] },
  { label: "Support", href: "/support", icon: CircleHelp, feature: "support" },
  { label: "Settings", href: "/settings/profile", icon: Settings },
  {
    label: "Billing",
    href: "/settings/billing",
    icon: CreditCard,
    feature: "billing",
    roles: ["owner", "admin"],
  },
  { label: "Administration", href: "/admin", icon: Shield, feature: "admin", roles: ["admin", "support"] },
  { label: "Workspaces", href: "/settings/workspace", icon: Building2, feature: "teams", mobile: true },
];

export function visibleNavigation(context: NavigationContext): NavigationItem[] {
  return navigation.filter((item) => {
    if (item.roles && !item.roles.includes(context.role)) return false;
    if (item.personas && (!context.persona || !item.personas.includes(context.persona))) return false;
    if (item.feature && !context.features[item.feature]) return false;
    if (item.workspaceKinds && !item.workspaceKinds.includes(context.workspaceKind)) return false;
    if (context.mobile && item.mobile === false) return false;
    if (!context.mobile && item.desktop === false) return false;
    return true;
  });
}
