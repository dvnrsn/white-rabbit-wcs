export const prerender = false;

import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ params, locals }) => {
  const key = params.key;
  if (!key) return new Response("Not found", { status: 404 });

  const bucket = (locals as any).runtime?.env?.GALLERY_BUCKET as
    | { get: (key: string) => Promise<{ body: ReadableStream; httpMetadata?: { contentType?: string } } | null> }
    | undefined;

  if (!bucket) return new Response("Gallery unavailable", { status: 503 });

  const obj = await bucket.get(key);
  if (!obj) return new Response("Not found", { status: 404 });

  return new Response(obj.body, {
    headers: {
      "Content-Type": obj.httpMetadata?.contentType ?? "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
