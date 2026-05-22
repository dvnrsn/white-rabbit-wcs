import type { APIContext } from 'astro';
import { env as cfEnv } from 'cloudflare:workers';

export const prerender = false;

export async function POST({ request, locals }: APIContext) {
  const env = (locals as { runtime?: { env?: Record<string, string> } }).runtime?.env ?? {};
  const apiKey = env.COINBASE_COMMERCE_API_KEY;
  if (!apiKey) return new Response('Coinbase Commerce not configured', { status: 500 });

  const origin = request.headers.get('origin') ?? 'http://localhost:4321';
  const kv = (cfEnv as unknown as Env).SESSION;

  let body: {
    productId: string;
    variantId: number;
    variantName: string;
    price: string;
    productName: string;
    quantity?: number;
    shipping: {
      name: string;
      email: string;
      phone: string;
      address1: string;
      city: string;
      state: string;
      zip: string;
    };
  };

  try {
    body = await request.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const { productId, variantId, variantName, price, productName, quantity = 1, shipping } = body;
  if (!variantId || !price || !productName || !shipping?.name || !shipping?.address1) {
    return new Response('Missing required fields', { status: 400 });
  }

  const res = await fetch('https://api.commerce.coinbase.com/charges', {
    method: 'POST',
    headers: {
      'X-CC-Api-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: productName,
      description: variantName,
      pricing_type: 'fixed_price',
      local_price: {
        amount: (parseFloat(price) * quantity).toFixed(2),
        currency: 'USD',
      },
      metadata: {
        printify_product_id: String(productId ?? ''),
        printify_variant_id: String(variantId),
        quantity: String(quantity),
      },
      redirect_url: `${origin}/shop/success`,
      cancel_url: `${origin}/shop`,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('[coinbase-checkout] Charge creation failed:', err);
    return new Response('Charge creation failed', { status: 500 });
  }

  const { data } = await res.json() as { data: { code: string; hosted_url: string } };

  if (kv) {
    await kv.put(`coinbase_shipping:${data.code}`, JSON.stringify(shipping), { expirationTtl: 604800 });
  }

  return new Response(JSON.stringify({ url: data.hosted_url }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
