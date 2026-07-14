import type { APIContext } from 'astro';
import Stripe from 'stripe';
import productsData from '../../data/products.json';
import { verifyTurnstile } from '../../lib/turnstile';

type Variant = { id: number; name: string; price: string };
type Product = { id: string; name: string; variants: Variant[] };

export const prerender = false;

// Falls back to the deployed site's canonical origin rather than trusting
// the client-supplied Origin header, which is trivially spoofable (e.g.
// via curl) and would otherwise let an attacker redirect a paying customer
// to an arbitrary domain after a real Stripe payment completes.
const SITE_ORIGIN = import.meta.env.DEV ? 'http://localhost:4321' : import.meta.env.SITE;

export async function POST({ request, locals }: APIContext) {
  const env = (locals as { runtime?: { env?: Record<string, string> } }).runtime?.env ?? {};

  const stripeKey = env.STRIPE_SECRET_KEY;
  if (!stripeKey) return new Response('Stripe not configured', { status: 500 });

  let body: { productId: string; variantId: number; quantity?: number; turnstileToken?: string };
  try {
    body = await request.json();
  } catch {
    console.error('[checkout] Invalid JSON body');
    return new Response('Invalid JSON', { status: 400 });
  }

  const { productId, variantId, quantity = 1, turnstileToken } = body;
  if (!productId || !variantId) {
    console.error('[checkout] Missing productId/variantId in request body');
    return new Response('Missing required fields', { status: 400 });
  }

  const turnstileSecret = env.TURNSTILE_SECRET_KEY;
  if (turnstileSecret) {
    const { success, codes } = await verifyTurnstile(turnstileToken ?? '', turnstileSecret);
    if (!success) {
      console.error(`[checkout] Turnstile verification failed: ${codes.join(', ')}`);
      return new Response('Verification failed. Please try again.', { status: 400 });
    }
  }

  // Printify variant ids are scoped to the underlying blank (e.g. a Bella
  // Canvas blueprint), not to a specific design — the same variant id is
  // reused across every product built on that blank. Resolving by variant
  // id alone can silently match the wrong product, so productId must be
  // used to pin down which product first.
  const products = productsData as Product[];
  const product = products.find(p => p.id === productId);
  const variant = product?.variants.find(v => v.id === variantId);
  if (!product || !variant) {
    console.error(`[checkout] Unknown productId=${productId} variantId=${variantId} (not found in products.json)`);
    return new Response('Unknown product/variant', { status: 400 });
  }

  const stripe = new Stripe(stripeKey);

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create({
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
      success_url: `${SITE_ORIGIN}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_ORIGIN}/shop`,
    });
  } catch (err) {
    console.error(`[checkout] Stripe session creation failed for productId=${product.id} variantId=${variantId}:`, err);
    return new Response('Something went wrong. Please try again.', { status: 500 });
  }

  console.log(`[checkout] Created session ${session.id} for productId=${product.id} variantId=${variantId} quantity=${quantity}`);

  return new Response(JSON.stringify({ url: session.url }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
