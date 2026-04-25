// Fetches Google Calendar data via the Calendar API v3 and saves as JSON.
// Run with: PUBLIC_GOOGLE_CALENDAR_ID=xxx GOOGLE_CALENDAR_API_KEY=xxx node scripts/fetch-calendar.js

import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const CALENDAR_ID = process.env.PUBLIC_GOOGLE_CALENDAR_ID;
const API_KEY = process.env.GOOGLE_CALENDAR_API_KEY;

if (!CALENDAR_ID) { console.error('PUBLIC_GOOGLE_CALENDAR_ID not set'); process.exit(1); }
if (!API_KEY) { console.error('GOOGLE_CALENDAR_API_KEY not set'); process.exit(1); }

const TZ = 'America/Phoenix';

function parseDescription(description) {
  const fields = {};

  // Strip HTML that Google Calendar adds to descriptions
  let clean = description
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&amp;/g, '&')
    .replace(/<a[^>]*>([^<]*)<\/a>/gi, '$1')
    .replace(/<a[^>]*>\s*<\/a>/gi, '')
    .replace(/<h[1-6][^>]*><b>([^<]+)<\/b><\/h[1-6]>/gi, '\n$1\n')
    .replace(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi, '\n$1\n')
    .replace(/<\/?b>/gi, '').replace(/<\/?strong>/gi, '')
    .replace(/<\/p>\s*<p>/gi, '\n').replace(/<\/?p>/gi, '\n')
    .replace(/<\/?span[^>]*>/g, '').replace(/<br\s*\/?>/gi, '\n')
    .replace(/&nbsp;/g, ' ').replace(/\n{3,}/g, '\n\n').trim();

  const descLines = [];
  for (const line of clean.split('\n')) {
    const m = line.match(/^(Description|Venue|Price|Level|Type|Organizer|URL|Instagram|Website):\s*(.+)$/i);
    if (m) {
      const key = m[1].toLowerCase();
      fields[key] = key === 'type' ? m[2].trim().toLowerCase() : m[2].trim();
      if (key === 'description') descLines.push(m[2].trim());
    } else {
      descLines.push(line);
    }
  }

  if (descLines.length > 0) fields.description = descLines.join('\n').trim();
  return fields;
}

function parseDateTime(dt) {
  // All-day: { date: "2026-05-30" }  Timed: { dateTime: "2026-05-30T20:00:00-07:00" }
  if (dt.date) {
    return { date: dt.date, time: '00:00' };
  }
  const d = new Date(dt.dateTime);
  const date = d.toLocaleDateString('en-CA', { timeZone: TZ });
  const time = d.toLocaleTimeString('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
  return { date, time };
}

function buildEvent(item) {
  const custom = parseDescription(item.description || '');
  const start = parseDateTime(item.start);
  const end = parseDateTime(item.end);

  return {
    id: item.id,
    baseUid: item.recurringEventId ?? item.id,
    title: item.summary || 'Untitled Event',
    description: custom.description || '',
    date: start.date,
    startTime: start.time,
    endTime: end.time,
    venue: custom.venue || item.location || 'TBA',
    address: item.location || '',
    price: custom.price || 'Free',
    level: custom.level || '',
    type: custom.type || 'social',
    organizer: custom.organizer || 'White Rabbit WCS',
    ...(custom.url && { url: custom.url }),
    ...(custom.instagram && { instagram: custom.instagram }),
    ...(custom.website && { website: custom.website }),
    ...(item.recurringEventId && { isRecurring: true }),
  };
}

async function fetchAll(baseUrl) {
  const items = [];
  let pageToken;
  do {
    const url = pageToken ? `${baseUrl}&pageToken=${pageToken}` : baseUrl;
    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Calendar API ${res.status}: ${body}`);
    }
    const data = await res.json();
    items.push(...(data.items ?? []));
    pageToken = data.nextPageToken;
  } while (pageToken);
  return items;
}

async function fetchCalendar() {
  const now = new Date();
  const timeMin = new Date(now);
  timeMin.setMonth(timeMin.getMonth() - 1);
  const timeMax = new Date(now);
  timeMax.setMonth(timeMax.getMonth() + 9);

  const params = new URLSearchParams({
    key: API_KEY,
    singleEvents: 'true',
    orderBy: 'startTime',
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    maxResults: '500',
  });

  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events?${params}`;
  console.log('Fetching from Google Calendar API...');

  const items = await fetchAll(url);
  console.log(`Fetched ${items.length} events`);

  const events = items
    .filter(i => i.status !== 'cancelled' && (i.start?.date || i.start?.dateTime))
    .map(buildEvent)
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

  const outPath = join(__dirname, '../src/data/events.json');
  writeFileSync(outPath, JSON.stringify(events, null, 2));
  console.log(`Saved ${events.length} events to src/data/events.json`);
}

fetchCalendar().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
