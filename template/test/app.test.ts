import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { db } from "../src/db/index.js";
import { userProfiles } from "../src/db/schema.js";
import { app, json, register } from "./helpers.js";

describe("application server", () => {
  it("serves health, readiness, and SPA fallback", async () => {
    expect((await app.request("/health")).status).toBe(200);
    expect((await app.request("/ready")).status).toBe(200);
    const spa = await app.request("/settings/profile");
    expect(spa.status).toBe(200);
    expect(await spa.text()).toContain('id="root"');
  });
  it("protects authenticated APIs and rejects unknown APIs", async () => {
    expect((await app.request("/api/me")).status).toBe(401);
    expect((await app.request("/api/does-not-exist")).status).toBe(401);
  });
  it("persists persona-aware user settings", async () => {
    const account = await register("Settings User");
    const response = await app.request(
      "/api/profile",
      json(
        "PATCH",
        {
          displayName: "Changed Name",
          bio: "A useful bio",
          jobTitle: "Operator",
          timezone: "Europe/London",
          persona: "operator",
        },
        account.cookie,
      ),
    );
    expect(response.status).toBe(200);
    const me = (await (await app.request("/api/me", { headers: { cookie: account.cookie } })).json()) as {
      profile: { displayName: string; persona: string };
    };
    expect(me.profile).toMatchObject({ displayName: "Changed Name", persona: "operator" });
  });
  it("enforces workspace authorization", async () => {
    const first = await register("Workspace One");
    const second = await register("Workspace Two");
    expect(
      (
        await app.request(`/api/workspaces/${first.me.workspaces[0]!.id}`, {
          headers: { cookie: second.cookie },
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await app.request(`/api/workspaces/${first.me.workspaces[0]!.id}`, {
          headers: { cookie: first.cookie },
        })
      ).status,
    ).toBe(200);
  });
  it("enforces administrative role authorization", async () => {
    const member = await register("Ordinary Member");
    expect((await app.request("/api/admin/overview", { headers: { cookie: member.cookie } })).status).toBe(
      403,
    );
    await db
      .update(userProfiles)
      .set({ systemRole: "admin" })
      .where(eq(userProfiles.userId, member.me.user.id));
    expect((await app.request("/api/admin/overview", { headers: { cookie: member.cookie } })).status).toBe(
      200,
    );
  });
  it("creates support tickets and replies", async () => {
    const account = await register("Support User");
    const workspaceId = account.me.workspaces[0]!.id;
    const created = await app.request(
      "/api/support/tickets",
      json(
        "POST",
        {
          workspaceId,
          subject: "A complete support question",
          category: "Product question",
          priority: "normal",
          message: "This message has enough detail to be useful.",
        },
        account.cookie,
      ),
    );
    expect(created.status).toBe(201);
    const ticket = (await created.json()) as { ticket: { id: string } };
    const reply = await app.request(
      `/api/support/tickets/${ticket.ticket.id}/messages`,
      json("POST", { message: "Here is an additional detail." }, account.cookie),
    );
    expect(reply.status).toBe(201);
    const detail = (await (
      await app.request(`/api/support/tickets/${ticket.ticket.id}`, { headers: { cookie: account.cookie } })
    ).json()) as { messages: unknown[] };
    expect(detail.messages).toHaveLength(2);
  });
});
