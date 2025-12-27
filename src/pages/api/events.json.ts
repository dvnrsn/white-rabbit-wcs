import type { APIRoute } from 'astro';
import { fetchGoogleCalendarEvents } from '../../lib/calendar';

// Make this endpoint server-rendered so it fetches fresh data
export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const events = await fetchGoogleCalendarEvents();

    return new Response(JSON.stringify(events), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        // Cache for 5 minutes
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error) {
    console.error('Error fetching calendar events:', error);

    return new Response(
      JSON.stringify({ error: 'Failed to fetch events' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};
