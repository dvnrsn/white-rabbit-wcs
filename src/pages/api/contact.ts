import type { APIContext } from "astro";
import { createMimeMessage } from "mimetext";

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

const FROM_ADDR = "noreply@whiterabbitwcs.com";
const FROM_NAME = "White Rabbit WCS";
const TO = "whiterabbitwcs@gmail.com";

async function sendEmail(
  env: Record<string, unknown>,
  subject: string,
  text: string
): Promise<void> {
  const binding = env.SEND_EMAIL as { send: (msg: unknown) => Promise<void> } | undefined;
  if (!binding) {
    console.log(`[contact] would send email\nSubject: ${subject}\n\n${text}`);
    return;
  }
  const { EmailMessage } = await import("cloudflare:email");
  const msg = createMimeMessage();
  msg.setSender({ name: FROM_NAME, addr: FROM_ADDR });
  msg.setRecipient(TO);
  msg.setSubject(subject);
  msg.addMessage({ contentType: "text/plain", data: text });
  const message = new EmailMessage(FROM_ADDR, TO, msg.asRaw());
  await binding.send(message);
}

async function verifyTurnstile(token: string, secretKey: string): Promise<{ success: boolean; codes: string[] }> {
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret: secretKey, response: token }),
  });
  const data = (await res.json()) as { success: boolean; "error-codes": string[] };
  return { success: data.success, codes: data["error-codes"] ?? [] };
}

export async function POST({ request, locals }: APIContext) {
  const env = (locals.runtime?.env ?? {}) as Record<string, unknown>;
  const turnstileSecret = env.TURNSTILE_SECRET_KEY as string | undefined;

  let body: Record<string, string>;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), { status: 400 });
  }

  const { type, name, email, message, city, turnstileToken } = body;

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

  if (turnstileSecret) {
    console.log(`[turnstile] token length=${turnstileToken?.length}, prefix=${turnstileToken?.slice(0, 10)}, secret length=${turnstileSecret.length}`);
    const { success, codes } = await verifyTurnstile(turnstileToken, turnstileSecret);
    console.log(`[turnstile] success=${success}, codes=${JSON.stringify(codes)}`);
    if (!success) {
      return new Response(JSON.stringify({ error: "CAPTCHA verification failed", codes }), { status: 400 });
    }
  }

  if (type === "feedback") {
    await sendEmail(
      env,
      `New feedback from ${name}`,
      [`Name: ${name}`, `Email: ${email}`, ``, `Message:`, message].join("\n")
    );
  }

  if (type === "discord") {
    await sendEmail(
      env,
      `New Discord request from ${name}`,
      [
        `Name: ${name}`,
        `Email: ${email}`,
        city ? `City: ${city}` : null,
      ]
        .filter(Boolean)
        .join("\n")
    );
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}
