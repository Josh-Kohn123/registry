import { Resend } from "resend";
import { ReactElement } from "react";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

interface SendEmailOptions {
  to: string;
  subject: string;
  react: ReactElement;
}

/**
 * Fire-and-forget email sender.
 * Logs errors but never throws — email failure should not block API responses.
 */
export async function sendEmail({ to, subject, react }: SendEmailOptions) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      react,
    });

    if (error) {
      console.error("[email] Failed to send:", error);
      return null;
    }

    console.log("[email] Sent to", to, "id:", data?.id);
    return data;
  } catch (err) {
    console.error("[email] Unexpected error:", err);
    return null;
  }
}
