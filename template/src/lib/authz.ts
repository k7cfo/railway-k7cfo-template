import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { db } from "../db/index.js";
import { userProfiles, workspaceMemberships, type WorkspaceRole } from "../db/schema.js";

const rank: Record<WorkspaceRole, number> = { member: 0, support: 1, admin: 2, owner: 3 };

export async function requireWorkspaceRole(
  userId: string,
  workspaceId: string,
  minimum: WorkspaceRole = "member",
) {
  const membership = await db.query.workspaceMemberships.findFirst({
    where: and(eq(workspaceMemberships.userId, userId), eq(workspaceMemberships.workspaceId, workspaceId)),
  });
  if (!membership || rank[membership.role] < rank[minimum])
    throw new HTTPException(403, { message: "Forbidden" });
  return membership;
}

export async function requireSystemRole(userId: string, allowed: WorkspaceRole[]) {
  const profile = await db.query.userProfiles.findFirst({ where: eq(userProfiles.userId, userId) });
  if (!profile || !allowed.includes(profile.systemRole))
    throw new HTTPException(403, { message: "Forbidden" });
  return profile;
}
