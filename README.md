# The White Rabbit Society

The White Rabbit Society is the hub for West Coast Swing dancing in Arizona — connecting dancers to local events, instructors, venues, DJs, and community resources across Phoenix, Tucson, Prescott, and beyond.

This repo is the source for [whiterabbitwcs.com](https://whiterabbitwcs.com): an Astro 5 static site deployed on Cloudflare Workers, with a Git-backed CMS, Google Calendar integration, and a Printful-connected merch shop.

---

## Stack

| Layer | Tech |
|---|---|
| Framework | Astro 5 (static output + Cloudflare Workers adapter) |
| Deployment | Cloudflare Workers — auto-deploys on push to `main` |
| CMS | Keystatic (Git-based, admin UI at `/keystatic`) |
| Merch | Printful API → `src/data/products.json` → Stripe checkout |
| Calendar | Google Calendar iCal → daily GitHub Actions rebuild |
| Package manager | pnpm |

---

## Features

**Event Calendar** — Google Calendar integration with daily refresh via GitHub Actions. Filter by event type and city. Event cards link to Apple Maps (iOS) or Google Maps. Recurring events expanded up to 2 future occurrences. Data stored in `src/data/events.json` and committed to the repo so builds are never blocked by API availability.

**Shop** — Printful product catalog with variant selection (size/color), front/back T-shirt image preview, and Stripe checkout. Product data fetched via `scripts/fetch-products.js` and committed to `src/data/products.json`.

**Community** — Instructor and venue directories, a WCS resource list, and a gear guide — all managed through Keystatic.

**Music** — DJ profiles with Mixcloud/SoundCloud links, plus CMS-editable philosophy copy and playlists.

**Posts** — Markdown posts in `src/content/posts/` (`YYYY-MM-DD-slug.md`). Non-technical contributors can add posts via the GitHub web UI — see `POSTS_GUIDE.md`.

**SEO** — Open Graph, Twitter Cards, JSON-LD structured data for events and organization, automatic sitemap, local SEO for Phoenix, Tucson, Prescott, and Scottsdale.

**Theming** — Matrix-inspired design system via CSS custom properties (`src/styles/themes.css`). Theme switcher persists to `localStorage`.

---

## Development

```bash
pnpm install
pnpm dev        # http://localhost:4321
pnpm build
pnpm preview
pnpm lint
pnpm format
```

Local environment variables go in `.dev.vars` (gitignored):

```
PUBLIC_GOOGLE_CALENDAR_ID=...
GOOGLE_CALENDAR_API_KEY=...
KEYSTATIC_GITHUB_CLIENT_ID=...
KEYSTATIC_GITHUB_CLIENT_SECRET=...
KEYSTATIC_SECRET=...
PUBLIC_KEYSTATIC_GITHUB_APP_SLUG=...
PRINTFUL_API_KEY=...
PRINTFUL_STORE_ID=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
PUBLIC_STRIPE_PUBLISHABLE_KEY=...
```

---

## Content Management

Non-technical editors manage content at `/keystatic`. Requires a GitHub account with write access to this repo. Edits commit directly to the repo via GitHub OAuth.

| Collection | Path | Description |
|---|---|---|
| Instructors | `src/content/instructors/` | Local instructor profiles |
| Venues | `src/content/venues/` | Dance venues |
| Resources | `src/content/resources/` | WCS links and resources |
| DJs | `src/content/djs/` | DJ profiles |
| Page copy | `src/content/pages/` | Hero images, community/music section text |

Pages fall back to placeholder content when CMS fields are empty — a partial entry never breaks the build.

---

## Event Calendar Pipeline

1. `scripts/fetch-calendar.js` pulls the Google Calendar iCal feed, parses it with `ical.js`, expands recurring events, and extracts structured metadata from event descriptions (venue, price, level, type, organizer, URLs)
2. Output written to `src/data/events.json` and committed
3. `src/lib/calendar.ts` reads the JSON at build time
4. `src/pages/events.astro` renders and filters events client-side

To refresh manually:
```bash
PUBLIC_GOOGLE_CALENDAR_ID=xxx GOOGLE_CALENDAR_API_KEY=xxx node scripts/fetch-calendar.js
```

GitHub Actions (`daily-rebuild.yml`) runs this daily at 6 AM UTC and redeploys if data changed.

---

## Merch Pipeline

1. `scripts/fetch-products.js` pulls the Printful store catalog (variants, prices, front/back mockup URLs)
2. Output written to `src/data/products.json` and committed
3. Shop page reads the JSON at build time; checkout hits `/api/checkout` → Stripe

To refresh manually:
```bash
PRINTFUL_API_KEY=xxx PRINTFUL_STORE_ID=xxx node scripts/fetch-products.js
```

---

## Adding a City Filter Page

Add a new entry to `getStaticPaths()` in `src/pages/[filter].astro`.

---

## Deployment

Push to `main` → Cloudflare auto-redeploys. Secrets are managed via `wrangler secret put` or the Cloudflare dashboard.
