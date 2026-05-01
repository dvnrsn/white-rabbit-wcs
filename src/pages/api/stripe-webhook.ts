import type { APIContext } from 'astro';
import Stripe from 'stripe';
import { createPrintifyOrder } from '../../lib/printful';

export const prerender = false;

export async function POST({ request, locals }: APIContext) {
  const env = (locals as { runtime?: { env?: Record<string, string> } }).runtime?.env ?? {};

  const stripeKey = env.STRIPE_SECRET_KEY;
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET;
  const printifyToken = env.PRINTIFY_API_TOKEN;
  const printifyShopId = env.PRINTIFY_SHOP_ID;

  if (!stripeKey || !webhookSecret || !printifyToken || !printifyShopId) {
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
  const productId = session.metadata?.printify_product_id ?? '';
  const variantId = Number(session.metadata?.printify_variant_id);
  const quantity = Number(session.metadata?.quantity ?? 1);

  if (!productId || !variantId) {
    console.error('[stripe-webhook] Missing printify metadata in session');
    return new Response('Missing variant', { status: 400 });
  }

  const shipping = session.shipping_details;
  if (!shipping?.address) {
    console.error('[stripe-webhook] No shipping address on session');
    return new Response('No shipping address', { status: 400 });
  }

  const nameParts = (shipping.name ?? session.customer_details?.name ?? 'Customer').split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(' ') || '-';

  await createPrintifyOrder(
    printifyToken,
    printifyShopId,
    {
      first_name: firstName,
      last_name: lastName,
      email: session.customer_details?.email ?? '',
      address1: shipping.address.line1 ?? '',
      city: shipping.address.city ?? '',
      region: shipping.address.state ?? '',
      country: shipping.address.country ?? 'US',
      zip: shipping.address.postal_code ?? '',
    },
    [{ productId, variantId, quantity }]
  );

  console.log(`[stripe-webhook] Printify order created for session ${session.id}`);
  return new Response('OK', { status: 200 });
}
