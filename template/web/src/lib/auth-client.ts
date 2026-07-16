export type AuthUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: string;
  updatedAt: string;
};
export type AuthSession = { user: AuthUser; session: { id: string; expiresAt: string; token: string } };

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    credentials: "include",
    ...init,
    headers: { "content-type": "application/json", ...init?.headers },
  });
  const text = await response.text();
  const value = text ? JSON.parse(text) : null;
  if (!response.ok)
    throw new Error(
      value?.message ?? value?.error?.message ?? value?.error ?? `Request failed (${response.status})`,
    );
  return value as T;
}

export const authClient = {
  getSession: () => api<AuthSession | null>("/api/auth/get-session"),
  signIn: (data: { email: string; password: string }) =>
    api<AuthSession>("/api/auth/sign-in/email", { method: "POST", body: JSON.stringify(data) }),
  signUp: (data: { email: string; password: string; name: string }) =>
    api<AuthSession>("/api/auth/sign-up/email", { method: "POST", body: JSON.stringify(data) }),
  signOut: () => api<{ success: boolean }>("/api/auth/sign-out", { method: "POST", body: "{}" }),
  requestPasswordReset: (data: { email: string; redirectTo: string }) =>
    api<{ status: boolean; message: string }>("/api/auth/request-password-reset", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  resetPassword: (data: { newPassword: string; token: string }) =>
    api<{ status: boolean }>("/api/auth/reset-password", { method: "POST", body: JSON.stringify(data) }),
};
