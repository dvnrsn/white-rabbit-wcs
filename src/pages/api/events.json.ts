import type { APIContext } from "astro";
import { RRule } from "rrule";
import type { CalendarEvent } from "../../lib/calendar";

export const prerender = false;

interface DbEvent {
  id: string;
  title: string;
  description: string | null;
  organizer_id: string | null;
  venue_id: string | null;
  date: string;
  start_time: string | null;
  end_time: string | null;
  price: string | null;
  level: string | null;
  type: string | null;
  rrule: string | null;
  is_recurring: number;
  created_at: string;
  organizer_name: string | null;
  organizer_instagram: string | null;
  organizer_website: string | null;
  venue_name: string | null;
  venue_address: string | null;
  venue_city: string | null;
  venue_state: string | null;
  venue_maps_url: string | null;
}

function expandEvent(row: DbEvent, date: Date): CalendarEvent {
  const dateStr = date.toISOString().split("T")[0];
  return {
    id: `${row.id}-${dateStr}`,
    title: row.title,
    description: row.description ?? "",
    date: dateStr,
    startTime: row.start_time ?? "",
    endTime: row.end_time ?? "",
    venue: row.venue_name ?? "",
    address: row.venue_address
      ? `${row.venue_address}${row.venue_city ? `, ${row.venue_city}` : ""}${row.venue_state ? `, ${row.venue_state}` : ""}`
      : "",
    price: row.price ?? "",
    level: row.level ?? "",
    type: row.type ?? "social",
    organizer: row.organizer_name ?? "",
    instagram: row.organizer_instagram ?? undefined,
    website: row.organizer_website ?? undefined,
    isRecurring: row.is_recurring === 1,
  };
}

export async function GET({ locals }: APIContext) {
  const db = locals.runtime?.env?.DB;

  if (!db) {
    return new Response(JSON.stringify({ error: "Database not available" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Look back one month, no upper limit needed for recurring expansion
  const lookback = new Date();
  lookback.setMonth(lookback.getMonth() - 1);
  const lookbackStr = lookback.toISOString().split("T")[0];

  const { results } = await db
    .prepare(
      `SELECT
        e.*,
        o.name AS organizer_name,
        o.instagram AS organizer_instagram,
        o.website AS organizer_website,
        v.name AS venue_name,
        v.address AS venue_address,
        v.city AS venue_city,
        v.state AS venue_state,
        v.maps_url AS venue_maps_url
      FROM events e
      LEFT JOIN organizers o ON e.organizer_id = o.id
      LEFT JOIN venues v ON e.venue_id = v.id
      WHERE e.date >= ?
      ORDER BY e.date DESC`
    )
    .bind(lookbackStr)
    .all<DbEvent>();

  const events: CalendarEvent[] = [];
  const now = new Date();
  const futureLimit = new Date();
  futureLimit.setMonth(futureLimit.getMonth() + 6);

  for (const row of results) {
    if (row.is_recurring && row.rrule) {
      try {
        const rule = RRule.fromString(`DTSTART:${row.date.replace(/-/g, "")}T000000Z\nRRULE:${row.rrule}`);
        const occurrences = rule.between(lookback, futureLimit, true).slice(0, 2);
        for (const occ of occurrences) {
          events.push(expandEvent(row, occ));
        }
      } catch {
        // Fallback: include base date
        events.push(expandEvent(row, new Date(row.date)));
      }
    } else {
      events.push(expandEvent(row, new Date(row.date)));
    }
  }

  // Sort descending by date
  events.sort((a, b) => b.date.localeCompare(a.date));

  return new Response(JSON.stringify(events), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
