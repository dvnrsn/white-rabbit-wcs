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
| `djs` | name, slug, bio, instagram, website, email |
| `artists` | name, slug, bio, instagram, website, email, points |
| `organizations` | name, slug, bio, website, instagram, email |
| `events` | title, organizer_id, venue_id, date, start/end_time, price, level, type, rrule, is_recurring |
| `event_djs` | event_id, dj_id |
| `event_teachers` | event_id, teacher_id |
| `artist_organizations` | artist_id, organization_id, role, points |

Recurring events store an RRULE string (e.g. `FREQ=WEEKLY;INTERVAL=2`). The `rrule` package expands them at read time.

---

## Status

### Done
- [x] D1 database created (`wcs-cms`, ID: `5bc90ba6-b149-432c-9b31-a41c0a8556d4`)
- [x] Drizzle schema (`src/lib/db/schema.ts`) — all 10 tables including djs, organizations, junction tables
- [x] Drizzle client (`src/lib/db/index.ts`)
- [x] `drizzle.config.ts`
- [x] Migrations generated: `0000_tranquil_morlocks.sql` (core tables), `0001_spotty_strong_guy.sql` (djs, organizations, junction tables)
- [x] REST API: `GET /api/events.json`, `/api/organizers.json`, `/api/venues.json`
- [x] Admin: login, dashboard, events list, new event form
- [x] Admin POST `api/admin/events` — inserts event, converts recurrence to RRULE

### Outstanding

#### High priority
- [ ] **Apply migrations to remote D1** — `wrangler d1 migrations apply wcs-cms --remote`
- [ ] **Edit/delete events** — admin has create only
- [ ] **Organizer CRUD** — list, new, edit pages under `/admin/organizers`
- [ ] **Venue CRUD** — list, new, edit pages under `/admin/venues`
- [ ] **DJ CRUD** — list, new, edit pages under `/admin/djs`

#### Medium priority
- [ ] **Teacher CRUD** — list, new, edit pages
- [ ] **Artist CRUD** — list, new, edit pages (include points field)
- [ ] **Organization CRUD** — list, new, edit pages
- [ ] **Import existing events** — migrate current `events.json` data into D1
- [ ] **Wire main events page to D1** — `src/pages/events.astro` still reads `events.json` (intentionally deferred)

#### Future / post-prototype
- [ ] **Per-user auth** — organizers log in with their own accounts, RLS so they only edit their own data
- [ ] **Multi-community** — `community_id` tenant column or separate D1 databases per community
- [ ] **Drop Google Calendar** — once D1 is the source of truth, retire `scripts/fetch-calendar.js` and the daily sync CI
- [ ] **Cloudflare Access** in front of `/admin` for production hardening

---

## Setup (first-time)

```bash
# Apply migrations to remote D1
wrangler d1 migrations apply wcs-cms --remote

# Local dev
echo "ADMIN_PASSWORD=yourpassword" >> .dev.vars
pnpm dev
```
