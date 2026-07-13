import type { APIContext } from 'astro';
import Stripe from 'stripe';
import productsData from '../../data/products.json';

type Variant = { id: number; name: string; price: string };
type Product = { id: string; name: string; variants: Variant[] };

export const prerender = false;

export async function POST({ request, locals }: APIContext) {
  const env = (locals as { runtime?: { env?: Record<string, string> } }).runtime?.env ?? {};

  const stripeKey = env.STRIPE_SECRET_KEY;
  if (!stripeKey) return new Response('Stripe not configured', { status: 500 });

  const origin = request.headers.get('origin') ?? 'http://localhost:4321';

  let body: { productId: string; variantId: number; quantity?: number };
  try {
    body = await request.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const { productId, variantId, quantity = 1 } = body;
  if (!productId || !variantId) return new Response('Missing required fields', { status: 400 });

  // Printify variant ids are scoped to the underlying blank (e.g. a Bella
  // Canvas blueprint), not to a specific design — the same variant id is
  // reused across every product built on that blank. Resolving by variant
  // id alone can silently match the wrong product, so productId must be
  // used to pin down which product first.
  const products = productsData as Product[];
  const product = products.find(p => p.id === productId);
  const variant = product?.variants.find(v => v.id === variantId);
  if (!product || !variant) return new Response('Unknown product/variant', { status: 400 });

  const stripe = new Stripe(stripeKey);

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        quantity,
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(parseFloat(variant.price) * 100),
          product_data: {
            name: product.name,
            description: variant.name,
          },
        },
      },
    ],
    shipping_address_collection: {
      allowed_countries: ['US'],
    },
    phone_number_collection: {
      enabled: true,
    },
    metadata: {
      printify_product_id: product.id,
      printify_variant_id: String(variantId),
      quantity: String(quantity),
    },
    success_url: `${origin}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/shop`,
  });

  return new Response(JSON.stringify({ url: session.url }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
