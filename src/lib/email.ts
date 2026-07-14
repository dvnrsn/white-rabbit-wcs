export interface SendEmailOptions {
  fromAddr: string;
  fromName: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
}

type SendEmailBinding = { send: (msg: unknown) => Promise<void> };

/**
 * Sends via a Cloudflare `send_email` binding. Falls back to a console.log
 * stub when the binding isn't configured (e.g. local dev), matching the
 * pattern already used by the contact form.
 */
export async function sendEmail(binding: SendEmailBinding | undefined, opts: SendEmailOptions): Promise<void> {
  const { fromAddr, fromName, to, subject, text } = opts;

  if (!binding) {
    console.log(`[email] would send to ${to}\nSubject: ${subject}\n\n${text}`);
    return;
  }

  const { createMimeMessage } = await import('mimetext');
  const { EmailMessage } = await import('cloudflare:email');

  const msg = createMimeMessage();
  msg.setSender({ name: fromName, addr: fromAddr });
  msg.setRecipient(to);
  msg.setSubject(subject);
  msg.addMessage({ contentType: 'text/plain', data: text });

  const message = new EmailMessage(fromAddr, to, msg.asRaw());
  await binding.send(message);
}

/**
 * Sends via Resend's HTTP API — used for order-confirmation emails, which
 * (unlike the contact form) need to reach arbitrary customer addresses.
 * Falls back to a console.log stub when no API key is configured (e.g.
 * local dev, or before Resend is set up).
 */
export async function sendResendEmail(apiKey: string | undefined, opts: SendEmailOptions): Promise<void> {
  const { fromAddr, fromName, to, subject, text, html } = opts;

  if (!apiKey) {
    console.log(`[email] would send (via Resend) to ${to}\nSubject: ${subject}\n\n${text}`);
    return;
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `${fromName} <${fromAddr}>`,
      to,
      subject,
      text,
      ...(html ? { html } : {}),
    }),
  });

  if (!res.ok) {
    throw new Error(`Resend send failed: ${res.status} ${await res.text()}`);
  }
}
