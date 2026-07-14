import type { APIContext } from "astro";
import { env as cfEnv } from "cloudflare:workers";
import { sendEmail } from "../../lib/email";
import { verifyTurnstile } from "../../lib/turnstile";

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

async function sendContactEmail(subject: string, text: string): Promise<void> {
  const binding = (cfEnv as any).SEND_EMAIL as { send: (msg: unknown) => Promise<void> } | undefined;
  await sendEmail(binding, { fromAddr: FROM_ADDR, fromName: FROM_NAME, to: TO, subject, text });
}

export async function POST({ request }: APIContext) {
  const turnstileSecret = (cfEnv as any).TURNSTILE_SECRET_KEY as string | undefined;

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
    const { success, codes } = await verifyTurnstile(turnstileToken, turnstileSecret);
    if (!success) {
      return new Response(JSON.stringify({ error: "CAPTCHA verification failed", codes }), { status: 400 });
    }
  }

  if (type === "feedback") {
    await sendContactEmail(
      `New feedback from ${name}`,
      [`Name: ${name}`, `Email: ${email}`, ``, `Message:`, message].join("\n")
    );
  }

  if (type === "discord") {
    await sendContactEmail(
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
