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
  instagram?: string;
  website?: string;
  isRecurring?: boolean;
}

export async function fetchGoogleCalendarEvents(calendarId?: string) {
  console.log(
    "[Calendar Debug] calendarId received:",
    calendarId ? `${calendarId.substring(0, 10)}...` : "undefined",
  );

  const CALENDAR_ID = calendarId || "YOUR_CALENDAR_ID@group.calendar.google.com";

  // Check if calendar ID is set
  if (!CALENDAR_ID || CALENDAR_ID === "YOUR_CALENDAR_ID@group.calendar.google.com") {
    console.error("Google Calendar ID not configured");
    return [];
  }

  try {
    // Google Calendar public iCal URL format
    const calendarUrl = `https://calendar.google.com/calendar/ical/${encodeURIComponent(CALENDAR_ID)}/public/basic.ics`;

    const response = await fetch(calendarUrl);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Calendar fetch failed (${response.status}):`, errorText.substring(0, 200));
      throw new Error(`Failed to fetch calendar: ${response.status} ${response.statusText}`);
    }

    const icalData = await response.text();
    // console.log(`Fetched iCal data, length: ${icalData.length}`);

    // console.log(icalData);
    const events = parseICalData(icalData);
    // console.log(events);
    // console.log(`Parsed ${events.length} events from calendar`);

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

  const allEvents: CalendarEvent[] = [];

  vevents.forEach((vevent) => {
    const event = new ICAL.Event(vevent);

    // Check if this is a recurring event
    if (event.isRecurring()) {
      // Get next 2 upcoming occurrences
      const iterator = event.iterator();
      let count = 0;
      let iterations = 0;
      const maxOccurrences = 2;
      const maxIterations = 365; // Safety limit
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let next: ICAL.Time | null;
      // Iterate through occurrences, skipping past ones
      while (count < maxOccurrences && iterations < maxIterations && (next = iterator.next())) {
        iterations++;
        // Skip past occurrences
        if (next.toJSDate() < today) {
          continue;
        }
        const occurrence = event.getOccurrenceDetails(next!);
        const startDate = occurrence.startDate.clone();
        const endDate = occurrence.endDate.clone();

        // Convert to Arizona time
        let convertedStart = startDate;
        let convertedEnd = endDate;

        if (convertedStart.zone && convertedStart.zone.tzid !== "UTC") {
          convertedStart = convertedStart.convertToZone(ICAL.Timezone.utcTimezone);
        }
        convertedStart.adjust(0, -7, 0, 0);

        if (convertedEnd.zone && convertedEnd.zone.tzid !== "UTC") {
          convertedEnd = convertedEnd.convertToZone(ICAL.Timezone.utcTimezone);
        }
        convertedEnd.adjust(0, -7, 0, 0);

        const description = event.description || "";
        const customFields = parseDescription(description);

        allEvents.push({
          id: `${event.uid}-${count}`,
          title: event.summary || "Untitled Event",
          description: customFields.description || description,
          date: formatDate(convertedStart),
          startTime: formatTime(convertedStart),
          endTime: formatTime(convertedEnd),
          venue: customFields.venue || event.location || "TBA",
          address: event.location || "",
          price: customFields.price || "Free",
          level: customFields.level || "",
          type: customFields.type || "social",
          organizer: customFields.organizer || "White Rabbit WCS",
          url: customFields.url || undefined,
          instagram: customFields.instagram || undefined,
          website: customFields.website || undefined,
          isRecurring: true,
        });

        count++;
      }
    } else {
      // Non-recurring event - process normally
      let startDate = event.startDate.clone();
      let endDate = event.endDate.clone();

      // Convert to UTC first, then adjust to Arizona time
      if (startDate.zone && startDate.zone.tzid !== "UTC") {
        startDate = startDate.convertToZone(ICAL.Timezone.utcTimezone);
      }
      startDate.adjust(0, -7, 0, 0);

      if (endDate.zone && endDate.zone.tzid !== "UTC") {
        endDate = endDate.convertToZone(ICAL.Timezone.utcTimezone);
      }
      endDate.adjust(0, -7, 0, 0);

      const description = event.description || "";
      const customFields = parseDescription(description);

      allEvents.push({
        id: event.uid,
        title: event.summary || "Untitled Event",
        description: customFields.description || description,
        date: formatDate(startDate),
        startTime: formatTime(startDate),
        endTime: formatTime(endDate),
        venue: customFields.venue || event.location || "TBA",
        address: event.location || "",
        price: customFields.price || "Free",
        level: customFields.level || "",
        type: customFields.type || "social",
        organizer: customFields.organizer || "White Rabbit WCS",
        url: customFields.url || undefined,
        instagram: customFields.instagram || undefined,
        website: customFields.website || undefined,
      });
    }
  });

  return allEvents;
}

function formatDate(date: ICAL.Time): string {
  // Use ICAL.Time properties directly to preserve timezone
  const year = date.year;
  const month = date.month.toString().padStart(2, "0");
  const day = date.day.toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTime(date: ICAL.Time): string {
  // Use ICAL.Time properties directly to preserve timezone
  const hours = date.hour.toString().padStart(2, "0");
  const minutes = date.minute.toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

function parseDescription(description: string): Partial<CalendarEvent> {
  const fields: Partial<CalendarEvent> = {};

  // Clean up HTML formatting that Google Calendar adds
  let cleanDescription = description
    // Decode HTML entities first
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    // Remove all anchor tags completely
    .replace(/<a[^>]*>([^<]*)<\/a>/gi, "$1") // Replace links with just their text content
    .replace(/<a[^>]*><br\s*\/?><\/a>/gi, "") // Remove empty links like <a href="..."><br></a>
    .replace(/<a[^>]*>\s*<\/a>/gi, "") // Remove empty links
    // Convert heading tags to uppercase text with newlines
    .replace(/<h[1-6][^>]*><b>([^<]+)<\/b><\/h[1-6]>/gi, "\n$1\n")
    .replace(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi, "\n$1\n")
    // Keep bold text but remove tags
    .replace(/<\/?b>/gi, "")
    .replace(/<\/?strong>/gi, "")
    // Remove paragraph tags but preserve spacing
    .replace(/<\/p>\s*<p>/gi, "\n")
    .replace(/<\/?p>/gi, "\n")
    .replace(/<\/?span[^>]*>/g, "") // Remove <span> tags
    .replace(/<br\s*\/?>/gi, "\n") // Convert <br> to newlines
    .replace(/&nbsp;/g, " ") // Convert &nbsp; to spaces
    // Clean up multiple consecutive newlines
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // Parse custom fields from description
  // Format: Field: Value (each on new line)
  const lines = cleanDescription.split("\n");
  let descriptionLines: string[] = [];

  for (const line of lines) {
    const match = line.match(
      /^(Description|Venue|Price|Level|Type|Organizer|URL|Instagram|Website):\s*(.+)$/i,
    );
    if (match) {
      const [, field, value] = match;
      const fieldLower = field.toLowerCase() as keyof CalendarEvent;

      // Handle Description field specially - it goes into description, not as a separate field
      if (fieldLower === "description") {
        descriptionLines.push(value.trim());
      } else {
        // Lowercase the type field for consistent filtering
        const processedValue = fieldLower === "type" ? value.trim().toLowerCase() : value.trim();
        (fields as any)[fieldLower] = processedValue;
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
