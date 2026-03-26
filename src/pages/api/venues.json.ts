import type { APIContext } from "astro";

export const prerender = false;

export async function GET({ locals }: APIContext) {
  const db = locals.runtime?.env?.DB;

  if (!db) {
    return new Response(JSON.stringify({ error: "Database not available" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { results } = await db
    .prepare("SELECT * FROM venues ORDER BY name ASC")
    .all();

  return new Response(JSON.stringify(results), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
