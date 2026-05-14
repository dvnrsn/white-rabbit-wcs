# Gallery

Photos and videos are stored in the `white-rabbit-gallery` Cloudflare R2 bucket and served from its public URL (`pub-acd9a4df04b04e13a687ac0f697b36c5.r2.dev`).

## How the listing works

`src/pages/gallery.astro` is an SSR page. On each request:

1. Check the `SESSION` KV namespace for a cached listing under the key `gallery:listing`
2. **Cache hit** → deserialize and render immediately (instant)
3. **Cache miss** → paginate the Cloudflare R2 listing API, render, then write to KV in the background without blocking the response (TTL: 1 hour)

The cold-cache path (first request after the TTL expires) takes ~10s for a large bucket. Every subsequent request within the hour is instant.

## Forcing a cache refresh

After uploading new photos, do one of:

- Delete the `gallery:listing` key from the `SESSION` KV namespace in the Cloudflare dashboard
- Wait for the 1-hour TTL to expire

## Required env vars

Set via `wrangler secret put`:

| Variable | Description |
|---|---|
| `WHITE_RABBIT_ACCOUNT_ID` | Cloudflare account ID |
| `WHITE_RABBIT_R2_API_TOKEN` | R2 API token with read access to `white-rabbit-gallery` |
