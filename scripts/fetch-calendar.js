// Fetches Google Calendar data and saves as JSON
// Run with: PUBLIC_GOOGLE_CALENDAR_ID=xxx node scripts/fetch-calendar.js

import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import ICAL from 'ical.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const CALENDAR_ID = process.env.PUBLIC_GOOGLE_CALENDAR_ID;

if (!CALENDAR_ID) {
  console.error('PUBLIC_GOOGLE_CALENDAR_ID not set');
  process.exit(1);
}

function formatDate(date) {
  const year = date.year;
  const month = date.month.toString().padStart(2, '0');
  const day = date.day.toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatTime(date) {
  const hours = date.hour.toString().padStart(2, '0');
  const minutes = date.minute.toString().padStart(2, '0');
  return `${hours}:${minutes}`;
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
  let descriptionLines = [];

  for (const line of lines) {
    const match = line.match(/^(Description|Venue|Price|Level|Type|Organizer|URL|Instagram|Website):\s*(.+)$/i);
    if (match) {
      const [, field, value] = match;
      const fieldLower = field.toLowerCase();

      if (fieldLower === 'description') {
        descriptionLines.push(value.trim());
      } else {
        const processedValue = fieldLower === 'type' ? value.trim().toLowerCase() : value.trim();
        fields[fieldLower] = processedValue;
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

function parseICalData(icalData) {
  const jcalData = ICAL.parse(icalData);
  const comp = new ICAL.Component(jcalData);
  const vevents = comp.getAllSubcomponents('vevent');

  const allEvents = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  vevents.forEach((vevent) => {
    const event = new ICAL.Event(vevent);

    // Check if this is a recurring event
    if (event.isRecurring()) {
      const iterator = event.iterator();
      let count = 0;
      let iterations = 0;
      const maxOccurrences = 2;
      const maxIterations = 365;

      let next;
      while (count < maxOccurrences && iterations < maxIterations && (next = iterator.next())) {
        iterations++;
        if (next.toJSDate() < today) {
          continue;
        }
        const occurrence = event.getOccurrenceDetails(next);
        let startDate = occurrence.startDate.clone();
        let endDate = occurrence.endDate.clone();

        if (startDate.zone && startDate.zone.tzid !== 'UTC') {
          startDate = startDate.convertToZone(ICAL.Timezone.utcTimezone);
        }
        startDate.adjust(0, -7, 0, 0);

        if (endDate.zone && endDate.zone.tzid !== 'UTC') {
          endDate = endDate.convertToZone(ICAL.Timezone.utcTimezone);
        }
        endDate.adjust(0, -7, 0, 0);

        const description = event.description || '';
        const customFields = parseDescription(description);

        allEvents.push({
          id: `${event.uid}-${count}`,
          title: event.summary || 'Untitled Event',
          description: customFields.description || description,
          date: formatDate(startDate),
          startTime: formatTime(startDate),
          endTime: formatTime(endDate),
          venue: customFields.venue || event.location || 'TBA',
          address: event.location || '',
          price: customFields.price || 'Free',
          level: customFields.level || '',
          type: customFields.type || 'social',
          organizer: customFields.organizer || 'White Rabbit WCS',
          url: customFields.url || undefined,
          instagram: customFields.instagram || undefined,
          website: customFields.website || undefined,
          isRecurring: true,
        });

        count++;
      }
    } else {
      let startDate = event.startDate.clone();
      let endDate = event.endDate.clone();

      if (startDate.zone && startDate.zone.tzid !== 'UTC') {
        startDate = startDate.convertToZone(ICAL.Timezone.utcTimezone);
      }
      startDate.adjust(0, -7, 0, 0);

      if (endDate.zone && endDate.zone.tzid !== 'UTC') {
        endDate = endDate.convertToZone(ICAL.Timezone.utcTimezone);
      }
      endDate.adjust(0, -7, 0, 0);

      const description = event.description || '';
      const customFields = parseDescription(description);

      allEvents.push({
        id: event.uid,
        title: event.summary || 'Untitled Event',
        description: customFields.description || description,
        date: formatDate(startDate),
        startTime: formatTime(startDate),
        endTime: formatTime(endDate),
        venue: customFields.venue || event.location || 'TBA',
        address: event.location || '',
        price: customFields.price || 'Free',
        level: customFields.level || '',
        type: customFields.type || 'social',
        organizer: customFields.organizer || 'White Rabbit WCS',
        url: customFields.url || undefined,
        instagram: customFields.instagram || undefined,
        website: customFields.website || undefined,
      });
    }
  });

  return allEvents;
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
