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
PUBLIC_GOOGLE_CALENDAR_ID=xxx GOOGLE_CALENDAR_API_KEY=xxx node scripts/fetch-calendar.js
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

### CMS (Keystatic)

Non-technical editors manage content at `/keystatic`. Uses Git-based storage — edits create commits directly to the repo via GitHub OAuth.

- **Local dev**: uses `local` storage mode (reads/writes files directly)
- **Production**: uses `github` storage mode (commits via GitHub API); requires a GitHub App installed on the repo
- **Config**: `keystatic.config.ts` — uses `import.meta.env.PROD` to switch storage modes (not `process.env`, which is unavailable in the browser bundle)

Collections (stored as JSON in `src/content/`):

| Collection | Path | Fields |
|---|---|---|
| Instructors | `src/content/instructors/` | name, level, location, specialties, bio, photo, website, instagram |
| Venues | `src/content/venues/` | name, neighborhood, floor, notes, website, mapUrl |
| Resources | `src/content/resources/` | name, type, description, url |
| DJs | `src/content/djs/` | name, handle, realName, bio, style, resident, photo, mixcloud, soundcloud, instagram |

Singletons (stored as JSON in `src/content/pages/`):

| Singleton | File | Fields |
|---|---|---|
| Home page | `src/content/pages/home.json` | heroImages (image + alt array) |
| Community page | `src/content/pages/community.json` | instructorsIntro, venuesIntro, resourcesIntro, gearIntro, gearCards |
| Music page | `src/content/pages/music.json` | approachText, philosophyText, manifestoLine, manifestoSubline, playlistsIntro |

Pages read CMS data via `getCollection()` / `getEntry()` from `astro:content` and fall back to hardcoded dummy data when collections are empty — partial or missing entries never break the build.

Required env vars for production Keystatic (set via `wrangler secret put`):
- `KEYSTATIC_GITHUB_CLIENT_ID`
- `KEYSTATIC_GITHUB_CLIENT_SECRET`
- `KEYSTATIC_SECRET`
- `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG`

`wrangler.jsonc` must include a `SESSION` KV namespace binding for Keystatic's auth session handling.

### Content Posts

Markdown posts live in `src/content/posts/` and are managed via Astro Content Collections with Zod schema validation. Filename convention: `YYYY-MM-DD-slug.md`. Non-technical contributors add posts via the GitHub web UI (documented in `POSTS_GUIDE.md`).

### Shop (Printify + Stripe)

Product data is fetched from Printify and committed to `src/data/products.json`. The shop page is entirely static at build time; SSR only activates for `/api/checkout` and `/api/stripe-webhook`.

**Order flow:**
1. Customer selects product/variant → `/api/checkout` creates a Stripe Checkout session
2. Stripe redirects to hosted checkout; on success, fires a webhook to `/api/stripe-webhook`
3. Webhook calls `createPrintifyOrder` in `src/lib/printful.ts`, which creates a **draft** order in Printify
4. Draft sits in the Printify dashboard for manual review — hit "Send to production" there to fulfill

Orders are intentionally left as drafts (the `send_to_production` API call is omitted) so each order can be reviewed before Printify charges for fulfillment.

**Known data quirk — swapped color/size fields:** Printify variant titles use different orderings across product types (`"Color / Size"` for tees, `"Size / Color"` for tanks and hats). The fetch script always treats the last segment as size, which gets it wrong for some products. If `color`/`size` look swapped in `products.json` after a re-fetch, fix them directly in the JSON file — the affected products are tank tops and one-size hats (where sizes like `M`/`L` appear as the color field).

**Re-fetching product data:**
```bash
PRINTIFY_API_TOKEN=xxx PRINTIFY_SHOP_ID=xxx node scripts/fetch-products.js
```

| Path | Purpose |
|------|---------|
| `src/pages/shop.astro` | Shop UI — product grid, dialog, variant selectors |
| `src/pages/api/checkout.ts` | Creates Stripe Checkout session |
| `src/pages/api/stripe-webhook.ts` | Handles `checkout.session.completed`, creates Printify order |
| `src/lib/printful.ts` | `createPrintifyOrder` — Printify API wrapper (name is legacy) |
| `src/data/products.json` | Pre-fetched product catalog (committed; update via fetch script) |

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
| `keystatic.config.ts` | Keystatic CMS schema — collections and singletons |
| `src/content/pages/` | Singleton CMS data (home, community, music page copy) |

### CI / Automated Refresh

`.github/workflows/daily-rebuild.yml` runs daily (6 AM UTC) — fetches the calendar, commits `events.json` if changed, then Cloudflare redeploys. `.github/workflows/debug-calendar.yml` is manually triggered and uploads `calendar.ics` + `events.json` as artifacts for troubleshooting.

### Theming

CSS custom properties drive a Matrix-inspired design system defined in `src/styles/themes.css`. A `ThemeSwitcher` component persists theme choice to `localStorage`.
