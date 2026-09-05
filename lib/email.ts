import "server-only";

/**
 * Email abstraction.
 *
 * No provider is wired up for the MVP. Every call is logged and reported as
 * "not sent" so nothing in the product can claim an email went out when it
 * did not. Implement `send` against Resend/Postmark/SES and set
 * EMAIL_PROVIDER to switch it on.
 */
export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export type EmailTemplate =
  | "welcome"
  | "payment_confirmation"
  | "credits_added"
  | "low_credits"
  | "product_update";

export interface EmailProvider {
  readonly name: string;
  isConfigured(): boolean;
  send(message: EmailMessage): Promise<{ sent: boolean; reason?: string }>;
}

class NoopEmailProvider implements EmailProvider {
  readonly name = "noop";

  isConfigured(): boolean {
    return false;
  }

  async send(message: EmailMessage) {
    console.log("[email] not sent — no provider configured", {
      to: message.to.replace(/(.{2}).*(@.*)/, "$1***$2"),
      subject: message.subject,
    });
    return { sent: false, reason: "no_provider_configured" as const };
  }
}

let provider: EmailProvider = new NoopEmailProvider();

export function getEmailProvider(): EmailProvider {
  return provider;
}

export function setEmailProvider(next: EmailProvider) {
  provider = next;
}

export async function sendEmail(message: EmailMessage) {
  return getEmailProvider().send(message);
}
