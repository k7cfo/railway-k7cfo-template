CREATE TYPE "public"."persona" AS ENUM('builder', 'operator', 'leader', 'explorer');
--> statement-breakpoint
CREATE TYPE "public"."workspace_kind" AS ENUM('personal', 'team');
--> statement-breakpoint
CREATE TYPE "public"."workspace_role" AS ENUM('owner', 'admin', 'member', 'support');
--> statement-breakpoint
CREATE TYPE "public"."invitation_status" AS ENUM('pending', 'accepted', 'revoked', 'expired');
--> statement-breakpoint
CREATE TYPE "public"."ticket_status" AS ENUM('open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed');
--> statement-breakpoint
CREATE TYPE "public"."ticket_priority" AS ENUM('low', 'normal', 'high', 'urgent');
--> statement-breakpoint
CREATE TABLE "user" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
  "name" text NOT NULL, "email" text NOT NULL, "email_verified" boolean DEFAULT false NOT NULL,
  "image" text, "created_at" timestamptz DEFAULT now() NOT NULL, "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "session" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL, "expires_at" timestamptz NOT NULL,
  "token" text NOT NULL, "ip_address" text, "user_agent" text, "user_id" text NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL, "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "account" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL, "account_id" text NOT NULL, "provider_id" text NOT NULL,
  "user_id" text NOT NULL, "access_token" text, "refresh_token" text, "id_token" text,
  "access_token_expires_at" timestamptz, "refresh_token_expires_at" timestamptz, "scope" text, "password" text,
  "created_at" timestamptz DEFAULT now() NOT NULL, "updated_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL, "identifier" text NOT NULL, "value" text NOT NULL,
  "expires_at" timestamptz NOT NULL, "created_at" timestamptz DEFAULT now() NOT NULL, "updated_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL, "user_id" text NOT NULL, "display_name" text NOT NULL,
  "bio" text DEFAULT '' NOT NULL, "job_title" text DEFAULT '' NOT NULL, "timezone" text DEFAULT 'UTC' NOT NULL,
  "persona" "persona", "system_role" "workspace_role" DEFAULT 'member' NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL, "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "user_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL, "name" text NOT NULL, "slug" text NOT NULL,
  "kind" "workspace_kind" NOT NULL, "owner_user_id" text NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL, "updated_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_memberships" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL, "workspace_id" text NOT NULL, "user_id" text NOT NULL,
  "role" "workspace_role" DEFAULT 'member' NOT NULL, "created_at" timestamptz DEFAULT now() NOT NULL, "updated_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_invitations" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL, "workspace_id" text NOT NULL, "email" text NOT NULL,
  "role" "workspace_role" DEFAULT 'member' NOT NULL, "token_hash" text NOT NULL,
  "status" "invitation_status" DEFAULT 'pending' NOT NULL, "invited_by_user_id" text NOT NULL, "expires_at" timestamptz NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL, "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "workspace_invitations_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL, "user_id" text NOT NULL, "active_workspace_id" text,
  "theme" text DEFAULT 'system' NOT NULL, "email_notifications" boolean DEFAULT true NOT NULL, "reduced_motion" boolean DEFAULT false NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL, "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "user_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "workspace_settings" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL, "workspace_id" text NOT NULL,
  "team_features_enabled" boolean DEFAULT true NOT NULL, "invite_only" boolean DEFAULT false NOT NULL, "billing_email" text,
  "created_at" timestamptz DEFAULT now() NOT NULL, "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "workspace_settings_workspace_id_unique" UNIQUE("workspace_id")
);
--> statement-breakpoint
CREATE TABLE "onboarding_progress" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL, "user_id" text NOT NULL,
  "current_step" text DEFAULT 'profile' NOT NULL, "intended_use" text DEFAULT '' NOT NULL,
  "first_action_completed" boolean DEFAULT false NOT NULL, "completed_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL, "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "onboarding_progress_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL, "workspace_id" text NOT NULL,
  "created_by_user_id" text NOT NULL, "assigned_to_user_id" text, "subject" text NOT NULL, "category" text NOT NULL,
  "priority" "ticket_priority" DEFAULT 'normal' NOT NULL, "status" "ticket_status" DEFAULT 'open' NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL, "updated_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_ticket_messages" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL, "ticket_id" text NOT NULL, "author_user_id" text NOT NULL,
  "body" text NOT NULL, "created_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "internal_support_notes" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL, "ticket_id" text NOT NULL, "author_user_id" text NOT NULL,
  "body" text NOT NULL, "created_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_events" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL, "workspace_id" text, "actor_user_id" text,
  "action" text NOT NULL, "target_type" text NOT NULL, "target_id" text, "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feature_configuration" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL, "key" text NOT NULL, "workspace_id" text,
  "enabled" boolean DEFAULT false NOT NULL, "configuration" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL, "updated_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "billing_customers" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL, "workspace_id" text NOT NULL, "provider_customer_id" text,
  "plan" text DEFAULT 'free' NOT NULL, "subscription_status" text DEFAULT 'inactive' NOT NULL, "provider_subscription_id" text,
  "cancel_at_period_end" boolean DEFAULT false NOT NULL, "current_period_end" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL, "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "billing_customers_workspace_id_unique" UNIQUE("workspace_id"),
  CONSTRAINT "billing_customers_provider_customer_id_unique" UNIQUE("provider_customer_id"),
  CONSTRAINT "billing_customers_provider_subscription_id_unique" UNIQUE("provider_subscription_id")
);
--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_owner_user_id_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."user"("id") ON DELETE restrict;
--> statement-breakpoint
ALTER TABLE "workspace_memberships" ADD CONSTRAINT "memberships_workspace_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "workspace_memberships" ADD CONSTRAINT "memberships_user_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "workspace_invitations" ADD CONSTRAINT "invitations_workspace_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "workspace_invitations" ADD CONSTRAINT "invitations_inviter_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."user"("id") ON DELETE restrict;
--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "preferences_user_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "preferences_workspace_fk" FOREIGN KEY ("active_workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE set null;
--> statement-breakpoint
ALTER TABLE "workspace_settings" ADD CONSTRAINT "settings_workspace_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "onboarding_progress" ADD CONSTRAINT "onboarding_user_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "tickets_workspace_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "tickets_creator_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE restrict;
--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "tickets_assignee_fk" FOREIGN KEY ("assigned_to_user_id") REFERENCES "public"."user"("id") ON DELETE set null;
--> statement-breakpoint
ALTER TABLE "support_ticket_messages" ADD CONSTRAINT "messages_ticket_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "support_ticket_messages" ADD CONSTRAINT "messages_author_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."user"("id") ON DELETE restrict;
--> statement-breakpoint
ALTER TABLE "internal_support_notes" ADD CONSTRAINT "notes_ticket_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "internal_support_notes" ADD CONSTRAINT "notes_author_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."user"("id") ON DELETE restrict;
--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_workspace_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE set null;
--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_actor_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."user"("id") ON DELETE set null;
--> statement-breakpoint
ALTER TABLE "feature_configuration" ADD CONSTRAINT "feature_workspace_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "billing_customers" ADD CONSTRAINT "billing_workspace_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade;
--> statement-breakpoint
CREATE INDEX "session_user_idx" ON "session" ("user_id");
CREATE UNIQUE INDEX "account_provider_unique" ON "account" ("provider_id", "account_id");
CREATE INDEX "account_user_idx" ON "account" ("user_id");
CREATE INDEX "verification_identifier_idx" ON "verification" ("identifier");
CREATE UNIQUE INDEX "workspace_slug_unique" ON "workspaces" ("slug");
CREATE INDEX "workspace_owner_idx" ON "workspaces" ("owner_user_id");
CREATE UNIQUE INDEX "membership_workspace_user_unique" ON "workspace_memberships" ("workspace_id", "user_id");
CREATE INDEX "membership_user_idx" ON "workspace_memberships" ("user_id");
CREATE INDEX "invitation_workspace_idx" ON "workspace_invitations" ("workspace_id");
CREATE INDEX "invitation_email_idx" ON "workspace_invitations" ("email");
CREATE INDEX "ticket_workspace_idx" ON "support_tickets" ("workspace_id");
CREATE INDEX "ticket_status_idx" ON "support_tickets" ("status");
CREATE INDEX "ticket_message_ticket_idx" ON "support_ticket_messages" ("ticket_id");
CREATE INDEX "support_note_ticket_idx" ON "internal_support_notes" ("ticket_id");
CREATE INDEX "audit_workspace_created_idx" ON "audit_events" ("workspace_id", "created_at");
CREATE INDEX "audit_action_idx" ON "audit_events" ("action");
CREATE UNIQUE INDEX "feature_key_workspace_unique" ON "feature_configuration" ("key", "workspace_id");
