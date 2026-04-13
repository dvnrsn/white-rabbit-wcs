# The White Rabbit Society

Arizona's West Coast Swing community site. Find events, meet local instructors and DJs, and follow the white rabbit.

**Live site**: [whiterabbitwcs.com](https://whiterabbitwcs.com)

---

## Features

### Event Calendar
- Google Calendar integration via public iCal feed
- Filter by event type (socials, workshops, competitions) and city
- Event cards with map links (Apple Maps on iOS, Google Maps otherwise)
- Refreshed daily via GitHub Actions; data stored in `src/data/events.json`

### Community
- Local instructor and venue directories, managed via Keystatic CMS
- WCS resources and links
- Gear guide for new dancers

### Music
- DJ profiles with Mixcloud/SoundCloud links
- Philosophy and approach copy, editable in CMS

### Posts / Blog
- Markdown posts in `src/content/posts/`, filename convention `YYYY-MM-DD-slug.md`
- Latest posts shown on homepage
- Non-technical contributors can add posts via the GitHub web UI — see `POSTS_GUIDE.md`

### SEO
- Comprehensive meta tags (Open Graph, Twitter Cards)
- Structured data (JSON-LD) for events and organization
- Automatic sitemap generation
- Local SEO for Phoenix, Tucson, Prescott, and beyond

### Design
- Matrix-inspired theme with CSS custom properties (`src/styles/themes.css`)
- Theme switcher component persists choice to `localStorage`
- Fully responsive, mobile-first

---

## Stack

- **Framework**: Astro 5 (static output, Cloudflare Workers adapter)
- **CMS**: Keystatic (Git-based, admin UI at `/keystatic`)
- **Deployment**: Cloudflare Workers (auto-deploys on push to `main`)
- **Package manager**: pnpm

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
KEYSTATIC_GITHUB_CLIENT_ID=...
KEYSTATIC_GITHUB_CLIENT_SECRET=...
KEYSTATIC_SECRET=...
PUBLIC_KEYSTATIC_GITHUB_APP_SLUG=...
```

## Content Management

Non-technical editors manage content at `/keystatic`. Requires a GitHub account with write access to this repo.

| Collection | Path | Description |
|---|---|---|
| Instructors | `src/content/instructors/` | Local instructor profiles |
| Venues | `src/content/venues/` | Dance venues |
| Resources | `src/content/resources/` | WCS resources and links |
| DJs | `src/content/djs/` | DJ profiles |
| Page copy | `src/content/pages/` | Hero images, community/music section text |

Pages fall back to placeholder content when CMS fields are empty — a partial entry will never break the build.

**Alt text**: Always fill in alt text when uploading images. Describe who/what/where in one sentence. Screen readers and search engines depend on it.

## Event Calendar

Events are pulled from Google Calendar and stored in `src/data/events.json`. A GitHub Actions workflow (`daily-rebuild.yml`) refreshes this daily at 6 AM UTC.

To refresh manually:
```bash
PUBLIC_GOOGLE_CALENDAR_ID=xxx node scripts/fetch-calendar.js
```

## Adding a City Filter Page

Edit `src/pages/[filter].astro` and add a new entry to `getStaticPaths()`.

## Deployment

Cloudflare Workers. Push to `main` triggers an automatic redeploy. Secrets are managed via `wrangler secret put` or the Cloudflare dashboard.
