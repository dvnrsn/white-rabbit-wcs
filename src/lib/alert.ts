import { sendResendEmail } from './email';

const ALERT_FROM_ADDR = 'orders@whiterabbitwcs.com';
const ALERT_FROM_NAME = 'White Rabbit WCS';

/**
 * Best-effort ops alert -- the closest thing this app has to Sentry.
 * Emails DEV_ALERT_EMAIL via Resend whenever something fails silently
 * (a webhook can't notify a customer, a background job errors, etc.)
 * so it doesn't go unnoticed in Workers logs alone.
 *
 * Never throws: a broken alert path must never mask the original error
 * or fail the caller's response. Falls back to a console.error when
 * DEV_ALERT_EMAIL isn't configured, same as the console.log stubs in
 * src/lib/email.ts.
 *
 * Goes via Resend (arbitrary recipients) rather than the SEND_EMAIL
 * binding, which can only reach the one verified merchant inbox.
 * The destination is a secret, not hardcoded, since this repo is public.
 */
export async function alertDev(env: Record<string, string | undefined>, subject: string, text: string): Promise<void> {
  const devAlertTo = env.DEV_ALERT_EMAIL;

  if (!devAlertTo) {
    console.error(`[alert] DEV_ALERT_EMAIL not configured, dropping alert: ${subject}`);
    return;
  }

  try {
    await sendResendEmail(env.RESEND_API_KEY, {
      fromAddr: ALERT_FROM_ADDR,
      fromName: ALERT_FROM_NAME,
      to: devAlertTo,
      subject: `[alert] ${subject}`,
      text,
    });
  } catch (err) {
    console.error('[alert] dev alert email failed', err);
  }
}
