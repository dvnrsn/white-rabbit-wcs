import type { APIContext } from "astro";

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

const FROM = "White Rabbit <noreply@whiterabbitwcs.com>";
const TO = "whiterabbitwcs@gmail.com";

function buildMime(subject: string, text: string): string {
  return [
    `From: ${FROM}`,
    `To: ${TO}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/plain; charset=utf-8`,
    ``,
    text,
  ].join("\r\n");
}

async function sendEmail(
  env: Record<string, unknown>,
  subject: string,
  text: string
): Promise<void> {
  const binding = env.SEND_EMAIL as { send: (msg: unknown) => Promise<void> } | undefined;
  if (!binding) {
    // Dev: log instead of sending
    console.log(`[contact] would send email\nSubject: ${subject}\n\n${text}`);
    return;
  }
  const { EmailMessage } = await import("cloudflare:email");
  const raw = buildMime(subject, text);
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(raw));
      controller.close();
    },
  });
  const msg = new EmailMessage(FROM, TO, stream);
  await binding.send(msg);
}

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
    const valid = await verifyTurnstile(turnstileToken, turnstileSecret);
    if (!valid) {
      return new Response(JSON.stringify({ error: "CAPTCHA verification failed" }), { status: 400 });
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
