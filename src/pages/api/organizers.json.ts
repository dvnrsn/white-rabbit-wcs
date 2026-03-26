import type { APIContext } from "astro";
import { getDb } from "../../lib/db";
import { organizers } from "../../lib/db/schema";
import { asc } from "drizzle-orm";

export const prerender = false;

export async function GET({ locals }: APIContext) {
  const env = locals.runtime?.env;

  if (!env?.DB) {
    return new Response(JSON.stringify({ error: "Database not available" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  const db = getDb(env);
  const results = await db.select().from(organizers).orderBy(asc(organizers.name));

  return new Response(JSON.stringify(results), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
