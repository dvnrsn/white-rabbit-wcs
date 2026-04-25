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
  let clean = description
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&amp;/g, '&')
    .replace(/<a[^>]*>([^<]*)<\/a>/gi, '$1').replace(/<a[^>]*>\s*<\/a>/gi, '')
    .replace(/<h[1-6][^>]*><b>([^<]+)<\/b><\/h[1-6]>/gi, '\n$1\n')
    .replace(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi, '\n$1\n')
    .replace(/<\/?b>/gi, '').replace(/<\/?strong>/gi, '')
    .replace(/<\/p>\s*<p>/gi, '\n').replace(/<\/?p>/gi, '\n')
    .replace(/<\/?span[^>]*>/g, '').replace(/<br\s*\/?>/gi, '\n')
    .replace(/&nbsp;/g, ' ').replace(/\n{3,}/g, '\n\n').trim();

  const fields = {};
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
  if (dt.date) return { date: dt.date, time: '00:00' };
  const d = new Date(dt.dateTime);
  return {
    date: d.toLocaleDateString('en-CA', { timeZone: TZ }),
    time: d.toLocaleTimeString('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }),
  };
}

function commonFields(item) {
  const custom = parseDescription(item.description || '');
  const start = parseDateTime(item.start);
  const end = parseDateTime(item.end || item.start);
  return {
    id: item.id,
    title: item.summary || 'Untitled Event',
    description: custom.description || '',
    startTime: start.time,
    endTime: end.time,
    venue: custom.venue || item.location || 'TBA',
    address: item.location || '',
    price: custom.price || 'Free',
    level: custom.level || '',
    type: custom.type || 'social',
    organizer: custom.organizer || 'White Rabbit WCS',
    ...(custom.url       && { url: custom.url }),
    ...(custom.instagram && { instagram: custom.instagram }),
    ...(custom.website   && { website: custom.website }),
  };
}

function parseRecurrence(recurrenceArr = []) {
  let rrule = null;
  const exdates = [];
  for (const line of recurrenceArr) {
    if (line.startsWith('RRULE:')) {
      rrule = line.slice(6);
    } else if (line.startsWith('EXDATE')) {
      const value = line.split(':').pop() ?? '';
      for (const d of value.split(',')) {
        const digits = d.replace(/\D/g, '');
        if (digits.length >= 8)
          exdates.push(`${digits.slice(0,4)}-${digits.slice(4,6)}-${digits.slice(6,8)}`);
      }
    }
  }
  return { rrule, exdates };
}

async function calFetch(path) {
  const sep = path.includes('?') ? '&' : '?';
  const res = await fetch(`https://www.googleapis.com/calendar/v3${path}${sep}key=${API_KEY}`);
  if (!res.ok) throw new Error(`Calendar API ${res.status}: ${await res.text()}`);
  return res.json();
}

async function fetchAllInstances(params) {
  const items = [];
  let pageToken;
  do {
    const p = new URLSearchParams(params);
    if (pageToken) p.set('pageToken', pageToken);
    const data = await calFetch(`/calendars/${encodeURIComponent(CALENDAR_ID)}/events?${p}`);
    items.push(...(data.items ?? []));
    pageToken = data.nextPageToken;
  } while (pageToken);
  return items;
}

async function fetchCalendar() {
  const now = new Date();
  const timeMin = new Date(now); timeMin.setMonth(timeMin.getMonth() - 1);
  const timeMax = new Date(now); timeMax.setMonth(timeMax.getMonth() + 12);

  // Pass 1: expanded instances to discover recurring series IDs + one-off events
  console.log('Pass 1: fetching instances...');
  const instances = await fetchAllInstances({
    singleEvents: 'true',
    orderBy: 'startTime',
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    maxResults: '500',
  });
  console.log(`  ${instances.length} instances`);

  const singleItems  = instances.filter(i => !i.recurringEventId && i.status !== 'cancelled');
  const recurringIds = [...new Set(instances.filter(i => i.recurringEventId).map(i => i.recurringEventId))];
  console.log(`  ${singleItems.length} single events, ${recurringIds.length} recurring series`);

  // Pass 2: fetch each master event to get the RRULE
  console.log('Pass 2: fetching master events...');
  const masters = await Promise.all(
    recurringIds.map(id =>
      calFetch(`/calendars/${encodeURIComponent(CALENDAR_ID)}/events/${id}`)
    )
  );

  const recurring = masters
    .map(item => {
      const { rrule, exdates } = parseRecurrence(item.recurrence);
      if (!rrule) return null;
      const { date: dtstart } = parseDateTime(item.originalStartTime ?? item.start);
      return {
        ...commonFields(item),
        dtstart,
        rrule,
        ...(exdates.length > 0 && { exdates }),
      };
    })
    .filter(Boolean);

  const single = singleItems
    .filter(i => i.start?.date || i.start?.dateTime)
    .map(item => ({ ...commonFields(item), date: parseDateTime(item.start).date }));

  const outPath = join(__dirname, '../src/data/events.json');
  writeFileSync(outPath, JSON.stringify({ recurring, single }, null, 2));
  console.log(`Saved ${recurring.length} recurring series + ${single.length} single events`);
}

fetchCalendar().catch(err => { console.error('Error:', err.message); process.exit(1); });
