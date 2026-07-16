import { sql } from "drizzle-orm";
import { boolean, index, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
};
const id = () => text("id").primaryKey().default(sql`gen_random_uuid()::text`);

export const user = pgTable("user", {
  id: id(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  ...timestamps,
});

export const session = pgTable(
  "session",
  {
    id: id(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => [index("session_user_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: id(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    ...timestamps,
  },
  (table) => [
    index("account_user_idx").on(table.userId),
    uniqueIndex("account_provider_unique").on(table.providerId, table.accountId),
  ],
);

export const verification = pgTable(
  "verification",
  {
    id: id(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const personaEnum = pgEnum("persona", ["builder", "operator", "leader", "explorer"]);
export const workspaceKindEnum = pgEnum("workspace_kind", ["personal", "team"]);
export const roleEnum = pgEnum("workspace_role", ["owner", "admin", "member", "support"]);
export const invitationStatusEnum = pgEnum("invitation_status", [
  "pending",
  "accepted",
  "revoked",
  "expired",
]);
export const ticketStatusEnum = pgEnum("ticket_status", [
  "open",
  "in_progress",
  "waiting_on_customer",
  "resolved",
  "closed",
]);
export const ticketPriorityEnum = pgEnum("ticket_priority", ["low", "normal", "high", "urgent"]);

export const userProfiles = pgTable("user_profiles", {
  id: id(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  displayName: text("display_name").notNull(),
  bio: text("bio").default("").notNull(),
  jobTitle: text("job_title").default("").notNull(),
  timezone: text("timezone").default("UTC").notNull(),
  persona: personaEnum("persona"),
  systemRole: roleEnum("system_role").default("member").notNull(),
  ...timestamps,
});

export const workspaces = pgTable(
  "workspaces",
  {
    id: id(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    kind: workspaceKindEnum("kind").notNull(),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("workspace_slug_unique").on(table.slug),
    index("workspace_owner_idx").on(table.ownerUserId),
  ],
);

export const workspaceMemberships = pgTable(
  "workspace_memberships",
  {
    id: id(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: roleEnum("role").default("member").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("membership_workspace_user_unique").on(table.workspaceId, table.userId),
    index("membership_user_idx").on(table.userId),
  ],
);

export const workspaceInvitations = pgTable(
  "workspace_invitations",
  {
    id: id(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: roleEnum("role").default("member").notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    status: invitationStatusEnum("status").default("pending").notNull(),
    invitedByUserId: text("invited_by_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (table) => [
    index("invitation_workspace_idx").on(table.workspaceId),
    index("invitation_email_idx").on(table.email),
  ],
);

export const userPreferences = pgTable("user_preferences", {
  id: id(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  activeWorkspaceId: text("active_workspace_id").references(() => workspaces.id, { onDelete: "set null" }),
  theme: text("theme").default("system").notNull(),
  emailNotifications: boolean("email_notifications").default(true).notNull(),
  reducedMotion: boolean("reduced_motion").default(false).notNull(),
  ...timestamps,
});

export const workspaceSettings = pgTable("workspace_settings", {
  id: id(),
  workspaceId: text("workspace_id")
    .notNull()
    .unique()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  teamFeaturesEnabled: boolean("team_features_enabled").default(true).notNull(),
  inviteOnly: boolean("invite_only").default(false).notNull(),
  billingEmail: text("billing_email"),
  ...timestamps,
});

export const onboardingProgress = pgTable("onboarding_progress", {
  id: id(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  currentStep: text("current_step").default("profile").notNull(),
  intendedUse: text("intended_use").default("").notNull(),
  firstActionCompleted: boolean("first_action_completed").default(false).notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  ...timestamps,
});

export const supportTickets = pgTable(
  "support_tickets",
  {
    id: id(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    assignedToUserId: text("assigned_to_user_id").references(() => user.id, { onDelete: "set null" }),
    subject: text("subject").notNull(),
    category: text("category").notNull(),
    priority: ticketPriorityEnum("priority").default("normal").notNull(),
    status: ticketStatusEnum("status").default("open").notNull(),
    ...timestamps,
  },
  (table) => [
    index("ticket_workspace_idx").on(table.workspaceId),
    index("ticket_status_idx").on(table.status),
  ],
);

export const supportTicketMessages = pgTable(
  "support_ticket_messages",
  {
    id: id(),
    ticketId: text("ticket_id")
      .notNull()
      .references(() => supportTickets.id, { onDelete: "cascade" }),
    authorUserId: text("author_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("ticket_message_ticket_idx").on(table.ticketId)],
);

export const internalSupportNotes = pgTable(
  "internal_support_notes",
  {
    id: id(),
    ticketId: text("ticket_id")
      .notNull()
      .references(() => supportTickets.id, { onDelete: "cascade" }),
    authorUserId: text("author_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("support_note_ticket_idx").on(table.ticketId)],
);

export const auditEvents = pgTable(
  "audit_events",
  {
    id: id(),
    workspaceId: text("workspace_id").references(() => workspaces.id, { onDelete: "set null" }),
    actorUserId: text("actor_user_id").references(() => user.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("audit_workspace_created_idx").on(table.workspaceId, table.createdAt),
    index("audit_action_idx").on(table.action),
  ],
);

export const featureConfiguration = pgTable(
  "feature_configuration",
  {
    id: id(),
    key: text("key").notNull(),
    workspaceId: text("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }),
    enabled: boolean("enabled").default(false).notNull(),
    configuration: jsonb("configuration").$type<Record<string, unknown>>().default({}).notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("feature_key_workspace_unique").on(table.key, table.workspaceId)],
);

export const billingCustomers = pgTable("billing_customers", {
  id: id(),
  workspaceId: text("workspace_id")
    .notNull()
    .unique()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  providerCustomerId: text("provider_customer_id").unique(),
  plan: text("plan").default("free").notNull(),
  subscriptionStatus: text("subscription_status").default("inactive").notNull(),
  providerSubscriptionId: text("provider_subscription_id").unique(),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false).notNull(),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  ...timestamps,
});

export type WorkspaceRole = (typeof roleEnum.enumValues)[number];
export type Persona = (typeof personaEnum.enumValues)[number];
