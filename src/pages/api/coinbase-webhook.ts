import type { APIContext } from 'astro';
import { env as cfEnv } from 'cloudflare:workers';
import { createPrintifyOrder } from '../../lib/printful';

export const prerender = false;

async function verifySignature(rawBody: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
  const computed = Array.from(new Uint8Array(sigBytes))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  if (computed.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < computed.length; i++) {
    diff |= computed.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return diff === 0;
}

type CoinbaseEvent = {
  id: string;
  type: string;
  data: {
    code: string;
    metadata?: {
      printify_product_id?: string;
      printify_variant_id?: string;
      quantity?: string;
    };
  };
};

type ShippingInfo = {
  name: string;
  email: string;
  phone: string;
  address1: string;
  city: string;
  state: string;
  zip: string;
};

export async function POST({ request, locals }: APIContext) {
  const env = (locals as { runtime?: { env?: Record<string, string> } }).runtime?.env ?? {};
  const webhookSecret = env.COINBASE_COMMERCE_WEBHOOK_SECRET;
  const printifyToken = env.PRINTIFY_API_TOKEN;
  const printifyShopId = env.PRINTIFY_SHOP_ID;
  const kv = (cfEnv as unknown as Env).SESSION;

  if (!webhookSecret || !printifyToken || !printifyShopId) {
    return new Response('Missing env vars', { status: 500 });
  }

  const sig = request.headers.get('x-cc-webhook-signature');
  if (!sig) return new Response('No signature', { status: 400 });

  const rawBody = await request.text();

  const valid = await verifySignature(rawBody, sig, webhookSecret);
  if (!valid) return new Response('Invalid signature', { status: 400 });

  let payload: { event: CoinbaseEvent };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const { event } = payload;

  if (event.type !== 'charge:confirmed') {
    return new Response('OK', { status: 200 });
  }

  const idempotencyKey = `coinbase_event:${event.id}`;
  if (kv) {
    const already = await kv.get(idempotencyKey);
    if (already) {
      console.log(`[coinbase-webhook] Duplicate event ${event.id}, skipping`);
      return new Response('OK', { status: 200 });
    }
  }

  const { code, metadata } = event.data;
  const productId = metadata?.printify_product_id ?? '';
  const variantId = Number(metadata?.printify_variant_id);
  const quantity = Number(metadata?.quantity ?? 1);

  if (!productId || !variantId) {
    console.error('[coinbase-webhook] Missing printify metadata');
    return new Response('Missing variant', { status: 400 });
  }

  const shippingRaw = kv ? await kv.get(`coinbase_shipping:${code}`) : null;
  if (!shippingRaw) {
    console.error('[coinbase-webhook] No shipping info for charge', code);
    return new Response('No shipping info', { status: 400 });
  }

  const shipping: ShippingInfo = JSON.parse(shippingRaw);
  const nameParts = shipping.name.trim().split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(' ') || '-';

  try {
    await createPrintifyOrder(
      printifyToken,
      printifyShopId,
      {
        first_name: firstName,
        last_name: lastName,
        email: shipping.email,
        phone: shipping.phone || '0000000000',
        address1: shipping.address1,
        city: shipping.city,
        region: shipping.state,
        country: 'US',
        zip: shipping.zip,
      },
      [{ productId, variantId, quantity, externalId: `coinbase:${code}` }]
    );
  } catch (err) {
    console.error('[coinbase-webhook] Printify order failed:', err);
    return new Response(`Printify error: ${err}`, { status: 500 });
  }

  if (kv) {
    await kv.put(idempotencyKey, code, { expirationTtl: 604800 });
  }

  console.log(`[coinbase-webhook] Printify order created for charge ${code}`);
  return new Response('OK', { status: 200 });
}
