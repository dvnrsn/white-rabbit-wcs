import type { APIContext } from 'astro';
import Stripe from 'stripe';

export const prerender = false;

export async function POST({ request, locals }: APIContext) {
  const env = (locals as { runtime?: { env?: Record<string, string> } }).runtime?.env ?? {};

  const stripeKey = env.STRIPE_SECRET_KEY;
  if (!stripeKey) return new Response('Stripe not configured', { status: 500 });

  const origin = request.headers.get('origin') ?? 'http://localhost:4321';

  let body: { variantId: number; variantName: string; price: string; productName: string; quantity?: number };
  try {
    body = await request.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const { variantId, variantName, price, productName, quantity = 1 } = body;
  if (!variantId || !price || !productName) {
    return new Response('Missing required fields', { status: 400 });
  }

  const stripe = new Stripe(stripeKey);

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        quantity,
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(parseFloat(price) * 100),
          product_data: {
            name: productName,
            description: variantName,
          },
        },
      },
    ],
    shipping_address_collection: {
      allowed_countries: ['US'],
    },
    metadata: {
      printful_variant_id: String(variantId),
      quantity: String(quantity),
    },
    success_url: `${origin}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/shop`,
  });

  return new Response(JSON.stringify({ url: session.url }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
