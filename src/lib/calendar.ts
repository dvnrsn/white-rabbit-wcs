import ICAL from "ical.js";

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  address: string;
  price: string;
  level: string;
  type: string;
  organizer: string;
  url?: string;
}

export async function fetchGoogleCalendarEvents(calendarId?: string) {
  const CALENDAR_ID = calendarId || "YOUR_CALENDAR_ID@group.calendar.google.com";

  // Check if calendar ID is set
  if (!CALENDAR_ID || CALENDAR_ID === "YOUR_CALENDAR_ID@group.calendar.google.com") {
    console.error("Google Calendar ID not configured");
    return [];
  }

  try {
    // Google Calendar public iCal URL format
    const calendarUrl = `https://calendar.google.com/calendar/ical/${encodeURIComponent(CALENDAR_ID)}/public/basic.ics`;

    console.log("Fetching calendar from:", calendarUrl);

    const response = await fetch(calendarUrl);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Calendar fetch failed (${response.status}):`, errorText.substring(0, 200));
      throw new Error(`Failed to fetch calendar: ${response.status} ${response.statusText}`);
    }

    const icalData = await response.text();
    console.log(`Fetched iCal data, length: ${icalData.length}`);

    const events = parseICalData(icalData);
    console.log(`Parsed ${events.length} events from calendar`);

    return events;
  } catch (error) {
    console.error("Error fetching Google Calendar:", error);
    // Return empty array on error to fail gracefully
    return [];
  }
}

function parseICalData(icalData: string): CalendarEvent[] {
  const jcalData = ICAL.parse(icalData);
  const comp = new ICAL.Component(jcalData);
  const vevents = comp.getAllSubcomponents("vevent");

  return vevents.map((vevent) => {
    const event = new ICAL.Event(vevent);

    // Extract event details
    const startDate = event.startDate.toJSDate();
    const endDate = event.endDate.toJSDate();

    // Format date and time in local timezone (not UTC)
    const dateStr = formatDate(startDate);
    const startTimeStr = formatTime(startDate);
    const endTimeStr = formatTime(endDate);

    // Parse description for custom fields
    const description = event.description || "";
    console.log(description);
    const customFields = parseDescription(description);

    return {
      id: event.uid,
      title: event.summary || "Untitled Event",
      description: customFields.description || description,
      date: dateStr,
      startTime: startTimeStr,
      endTime: endTimeStr,
      venue: customFields.venue || event.location || "TBA",
      address: event.location || "",
      price: customFields.price || "Free",
      level: customFields.level || "",
      type: customFields.type || "social",
      organizer: customFields.organizer || "White Rabbit WCS",
      url: customFields.url || undefined,
    };
  });
}

function formatDate(date: Date): string {
  // Format date in local timezone, not UTC
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

function parseDescription(description: string): Partial<CalendarEvent> {
  const fields: Partial<CalendarEvent> = {};

  // Clean up HTML formatting that Google Calendar adds
  let cleanDescription = description
    .replace(/<\/?span[^>]*>/g, "") // Remove <span> tags
    .replace(/<br\s*\/?>/gi, "\n") // Convert <br> to newlines
    .replace(/&nbsp;/g, " "); // Convert &nbsp; to spaces

  // Parse custom fields from description
  // Format: Field: Value (each on new line)
  const lines = cleanDescription.split("\n");
  let descriptionLines: string[] = [];

  for (const line of lines) {
    const match = line.match(/^(Description|Venue|Price|Level|Type|Organizer|URL):\s*(.+)$/i);
    if (match) {
      const [, field, value] = match;
      const fieldLower = field.toLowerCase() as keyof CalendarEvent;

      // Handle Description field specially - it goes into description, not as a separate field
      if (fieldLower === "description") {
        descriptionLines.push(value.trim());
      } else {
        fields[fieldLower] = value.trim();
      }
    } else {
      descriptionLines.push(line);
    }
  }

  // Set cleaned description
  if (descriptionLines.length > 0) {
    fields.description = descriptionLines.join("\n").trim();
  }

  return fields;
}
