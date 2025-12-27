import ICAL from 'ical.js';

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

// This will be set via environment variable or config
// For now, using a placeholder - you'll replace this with your actual calendar ID
const CALENDAR_ID = import.meta.env.PUBLIC_GOOGLE_CALENDAR_ID || 'YOUR_CALENDAR_ID@group.calendar.google.com';

export async function fetchGoogleCalendarEvents(): Promise<CalendarEvent[]> {
  try {
    // Google Calendar public iCal URL format
    const calendarUrl = `https://calendar.google.com/calendar/ical/${encodeURIComponent(CALENDAR_ID)}/public/basic.ics`;

    const response = await fetch(calendarUrl, {
      // Cache for 5 minutes
      next: { revalidate: 300 }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch calendar: ${response.statusText}`);
    }

    const icalData = await response.text();
    return parseICalData(icalData);
  } catch (error) {
    console.error('Error fetching Google Calendar:', error);
    // Return empty array on error to fail gracefully
    return [];
  }
}

function parseICalData(icalData: string): CalendarEvent[] {
  const jcalData = ICAL.parse(icalData);
  const comp = new ICAL.Component(jcalData);
  const vevents = comp.getAllSubcomponents('vevent');

  return vevents.map(vevent => {
    const event = new ICAL.Event(vevent);

    // Extract event details
    const startDate = event.startDate.toJSDate();
    const endDate = event.endDate.toJSDate();

    // Format date and time
    const dateStr = startDate.toISOString().split('T')[0];
    const startTimeStr = formatTime(startDate);
    const endTimeStr = formatTime(endDate);

    // Parse description for custom fields
    const description = event.description || '';
    const customFields = parseDescription(description);

    return {
      id: event.uid,
      title: event.summary || 'Untitled Event',
      description: customFields.description || description,
      date: dateStr,
      startTime: startTimeStr,
      endTime: endTimeStr,
      venue: customFields.venue || event.location || 'TBA',
      address: event.location || '',
      price: customFields.price || 'Free',
      level: customFields.level || 'All Levels',
      type: customFields.type || 'social',
      organizer: event.organizer || 'White Rabbit WCS',
      url: customFields.url || undefined,
    };
  });
}

function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

function parseDescription(description: string): Partial<CalendarEvent> {
  const fields: Partial<CalendarEvent> = {};

  // Parse custom fields from description
  // Format: Field: Value (each on new line)
  const lines = description.split('\n');
  let descriptionLines: string[] = [];

  for (const line of lines) {
    const match = line.match(/^(Venue|Price|Level|Type|Organizer|URL):\s*(.+)$/i);
    if (match) {
      const [, field, value] = match;
      const fieldLower = field.toLowerCase() as keyof CalendarEvent;
      fields[fieldLower] = value.trim();
    } else {
      descriptionLines.push(line);
    }
  }

  // Set cleaned description
  if (descriptionLines.length > 0) {
    fields.description = descriptionLines.join('\n').trim();
  }

  return fields;
}
