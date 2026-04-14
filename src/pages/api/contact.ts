import type { APIContext } from "astro";
import { Resend } from "resend";

export const prerender = false;

const PHOENIX_CITIES = [
  "Phoenix",
  "Scottsdale",
  "Tempe",
  "Mesa",
  "Chandler",
  "Gilbert",
  "Glendale",
  "Peoria",
  "Surprise",
  "Tucson",
  "Flagstaff",
  "Prescott",
];

async function verifyTurnstile(token: string, secretKey: string): Promise<boolean> {
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret: secretKey, response: token }),
  });
  const data = (await res.json()) as { success: boolean };
  return data.success;
}

export async function POST({ request, locals }: APIContext) {
  const env = locals.runtime?.env ?? import.meta.env;

  const resendKey = env.RESEND_API_KEY;
  const turnstileSecret = env.TURNSTILE_SECRET_KEY;
  const contactEmail = env.CONTACT_EMAIL ?? "whiterabbitwcs@gmail.com";
  const discordUrl = env.DISCORD_INVITE_URL;

  if (!resendKey) {
    return new Response(JSON.stringify({ error: "Server misconfiguration" }), { status: 500 });
  }

  let body: Record<string, string>;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), { status: 400 });
  }

  const { type, name, email, message, city, turnstileToken } = body;

  // Validate required fields
  if (!type || !name || !email || !turnstileToken) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
  }
  if (type !== "feedback" && type !== "discord") {
    return new Response(JSON.stringify({ error: "Invalid form type" }), { status: 400 });
  }
  if (type === "feedback" && !message) {
    return new Response(JSON.stringify({ error: "Message is required" }), { status: 400 });
  }
  if (city && !PHOENIX_CITIES.includes(city)) {
    return new Response(JSON.stringify({ error: "Invalid city" }), { status: 400 });
  }

  // Verify Turnstile
  if (turnstileSecret) {
    const valid = await verifyTurnstile(turnstileToken, turnstileSecret);
    if (!valid) {
      return new Response(JSON.stringify({ error: "CAPTCHA verification failed" }), { status: 400 });
    }
  }

  const resend = new Resend(resendKey);

  if (type === "feedback") {
    await resend.emails.send({
      from: "White Rabbit Site <noreply@whiterabbitwcs.com>",
      to: contactEmail,
      subject: `New feedback from ${name}`,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        ``,
        `Message:`,
        message,
      ].join("\n"),
    });

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  if (type === "discord") {
    // Notify the admin
    await resend.emails.send({
      from: "White Rabbit Site <noreply@whiterabbitwcs.com>",
      to: contactEmail,
      subject: `New Discord request from ${name}`,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        city ? `City: ${city}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
    });

    // Send the invite link to the user if available
    if (discordUrl) {
      await resend.emails.send({
        from: "White Rabbit WCS <noreply@whiterabbitwcs.com>",
        to: email,
        subject: "You're invited to the White Rabbit Discord",
        text: [
          `Hey ${name},`,
          ``,
          `Welcome to the White Rabbit WCS community! Here's your Discord invite:`,
          ``,
          discordUrl,
          ``,
          `See you on the dance floor.`,
          `— White Rabbit WCS`,
        ].join("\n"),
      });
    }

    return new Response(JSON.stringify({ ok: true, sentInvite: !!discordUrl }), { status: 200 });
  }
}
