import type { APIContext } from "astro";
import { fetchGoogleCalendarEvents } from "../../lib/calendar";

export const prerender = false;

export async function GET({ locals, request }: APIContext) {
  const runtime = locals.runtime;
  const calendarId = runtime?.env?.PUBLIC_GOOGLE_CALENDAR_ID;
  const expectedPassword = runtime?.env?.EVENTS_DEBUG_PASSWORD || import.meta.env.EVENTS_DEBUG_PASSWORD;
  const providedPassword = request.headers.get("x-events-debug-password");

  if (!expectedPassword) {
    return new Response(
      JSON.stringify(
        {
          error: "EVENTS_DEBUG_PASSWORD is not configured",
        },
        null,
        2,
      ),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }

  if (providedPassword !== expectedPassword) {
    return new Response(
      JSON.stringify(
        {
          error: "Unauthorized",
        },
        null,
        2,
      ),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }

  try {
    const events = await fetchGoogleCalendarEvents(calendarId);

    return new Response(
      JSON.stringify(
        {
          eventCount: events.length,
          events: events.map((e) => ({
            title: e.title,
            date: e.date,
            startTime: e.startTime,
            type: e.type,
            isRecurring: e.isRecurring,
          })),
        },
        null,
        2,
      ),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify(
        {
          error: error instanceof Error ? error.message : String(error),
        },
        null,
        2,
      ),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
}
