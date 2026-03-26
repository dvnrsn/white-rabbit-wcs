# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server at localhost:4321 (exposed on all interfaces via --host)
pnpm build        # Build production site to ./dist/
pnpm preview      # Preview production build locally
pnpm lint         # Lint with oxlint (TypeScript-aware)
pnpm format       # Format with oxfmt
```

To fetch/refresh calendar data from Google Calendar:
```bash
PUBLIC_GOOGLE_CALENDAR_ID=xxx node scripts/fetch-calendar.js
```

## Architecture

**White Rabbit WCS** is an Astro 5 static site for a Phoenix West Coast Swing dance community, deployed to Cloudflare Workers.

- **Static-first**: `output: "static"` in `astro.config.mjs`; pages can opt into SSR with `export const prerender = false`
- **Adapter**: `@astrojs/cloudflare` (config in `wrangler.jsonc`)
- **Package manager**: pnpm
- **TypeScript**: strict mode

### Event Calendar Pipeline

Events flow through a multi-step pipeline:

1. **Fetch**: `scripts/fetch-calendar.js` pulls the Google Calendar public iCal feed, parses it with `ical.js`, converts recurring events (max 2 future occurrences), and extracts structured metadata from event descriptions (venue, price, level, type, organizer, URLs)
2. **Store**: Output written to `src/data/events.json` (committed to repo; updated by a cron/CI job)
3. **Serve**: `src/lib/calendar.ts` reads `events.json` at build time and returns typed `CalendarEvent[]`
4. **Render**: `src/pages/events.astro` filters/sorts events and passes them to `EventCard.astro`
5. **Client-side**: filter state persisted to `localStorage`; map links use Apple Maps on iOS, Google Maps otherwise

The environment variable `PUBLIC_GOOGLE_CALENDAR_ID` is required to run the fetch script (set in `.dev.vars` locally, Cloudflare Workers vars in production).

### Dynamic Filter Routes

`src/pages/[filter].astro` generates static city-filtered event pages (e.g. `/phoenix`, `/tucson`) via `getStaticPaths()`. Adding a new city requires adding a new entry there.

### Content Posts

Markdown posts live in `src/content/posts/` and are managed via Astro Content Collections with Zod schema validation. Filename convention: `YYYY-MM-DD-slug.md`. Non-technical contributors add posts via the GitHub web UI (documented in `POSTS_GUIDE.md`).

### Key Files

| Path | Purpose |
|------|---------|
| `src/lib/calendar.ts` | Reads `events.json`, returns typed events |
| `src/lib/schema.ts` | JSON-LD structured data generators (Organization, Event, etc.) |
| `src/components/EventCard.astro` | Event display with map dialog |
| `src/components/SEO.astro` | Meta tags + JSON-LD injection for all pages |
| `src/layouts/Layout.astro` | Root layout wrapping all pages |
| `scripts/fetch-calendar.js` | iCal → JSON pipeline |
| `src/data/events.json` | Pre-generated event data (source of truth at build time) |

### CI / Automated Refresh

`.github/workflows/daily-rebuild.yml` runs daily (6 AM UTC) — fetches the calendar, commits `events.json` if changed, then Cloudflare redeploys. `.github/workflows/debug-calendar.yml` is manually triggered and uploads `calendar.ics` + `events.json` as artifacts for troubleshooting.

### Theming

CSS custom properties drive a Matrix-inspired design system defined in `src/styles/themes.css`. A `ThemeSwitcher` component persists theme choice to `localStorage`.
