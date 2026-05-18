# Gallery

Photos and videos are stored in the `white-rabbit-gallery` Cloudflare R2 bucket and served from its public URL (`pub-acd9a4df04b04e13a687ac0f697b36c5.r2.dev`).

## Caching strategy

`src/pages/gallery.astro` uses **stale-while-revalidate** backed by the `SESSION` KV namespace.

Two KV keys:

| Key | Value | TTL |
|---|---|---|
| `gallery:listing` | Full JSON listing of all items | None (permanent) |
| `gallery:listing:fresh` | `"1"` freshness marker | 1 hour |

**On each request:**

1. Read both keys in parallel
2. **Warm cache** (both keys present) → render instantly, no background work
3. **Stale cache** (listing present, freshness marker expired) → render instantly from stale data, refresh KV in the background via `ctx.waitUntil()` — user never waits
4. **Cold cache** (no listing at all) → fetch from R2 API synchronously (~10s), then write to KV in background

After the initial cold load, no user ever waits for the R2 API.

## Purge endpoint

`POST /api/gallery/purge` fetches a fresh listing from R2 and writes it to KV synchronously, so the very next gallery request is instant.

**Auth:** Bearer token matched against the `GALLERY_PURGE_SECRET` env var.

```bash
curl -X POST https://whiterabbitwcs.com/api/gallery/purge \
  -H "Authorization: Bearer $GALLERY_PURGE_SECRET"
```

Call this from the GitHub Actions workflow after uploading new photos (see issue #47).

## Required env vars

Set via `wrangler secret put`:

| Variable | Description |
|---|---|
| `WHITE_RABBIT_ACCOUNT_ID` | Cloudflare account ID |
| `WHITE_RABBIT_R2_API_TOKEN` | R2 API token with read access to `white-rabbit-gallery` |
| `GALLERY_PURGE_SECRET` | Secret token for the purge endpoint |
