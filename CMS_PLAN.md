# WCS CMS Plan

Replacing the Google Calendar + iCal pipeline with a Cloudflare D1 database and a lightweight admin UI built into this site.

## Stack

- **Database**: Cloudflare D1 (SQLite at the edge), binding `DB`
- **ORM**: Drizzle ORM (`drizzle-orm/d1`)
- **Admin UI**: Astro SSR pages under `/admin` (password-protected via `ADMIN_PASSWORD` env var)
- **API**: Astro API routes under `/api` returning JSON
- **Auth**: Single `ADMIN_PASSWORD` for now; Cloudflare Access in front of `/admin` for production

---

## Entities

| Table | Key Fields |
|-------|-----------|
| `organizers` | name, slug, bio, instagram, website, email |
| `venues` | name, slug, address, city, state, maps_url |
| `teachers` | name, slug, bio, instagram, website, email |
| `artists` | name, slug, bio, instagram, website, email, points |
| `events` | title, organizer_id, venue_id, date, start/end_time, price, level, type, rrule, is_recurring |

Recurring events store an RRULE string (e.g. `FREQ=WEEKLY;INTERVAL=2`). The `rrule` package expands them at read time.

---

## Status

### Done
- [x] D1 schema (`migrations/001_initial.sql`)
- [x] Drizzle schema (`src/lib/db/schema.ts`) + client (`src/lib/db/index.ts`)
- [x] `drizzle.config.ts`
- [x] REST API: `GET /api/events.json`, `/api/organizers.json`, `/api/venues.json`
- [x] Admin: login, dashboard, events list, new event form
- [x] Admin POST `api/admin/events` — inserts event, converts recurrence to RRULE

### Outstanding

#### High priority
- [ ] **Wire main events page to D1** — `src/pages/events.astro` still reads `events.json`; add a D1 path alongside the JSON fallback
- [ ] **Edit/delete events** — admin has create only
- [ ] **Organizer CRUD** — list, new, edit pages under `/admin/organizers`
- [ ] **Venue CRUD** — list, new, edit pages under `/admin/venues`
- [ ] **Real D1 setup** — run `wrangler d1 create wcs-cms`, paste real `database_id` into `wrangler.jsonc`

#### Medium priority
- [ ] **Teacher CRUD** — list, new, edit pages
- [ ] **Artist CRUD** — list, new, edit pages (include points field)
- [ ] **Import existing events** — migrate current `events.json` data into D1
- [ ] **drizzle-kit migrations** — run `drizzle-kit generate` to produce proper versioned migrations from schema

#### Future / post-prototype
- [ ] **Per-user auth** — organizers log in with their own accounts, RLS so they only edit their own data
- [ ] **Multi-community** — `community_id` tenant column or separate D1 databases per community
- [ ] **Drop Google Calendar** — once D1 is the source of truth, retire `scripts/fetch-calendar.js` and the daily sync CI
- [ ] **Cloudflare Access** in front of `/admin` for production hardening

---

## Setup (first-time)

```bash
# Create the D1 database
wrangler d1 create wcs-cms
# Paste the returned database_id into wrangler.jsonc

# Apply schema
wrangler d1 execute wcs-cms --file=migrations/001_initial.sql

# Local dev
echo "ADMIN_PASSWORD=yourpassword" >> .dev.vars
pnpm dev
```
