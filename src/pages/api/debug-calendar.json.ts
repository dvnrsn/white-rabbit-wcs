export const prerender = false;

export async function GET() {
  const calendarId =
    import.meta.env.PUBLIC_GOOGLE_CALENDAR_ID || "NOT_SET";

  const calendarUrl = `https://calendar.google.com/calendar/ical/${encodeURIComponent(calendarId)}/public/basic.ics`;

  const debugInfo: any = {
    calendarId,
    calendarUrl,
    envVarPresent: !!import.meta.env.PUBLIC_GOOGLE_CALENDAR_ID,
    timestamp: new Date().toISOString(),
  };

  // Try to fetch the calendar
  try {
    const response = await fetch(calendarUrl);
    debugInfo.fetchStatus = response.status;
    debugInfo.fetchStatusText = response.statusText;
    debugInfo.fetchOk = response.ok;

    if (response.ok) {
      const text = await response.text();
      debugInfo.responseLength = text.length;
      debugInfo.responsePreview = text.substring(0, 200);

      // Try to count events
      const eventMatches = text.match(/BEGIN:VEVENT/g);
      debugInfo.eventCount = eventMatches ? eventMatches.length : 0;
    } else {
      const errorText = await response.text();
      debugInfo.errorResponse = errorText.substring(0, 500);
    }
  } catch (error) {
    debugInfo.error = error instanceof Error ? error.message : String(error);
    debugInfo.errorStack = error instanceof Error ? error.stack : undefined;
  }

  return new Response(JSON.stringify(debugInfo, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
