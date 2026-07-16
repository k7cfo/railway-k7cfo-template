import { createApp } from "../src/app.js";

export const app = createApp();
export async function register(label: string) {
  const safeLabel = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const email = `${safeLabel}-${crypto.randomUUID()}@example.com`;
  const response = await app.request("/api/auth/sign-up/email", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://localhost:5173" },
    body: JSON.stringify({ name: label, email, password: "CorrectHorse123!" }),
  });
  if (!response.ok) throw new Error(`Registration failed: ${response.status} ${await response.text()}`);
  const cookie = response.headers.get("set-cookie")?.split(";")[0];
  if (!cookie) throw new Error("Registration did not return a session cookie");
  const me = await app.request("/api/me", { headers: { cookie } });
  return {
    cookie,
    email,
    me: (await me.json()) as { user: { id: string }; workspaces: Array<{ id: string }> },
  };
}
export const json = (method: string, value: unknown, cookie: string) => ({
  method,
  headers: { "content-type": "application/json", cookie },
  body: JSON.stringify(value),
});
