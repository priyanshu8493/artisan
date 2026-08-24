import { formatMoney } from "./money";

/**
 * Transactional email sender.
 * Uses Resend HTTP API when RESEND_API_KEY is set; otherwise logs to console
 * (dev outbox) so local flows never break. Swap provider here later if needed.
 */

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailPayload): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "Artisan Market <onboarding@resend.dev>";
  if (!key) {
    console.log(`[email:dev-outbox] to=${to} subject="${subject}"`);
    return;
  }
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [to], subject, html }),
    });
  } catch (err) {
    console.error("[email] send failed", err);
  }
}

function layout(title: string, bodyHtml: string): string {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#FAF6F0;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF6F0;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(33,30,27,.08);">
        <tr><td style="background:#211E1B;padding:24px 32px;text-align:center;">
          <span style="color:#FAF6F0;font-size:22px;letter-spacing:.12em;text-transform:uppercase;">Artisan Market</span>
        </td></tr>
        <tr><td style="padding:32px;color:#211E1B;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;">
          <h1 style="font-family:Georgia,serif;font-size:24px;margin:0 0 16px;">${title}</h1>
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:16px 32px;background:#F1E8DC;color:#6E675D;font-size:12px;font-family:Helvetica,Arial,sans-serif;text-align:center;">
          Handcrafted with care · Questions? Reply to this email anytime.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export function orderConfirmationEmail(opts: {
  orderNumber: string;
  customerName: string;
  totalCents: number;
  region: "US" | "GB";
  itemCount: number;
}): string {
  return layout(
    "Thank you for your order!",
    `<p>Hi ${opts.customerName},</p>
     <p>Your order <strong>${opts.orderNumber}</strong> (${opts.itemCount} item${opts.itemCount === 1 ? "" : "s"}) has been received and is being prepared by our artisans.</p>
     <p style="font-size:20px;"><strong>Total: ${formatMoney(opts.totalCents, opts.region)}</strong></p>
     <p>You can track your order any time from your account.</p>`
  );
}

export function shippingUpdateEmail(opts: {
  orderNumber: string;
  status: string;
  message?: string | null;
}): string {
  return layout(
    `Your order is ${opts.status.toLowerCase()}`,
    `<p>Order <strong>${opts.orderNumber}</strong> status update: <strong>${opts.status}</strong>.</p>
     ${opts.message ? `<p>${opts.message}</p>` : ""}
     <p>Thank you for supporting handmade craft.</p>`
  );
}

export function welcomeEmail(name: string): string {
  return layout(
    `Welcome, ${name}`,
    `<p>Your Artisan Market account is ready. Discover one-of-a-kind pieces made by independent makers across the US and UK.</p>
     <p>Happy exploring!</p>`
  );
}
