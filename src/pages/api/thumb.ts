import type { APIContext } from "astro";

const PUBLIC_BUCKET_URL = "https://pub-acd9a4df04b04e13a687ac0f697b36c5.r2.dev";

export const prerender = false;

export async function GET({ request }: APIContext) {
  const key = new URL(request.url).searchParams.get("key");
  if (!key || key.includes("..")) return new Response(null, { status: 400 });

  const origin = `${PUBLIC_BUCKET_URL}/${key.split("/").map(encodeURIComponent).join("/")}`;

  const response = await fetch(origin, {
    cf: { image: { width: 400, quality: 70, format: "webp" } },
  } as RequestInit);

  if (!response.ok) return new Response(null, { status: response.status });

  return new Response(response.body, {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
