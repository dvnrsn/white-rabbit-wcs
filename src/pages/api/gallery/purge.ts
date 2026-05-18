export const prerender = false;

import type { APIRoute } from "astro";
import { env as cfEnv } from "cloudflare:workers";

const KV_KEY       = "gallery:listing";
const KV_FRESH_KEY = "gallery:listing:fresh";
const KV_FRESH_TTL = 3600;
const BUCKET_NAME  = "white-rabbit-gallery";
const PUBLIC_BUCKET_URL = "https://pub-acd9a4df04b04e13a687ac0f697b36c5.r2.dev";
const VIDEO_EXTS = /\.(mp4|mov|webm)$/i;
const IMAGE_EXTS = /\.(jpg|jpeg|png|gif|webp|avif)$/i;

export const POST: APIRoute = async ({ request }) => {
  const e = cfEnv as any;
  const secret     = e.GALLERY_PURGE_SECRET as string | undefined;
  const accountId  = e.WHITE_RABBIT_ACCOUNT_ID as string | undefined;
  const apiToken   = e.WHITE_RABBIT_R2_API_TOKEN as string | undefined;
  const kv         = e.SESSION as { put: (k: string, v: string, o?: any) => Promise<void> } | undefined;

  // Auth — timing-safe comparison to prevent token oracle via response time
  const token = (request.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const enc = new TextEncoder();
  const secretBytes = enc.encode(secret ?? "");
  const tokenBytes  = enc.encode(token);
  const valid = secret &&
    secretBytes.byteLength === tokenBytes.byteLength &&
    crypto.subtle.timingSafeEqual(secretBytes, tokenBytes);
  if (!valid) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  if (!accountId || !apiToken || !kv) {
    return new Response(JSON.stringify({ error: "Missing configuration" }), { status: 503 });
  }

  // Fetch fresh listing from R2
  const fetched: { key: string; url: string; name: string; album: string | null; isVideo: boolean; uploaded: string }[] = [];
  let cursor: string | undefined;
  do {
    const url = new URL(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${BUCKET_NAME}/objects`
    );
    if (cursor) url.searchParams.set("cursor", cursor);
    url.searchParams.set("per_page", "1000");

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${apiToken}` },
    });
    if (!res.ok) {
      return new Response(JSON.stringify({ error: `R2 API error: ${res.status}` }), { status: 502 });
    }
    const data = await res.json() as {
      result: { key: string; last_modified: string }[];
      result_info: { cursor: string; is_truncated: boolean };
    };

    for (const obj of data.result) {
      if (!IMAGE_EXTS.test(obj.key) && !VIDEO_EXTS.test(obj.key)) continue;
      const segments = obj.key.split("/");
      const album = segments.length > 1 ? segments.slice(0, -1).join("/") : null;
      fetched.push({
        key: obj.key,
        url: `${PUBLIC_BUCKET_URL}/${obj.key.split("/").map(encodeURIComponent).join("/")}`,
        name: segments[segments.length - 1],
        album,
        isVideo: VIDEO_EXTS.test(obj.key),
        uploaded: obj.last_modified,
      });
    }
    cursor = data.result_info?.is_truncated ? data.result_info.cursor : undefined;
  } while (cursor);

  fetched.sort((a, b) => new Date(b.uploaded).getTime() - new Date(a.uploaded).getTime());

  // Write to KV — next gallery request will be instant
  await kv.put(KV_KEY, JSON.stringify(fetched));
  await kv.put(KV_FRESH_KEY, "1", { expirationTtl: KV_FRESH_TTL });

  return new Response(JSON.stringify({ ok: true, count: fetched.length }), { status: 200 });
};
