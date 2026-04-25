// Fetches Google Calendar data via the Calendar API v3 and saves as JSON.
// Run with: PUBLIC_GOOGLE_CALENDAR_ID=xxx GOOGLE_CALENDAR_API_KEY=xxx node scripts/fetch-calendar.js

import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { Temporal } from '@js-temporal/polyfill';

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
  const zdt = Temporal.Instant.from(dt.dateTime).toZonedDateTimeISO(TZ);
  return {
    date: zdt.toPlainDate().toString(),
    time: zdt.toPlainTime().toString().slice(0, 5),
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

async function fetchAll(params) {
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

  // singleEvents omitted (defaults to false) — returns master recurring events directly
  console.log('Fetching events...');
  const items = await fetchAll({
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    maxResults: '500',
  });
  console.log(`  ${items.length} items`);

  const recurring = items
    .filter(i => i.recurrence && i.status !== 'cancelled')
    .map(item => {
      const { rrule, exdates } = parseRecurrence(item.recurrence);
      if (!rrule) return null;
      const { date: dtstart } = parseDateTime(item.start);
      return {
        ...commonFields(item),
        dtstart,
        rrule,
        ...(exdates.length > 0 && { exdates }),
      };
    })
    .filter(Boolean);

  // Single events + exception instances (modified occurrences of a recurring series)
  const single = items
    .filter(i => !i.recurrence && i.status !== 'cancelled' && (i.start?.date || i.start?.dateTime))
    .map(item => ({ ...commonFields(item), date: parseDateTime(item.start).date }));

  const outPath = join(__dirname, '../src/data/events.json');
  writeFileSync(outPath, JSON.stringify({ recurring, single }, null, 2));
  console.log(`Saved ${recurring.length} recurring series + ${single.length} single events`);
}

fetchCalendar().catch(err => { console.error('Error:', err.message); process.exit(1); });
