import type { APIContext } from "astro";
import { RRule } from "rrule";
import { gte } from "drizzle-orm";
import { getDb } from "../../lib/db";
import { events, organizers, venues } from "../../lib/db/schema";
import type { CalendarEvent } from "../../lib/calendar";

export const prerender = false;

interface EventRow {
  id: string;
  title: string;
  description: string | null;
  date: string;
  startTime: string | null;
  endTime: string | null;
  price: string | null;
  level: string | null;
  type: string | null;
  rrule: string | null;
  isRecurring: number | null;
  organizerName: string | null;
  organizerInstagram: string | null;
  organizerWebsite: string | null;
  venueName: string | null;
  venueAddress: string | null;
  venueCity: string | null;
  venueState: string | null;
}

function expandEvent(row: EventRow, date: Date): CalendarEvent {
  const dateStr = date.toISOString().split("T")[0];
  return {
    id: `${row.id}-${dateStr}`,
    title: row.title,
    description: row.description ?? "",
    date: dateStr,
    startTime: row.startTime ?? "",
    endTime: row.endTime ?? "",
    venue: row.venueName ?? "",
    address: row.venueAddress
      ? `${row.venueAddress}${row.venueCity ? `, ${row.venueCity}` : ""}${row.venueState ? `, ${row.venueState}` : ""}`
      : "",
    price: row.price ?? "",
    level: row.level ?? "",
    type: row.type ?? "social",
    organizer: row.organizerName ?? "",
    instagram: row.organizerInstagram ?? undefined,
    website: row.organizerWebsite ?? undefined,
    isRecurring: row.isRecurring === 1,
  };
}

export async function GET({ locals }: APIContext) {
  const env = locals.runtime?.env;

  if (!env?.DB) {
    return new Response(JSON.stringify({ error: "Database not available" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  const lookback = new Date();
  lookback.setMonth(lookback.getMonth() - 1);
  const lookbackStr = lookback.toISOString().split("T")[0];

  const db = getDb(env);
  const rows = await db
    .select({
      id: events.id,
      title: events.title,
      description: events.description,
      date: events.date,
      startTime: events.startTime,
      endTime: events.endTime,
      price: events.price,
      level: events.level,
      type: events.type,
      rrule: events.rrule,
      isRecurring: events.isRecurring,
      organizerName: organizers.name,
      organizerInstagram: organizers.instagram,
      organizerWebsite: organizers.website,
      venueName: venues.name,
      venueAddress: venues.address,
      venueCity: venues.city,
      venueState: venues.state,
    })
    .from(events)
    .leftJoin(organizers, (eq) => eq(events.organizerId, organizers.id))
    .leftJoin(venues, (eq) => eq(events.venueId, venues.id))
    .where(gte(events.date, lookbackStr))
    .orderBy(events.date);

  const calendarEvents: CalendarEvent[] = [];
  const futureLimit = new Date();
  futureLimit.setMonth(futureLimit.getMonth() + 6);

  for (const row of rows) {
    if (row.isRecurring && row.rrule) {
      try {
        const rule = RRule.fromString(
          `DTSTART:${row.date.replace(/-/g, "")}T000000Z\nRRULE:${row.rrule}`
        );
        const occurrences = rule.between(lookback, futureLimit, true).slice(0, 2);
        for (const occ of occurrences) {
          calendarEvents.push(expandEvent(row, occ));
        }
      } catch {
        calendarEvents.push(expandEvent(row, new Date(row.date)));
      }
    } else {
      calendarEvents.push(expandEvent(row, new Date(row.date)));
    }
  }

  calendarEvents.sort((a, b) => b.date.localeCompare(a.date));

  return new Response(JSON.stringify(calendarEvents), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
