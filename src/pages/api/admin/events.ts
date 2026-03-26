import type { APIContext } from "astro";
import { getDb } from "../../../lib/db";
import { events } from "../../../lib/db/schema";

export const prerender = false;

function recurringToRRule(recurring: string): string | null {
  switch (recurring) {
    case "weekly":
      return "FREQ=WEEKLY";
    case "biweekly":
      return "FREQ=WEEKLY;INTERVAL=2";
    case "monthly":
      return "FREQ=MONTHLY";
    default:
      return null;
  }
}

export async function POST({ request, locals, cookies }: APIContext) {
  const session = cookies.get("admin_session");
  if (!session?.value) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const env = locals.runtime?.env;
  if (!env?.DB) {
    return new Response(JSON.stringify({ error: "Database not available" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: Record<string, string>;
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    body = await request.json();
  } else {
    const formData = await request.formData();
    body = Object.fromEntries(
      [...formData.entries()].map(([k, v]) => [k, String(v)])
    );
  }

  const {
    title,
    description,
    organizer_id,
    venue_id,
    date,
    start_time,
    end_time,
    price,
    level,
    type,
    recurring,
  } = body;

  if (!title || !date) {
    return new Response(
      JSON.stringify({ error: "title and date are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const rrule = recurringToRRule(recurring ?? "once");
  const isRecurring = rrule ? 1 : 0;

  const db = getDb(env);
  const [result] = await db
    .insert(events)
    .values({
      title,
      description: description || null,
      organizerId: organizer_id || null,
      venueId: venue_id || null,
      date,
      startTime: start_time || null,
      endTime: end_time || null,
      price: price || null,
      level: level || null,
      type: type || "social",
      rrule,
      isRecurring,
    })
    .returning({ id: events.id });

  return new Response(JSON.stringify({ id: result?.id }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}
