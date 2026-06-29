import type { APIContext } from "astro";

export const prerender = false;

export async function POST({ request }: APIContext) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return new Response(null, { status: 200 });
  }

  const { message, source, lineno, colno, stack, page } = body as {
    message?: string;
    source?: string;
    lineno?: number;
    colno?: number;
    stack?: string;
    page?: string;
  };

  console.error("[client-error]", JSON.stringify({ message, source, lineno, colno, stack, page }));

  return new Response(null, { status: 200 });
}
