import { Resend } from "resend";
import { env } from "../../env.js";

export type EmailTemplate =
  | "welcome"
  | "password-reset"
  | "verification"
  | "workspace-invitation"
  | "support-received"
  | "support-reply";
export interface EmailMessage {
  template: EmailTemplate;
  to: string;
  subject: string;
  data: Record<string, string>;
}
export interface EmailProvider {
  readonly status: "connected" | "unconfigured";
  send(message: EmailMessage): Promise<void>;
}

class ConsoleEmailProvider implements EmailProvider {
  readonly status = "connected" as const;
  async send(message: EmailMessage) {
    console.info(`[email:${message.template}] to=${message.to} subject=${message.subject}`);
  }
}

class ResendEmailProvider implements EmailProvider {
  readonly status = env.RESEND_API_KEY ? ("connected" as const) : ("unconfigured" as const);
  async send(message: EmailMessage) {
    if (!env.RESEND_API_KEY) throw new Error("Resend is selected but RESEND_API_KEY is not configured.");
    const resend = new Resend(env.RESEND_API_KEY);
    await resend.emails.send({
      from: env.EMAIL_FROM,
      to: message.to,
      subject: message.subject,
      text: Object.entries(message.data)
        .map(([key, value]) => `${key}: ${value}`)
        .join("\n"),
    });
  }
}

export function getEmailProvider(): EmailProvider {
  return env.EMAIL_PROVIDER === "resend" ? new ResendEmailProvider() : new ConsoleEmailProvider();
}
