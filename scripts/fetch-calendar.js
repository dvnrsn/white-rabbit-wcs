// Fetches Google Calendar data and saves as JSON
// Run with: PUBLIC_GOOGLE_CALENDAR_ID=xxx node scripts/fetch-calendar.js

import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const CALENDAR_ID = process.env.PUBLIC_GOOGLE_CALENDAR_ID;

if (!CALENDAR_ID) {
  console.error('PUBLIC_GOOGLE_CALENDAR_ID not set');
  process.exit(1);
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

  // We'll parse this with ical.js - but since this is a simple Node script,
  // let's just save the raw iCal and let the build process parse it
  const outputPath = join(__dirname, '../src/data/calendar.ics');
  writeFileSync(outputPath, icalData);
  console.log(`Saved to ${outputPath}`);
}

fetchCalendar().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
