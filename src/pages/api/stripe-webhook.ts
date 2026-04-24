import type { APIContext } from 'astro';
import Stripe from 'stripe';
import { createPrintfulOrder } from '../../lib/printful';

export const prerender = false;

export async function POST({ request, locals }: APIContext) {
  const env = (locals as { runtime?: { env?: Record<string, string> } }).runtime?.env ?? {};

  const stripeKey = env.STRIPE_SECRET_KEY;
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET;
  const printfulKey = env.PRINTFUL_API_KEY;

  if (!stripeKey || !webhookSecret || !printfulKey) {
    return new Response('Missing env vars', { status: 500 });
  }

  const sig = request.headers.get('stripe-signature');
  if (!sig) return new Response('No signature', { status: 400 });

  const rawBody = await request.text();
  const stripe = new Stripe(stripeKey);

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, sig, webhookSecret);
  } catch (err) {
    return new Response(`Webhook signature failed: ${err}`, { status: 400 });
  }

  if (event.type !== 'checkout.session.completed') {
    return new Response('OK', { status: 200 });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const variantId = Number(session.metadata?.printful_variant_id);
  const quantity = Number(session.metadata?.quantity ?? 1);

  if (!variantId) {
    console.error('[stripe-webhook] Missing printful_variant_id in session metadata');
    return new Response('Missing variant', { status: 400 });
  }

  const shipping = session.shipping_details;
  if (!shipping?.address) {
    console.error('[stripe-webhook] No shipping address on session');
    return new Response('No shipping address', { status: 400 });
  }

  await createPrintfulOrder(
    printfulKey,
    {
      name: shipping.name ?? session.customer_details?.name ?? 'Customer',
      email: session.customer_details?.email ?? '',
      address1: shipping.address.line1 ?? '',
      city: shipping.address.city ?? '',
      state_code: shipping.address.state ?? '',
      country_code: shipping.address.country ?? 'US',
      zip: shipping.address.postal_code ?? '',
    },
    [{ variantId, quantity }]
  );

  console.log(`[stripe-webhook] Printful order created for session ${session.id}`);
  return new Response('OK', { status: 200 });
}
