import { useQuery } from "@tanstack/react-query";
import { api } from "./auth-client";
import type { Feature, Persona, Role } from "../config/navigation";

export type Workspace = { id: string; name: string; slug: string; kind: "personal" | "team"; role: Role };
export type Me = {
  user: { id: string; name: string; email: string; image: string | null };
  profile: {
    displayName: string;
    bio: string;
    jobTitle: string;
    timezone: string;
    persona: Persona | null;
    systemRole: Role;
  };
  preferences: {
    activeWorkspaceId: string;
    theme: string;
    emailNotifications: boolean;
    reducedMotion: boolean;
  };
  onboarding: {
    currentStep: string;
    intendedUse: string;
    firstActionCompleted: boolean;
    completedAt: string | null;
  };
  workspaces: Workspace[];
  config: {
    title: string;
    tagline: string;
    description: string;
    designSystem: string;
    features: Record<Feature, boolean>;
  };
};
export function useMe() {
  return useQuery({ queryKey: ["me"], queryFn: () => api<Me>("/api/me") });
}
