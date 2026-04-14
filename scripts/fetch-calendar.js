// Fetches Google Calendar data and saves as JSON
// Run with: PUBLIC_GOOGLE_CALENDAR_ID=xxx node scripts/fetch-calendar.js

import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import ICAL from 'ical.js';
import { Temporal } from '@js-temporal/polyfill';

const __dirname = dirname(fileURLToPath(import.meta.url));

const CALENDAR_ID = process.env.PUBLIC_GOOGLE_CALENDAR_ID;

if (!CALENDAR_ID) {
  console.error('PUBLIC_GOOGLE_CALENDAR_ID not set');
  process.exit(1);
}

const TZ = 'America/Phoenix';
const cutoff = Temporal.Now.plainDateISO(TZ).subtract({ months: 1 });

function icalToPlainDate(icalTime) {
  const jsDate = icalTime.toJSDate();
  return Temporal.PlainDate.from(jsDate.toLocaleDateString('en-CA', { timeZone: TZ }));
}

function icalToTimeString(icalTime) {
  const jsDate = icalTime.toJSDate();
  return jsDate.toLocaleTimeString('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
}

function parseDescription(description) {
  const fields = {};

  // Clean up HTML formatting that Google Calendar adds
  let cleanDescription = description
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/<a[^>]*>([^<]*)<\/a>/gi, '$1')
    .replace(/<a[^>]*><br\s*\/?><\/a>/gi, '')
    .replace(/<a[^>]*>\s*<\/a>/gi, '')
    .replace(/<h[1-6][^>]*><b>([^<]+)<\/b><\/h[1-6]>/gi, '\n$1\n')
    .replace(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi, '\n$1\n')
    .replace(/<\/?b>/gi, '')
    .replace(/<\/?strong>/gi, '')
    .replace(/<\/p>\s*<p>/gi, '\n')
    .replace(/<\/?p>/gi, '\n')
    .replace(/<\/?span[^>]*>/g, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const lines = cleanDescription.split('\n');
  const descriptionLines = [];

  for (const line of lines) {
    const match = line.match(/^(Description|Venue|Price|Level|Type|Organizer|URL|Instagram|Website):\s*(.+)$/i);
    if (match) {
      const [, field, value] = match;
      const fieldLower = field.toLowerCase();
      if (fieldLower === 'description') {
        descriptionLines.push(value.trim());
      } else {
        fields[fieldLower] = fieldLower === 'type' ? value.trim().toLowerCase() : value.trim();
      }
    } else {
      descriptionLines.push(line);
    }
  }

  if (descriptionLines.length > 0) {
    fields.description = descriptionLines.join('\n').trim();
  }

  return fields;
}

function buildEvent(id, baseUid, event, startDate, endDate, extra = {}) {
  const description = event.description || '';
  const customFields = parseDescription(description);
  return {
    id,
    baseUid,
    title: event.summary || 'Untitled Event',
    description: customFields.description || description,
    date: icalToPlainDate(startDate).toString(),
    startTime: icalToTimeString(startDate),
    endTime: icalToTimeString(endDate),
    venue: customFields.venue || event.location || 'TBA',
    address: event.location || '',
    price: customFields.price || 'Free',
    level: customFields.level || '',
    type: customFields.type || 'social',
    organizer: customFields.organizer || 'White Rabbit WCS',
    url: customFields.url || undefined,
    instagram: customFields.instagram || undefined,
    website: customFields.website || undefined,
    ...extra,
  };
}

function parseICalData(icalData) {
  const jcalData = ICAL.parse(icalData);
  const comp = new ICAL.Component(jcalData);
  const vevents = comp.getAllSubcomponents('vevent');
  const allEvents = [];
  const today = Temporal.Now.plainDateISO(TZ);

  vevents.forEach((vevent) => {
    const event = new ICAL.Event(vevent);

    if (event.isRecurring()) {
      const iterator = event.iterator();
      let count = 0;
      let iterations = 0;
      const maxFutureOccurrences = 2;
      const maxIterations = 365;
      let next;
      while (count < maxFutureOccurrences && iterations < maxIterations && (next = iterator.next())) {
        iterations++;
        const occurrence = event.getOccurrenceDetails(next);
        const startPlainDate = icalToPlainDate(occurrence.startDate);
        if (Temporal.PlainDate.compare(startPlainDate, cutoff) < 0) continue;
        allEvents.push(buildEvent(`${event.uid}-${count}`, event.uid, event, occurrence.startDate, occurrence.endDate, { isRecurring: true }));
        if (Temporal.PlainDate.compare(startPlainDate, today) >= 0) count++;
      }
      if (iterations === maxIterations) {
        console.warn(`[calendar] maxIterations hit for recurring event "${event.summary}" (${event.uid}) — some occurrences may be missing`);
      }
    } else {
      const startPlainDate = icalToPlainDate(event.startDate);
      if (Temporal.PlainDate.compare(startPlainDate, cutoff) < 0) return;
      allEvents.push(buildEvent(event.uid, event.uid, event, event.startDate, event.endDate));
    }
  });

  const sorted = allEvents.sort((a, b) => b.date.localeCompare(a.date));
  const todayStr = today.toString();
  const pastCounts = {};
  return sorted.filter(event => {
    if (!event.isRecurring || event.date >= todayStr) return true;
    pastCounts[event.baseUid] = (pastCounts[event.baseUid] || 0) + 1;
    return pastCounts[event.baseUid] <= 2;
  });
}

async function fetchCalendar() {
  const url = `https://calendar.google.com/calendar/ical/${encodeURIComponent(CALENDAR_ID)}/public/basic.ics`;
  console.log('Fetching calendar from Google...');

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
  }

  const icalData = await response.text();
  console.log(`Fetched ${icalData.length} bytes of iCal data`);

  const events = parseICalData(icalData);

  const outputPath = join(__dirname, '../src/data/events.json');
  writeFileSync(outputPath, JSON.stringify(events, null, 2));
  console.log(`Parsed and saved ${events.length} events to ${outputPath}`);
}

fetchCalendar().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
