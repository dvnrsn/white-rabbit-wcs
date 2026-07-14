import type { APIContext } from 'astro';
import Stripe from 'stripe';
import { env as cfEnv } from 'cloudflare:workers';
import { createPrintifyOrder } from '../../lib/printful';
import { sendEmail, sendResendEmail } from '../../lib/email';
import { render } from '@react-email/render';
import { OrderConfirmationEmail } from '../../emails/OrderConfirmation';
import productsData from '../../data/products.json';

export const prerender = false;

const ORDER_FROM_ADDR = 'orders@whiterabbitwcs.com';
const ORDER_FROM_NAME = 'White Rabbit WCS';
const MERCHANT_TO = 'whiterabbitwcs@gmail.com';

// Every log line is prefixed with this and the Stripe event id so a single
// order can be grepped out of Cloudflare's aggregate Worker logs.
function log(eventId: string | undefined, msg: string) {
  console.log(`[stripe-webhook]${eventId ? ` [${eventId}]` : ''} ${msg}`);
}
function logError(eventId: string | undefined, msg: string, err?: unknown) {
  console.error(`[stripe-webhook]${eventId ? ` [${eventId}]` : ''} ${msg}`, err ?? '');
}

// Stripe's dashboard search accepts any object id directly; this is the
// fastest way to hand off from a notification email to the actual object.
function stripeDashboardLink(stripeKey: string, id: string): string {
  const base = stripeKey.startsWith('sk_test_')
    ? 'https://dashboard.stripe.com/test/search?query='
    : 'https://dashboard.stripe.com/search?query=';
  return `${base}${encodeURIComponent(id)}`;
}

// Disputes are time-sensitive: Stripe auto-loses them if you don't submit
// evidence by the deadline, and they cost a fee regardless of outcome.
// Merchant-only, like the refund email -- the customer already knows they
// filed a dispute with their bank.
async function handleChargeDisputeCreated(
  event: Stripe.Event,
  kv: Env['SESSION'] | undefined,
  merchantEmailBinding: { send: (msg: unknown) => Promise<void> } | undefined,
  stripeKey: string
): Promise<void> {
  const idempotencyKey = `stripe_event:${event.id}`;
  if (kv) {
    const already = await kv.get(idempotencyKey);
    if (already) {
      log(event.id, `Duplicate dispute event, skipping`);
      return;
    }
  } else {
    logError(event.id, 'SESSION KV binding unavailable — idempotency check skipped, duplicate dispute emails are possible');
  }

  const dispute = event.data.object as Stripe.Dispute;
  const amount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: dispute.currency.toUpperCase(),
  }).format(dispute.amount / 100);
  const dueBy = dispute.evidence_details?.due_by
    ? new Date(dispute.evidence_details.due_by * 1000).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'unknown -- check the dashboard';
  const chargeId = typeof dispute.charge === 'string' ? dispute.charge : dispute.charge?.id;

  try {
    await sendEmail(merchantEmailBinding, {
      fromAddr: ORDER_FROM_ADDR,
      fromName: ORDER_FROM_NAME,
      to: MERCHANT_TO,
      subject: `Dispute filed: ${amount} (respond by ${dueBy})`,
      text: [
        `A customer has disputed a charge for ${amount}.`,
        ``,
        `Reason: ${dispute.reason}`,
        `Status: ${dispute.status}`,
        `Respond by: ${dueBy}`,
        ``,
        `This needs a response in the Stripe dashboard before the deadline, or you automatically lose the dispute.`,
        ``,
        `Dispute: ${stripeDashboardLink(stripeKey, dispute.id)}`,
        chargeId ? `Charge: ${stripeDashboardLink(stripeKey, chargeId)}` : '',
      ].filter(Boolean).join('\n'),
    });
    log(event.id, `Dispute notification sent for dispute ${dispute.id}`);
  } catch (err) {
    logError(event.id, `Dispute notification failed for dispute ${dispute.id}`, err);
  }

  if (kv) {
    await kv.put(idempotencyKey, dispute.id, { expirationTtl: 604800 });
  }
}

// Refunds are always initiated by the merchant (via Stripe dashboard or
// API), so there's no equivalent "merchant notification" here -- whoever
// issued the refund already knows. This only tells the customer.
async function handleChargeRefunded(
  event: Stripe.Event,
  kv: Env['SESSION'] | undefined,
  resendApiKey: string | undefined
): Promise<void> {
  const idempotencyKey = `stripe_event:${event.id}`;
  if (kv) {
    const already = await kv.get(idempotencyKey);
    if (already) {
      log(event.id, `Duplicate refund event, skipping`);
      return;
    }
  } else {
    logError(event.id, 'SESSION KV binding unavailable — idempotency check skipped, duplicate refund emails are possible');
  }

  const charge = event.data.object as Stripe.Charge;
  const email = charge.receipt_email ?? charge.billing_details?.email ?? '';

  if (email) {
    const isFullRefund = charge.amount_refunded >= charge.amount;
    const amountRefunded = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: charge.currency.toUpperCase(),
    }).format(charge.amount_refunded / 100);
    const firstName = (charge.billing_details?.name ?? 'there').split(' ')[0];

    try {
      await sendResendEmail(resendApiKey, {
        fromAddr: ORDER_FROM_ADDR,
        fromName: ORDER_FROM_NAME,
        to: email,
        subject: isFullRefund ? 'Your White Rabbit order has been refunded' : 'A refund has been issued for your White Rabbit order',
        text: [
          `Hi ${firstName},`,
          ``,
          isFullRefund
            ? `Your order has been fully refunded. ${amountRefunded} is on its way back to your original payment method.`
            : `A partial refund of ${amountRefunded} has been issued back to your original payment method.`,
          ``,
          `It can take 5-10 business days to show up on your statement, depending on your bank.`,
          ``,
          `Questions? Just reply to this email.`,
        ].join('\n'),
      });
      log(event.id, `Refund confirmation email sent to ${email}`);
    } catch (err) {
      logError(event.id, `Refund confirmation email failed for charge ${charge.id}`, err);
    }
  } else {
    logError(event.id, `No email on charge ${charge.id} — refund confirmation skipped`);
  }

  if (kv) {
    await kv.put(idempotencyKey, charge.id, { expirationTtl: 604800 });
  }
}

export async function POST({ request, locals }: APIContext) {
  const env = (locals as { runtime?: { env?: Record<string, string> } }).runtime?.env ?? {};

  const stripeKey = env.STRIPE_SECRET_KEY;
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET;
  const printifyToken = env.PRINTIFY_API_TOKEN;
  const printifyShopId = env.PRINTIFY_SHOP_ID;
  const kv = (cfEnv as unknown as Env).SESSION;
  const resendApiKey = env.RESEND_API_KEY;
  const merchantEmailBinding = (cfEnv as any).SEND_EMAIL as { send: (msg: unknown) => Promise<void> } | undefined;

  if (!stripeKey || !webhookSecret || !printifyToken || !printifyShopId) {
    logError(undefined, `Missing env vars: ${[
      !stripeKey && 'STRIPE_SECRET_KEY',
      !webhookSecret && 'STRIPE_WEBHOOK_SECRET',
      !printifyToken && 'PRINTIFY_API_TOKEN',
      !printifyShopId && 'PRINTIFY_SHOP_ID',
    ].filter(Boolean).join(', ')}`);
    return new Response('Missing env vars', { status: 500 });
  }

  const sig = request.headers.get('stripe-signature');
  if (!sig) {
    logError(undefined, 'Request had no stripe-signature header');
    return new Response('No signature', { status: 400 });
  }

  const rawBody = await request.text();
  const stripe = new Stripe(stripeKey);

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, sig, webhookSecret);
  } catch (err) {
    logError(undefined, 'Signature verification failed', err);
    return new Response('Invalid request', { status: 400 });
  }

  log(event.id, `Received event type=${event.type}`);

  if (event.type === 'charge.dispute.created') {
    await handleChargeDisputeCreated(event, kv, merchantEmailBinding, stripeKey);
    return new Response('OK', { status: 200 });
  }

  if (event.type === 'charge.refunded') {
    await handleChargeRefunded(event, kv, resendApiKey);
    return new Response('OK', { status: 200 });
  }

  if (event.type !== 'checkout.session.completed') {
    return new Response('OK', { status: 200 });
  }

  // Idempotency: skip if we've already processed this Stripe event
  const idempotencyKey = `stripe_event:${event.id}`;
  if (kv) {
    const already = await kv.get(idempotencyKey);
    if (already) {
      log(event.id, `Duplicate event, already processed as session ${already}, skipping`);
      return new Response('OK', { status: 200 });
    }
  } else {
    logError(event.id, 'SESSION KV binding unavailable — idempotency check skipped, duplicate orders are possible');
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const productId = session.metadata?.printify_product_id ?? '';
  const variantId = Number(session.metadata?.printify_variant_id);
  const quantity = Number(session.metadata?.quantity ?? 1);

  log(event.id, `session=${session.id} productId=${productId} variantId=${variantId} quantity=${quantity}`);

  if (!productId || !variantId) {
    logError(event.id, `Missing printify metadata on session ${session.id}: ${JSON.stringify(session.metadata)}`);
    return new Response('Missing variant', { status: 400 });
  }

  const shipping = session.collected_information?.shipping_details;
  if (!shipping?.address) {
    logError(event.id, `No shipping address on session ${session.id}`);
    return new Response('No shipping address', { status: 400 });
  }

  const nameParts = (shipping.name ?? session.customer_details?.name ?? 'Customer').split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(' ') || '-';
  const customerEmail = session.customer_details?.email ?? '';

  let printifyOrder: { id: string };
  try {
    printifyOrder = await createPrintifyOrder(
      printifyToken,
      printifyShopId,
      {
        first_name: firstName,
        last_name: lastName,
        email: customerEmail,
        phone: session.customer_details?.phone ?? '0000000000',
        address1: shipping.address.line1 ?? '',
        ...(shipping.address.line2 ? { address2: shipping.address.line2 } : {}),
        city: shipping.address.city ?? '',
        region: shipping.address.state ?? '',
        country: shipping.address.country ?? 'US',
        zip: shipping.address.postal_code ?? '',
      },
      [{ productId, variantId, quantity, externalId: session.id }]
    );
  } catch (err) {
    logError(event.id, `Printify order creation failed for session ${session.id}`, err);
    // Unlike the signature-check failure above, this path only runs after a
    // verified Stripe signature -- the only caller who ever sees this
    // response is Stripe's own retry logic and your webhook dashboard, so
    // there's no attacker audience to withhold detail from here.
    return new Response(`Printify error: ${err}`, { status: 500 });
  }

  // Mark this event as processed (7-day TTL covers Stripe's full retry window)
  if (kv) {
    await kv.put(idempotencyKey, session.id, { expirationTtl: 604800 });
  }

  log(event.id, `Printify draft order ${printifyOrder.id} created for session ${session.id}`);

  const products = productsData as { id: string; name: string; variants: { id: number; name: string }[] }[];
  const product = products.find(p => p.id === productId);
  const variant = product?.variants.find(v => v.id === variantId);
  const itemLine = product ? `${quantity} x ${product.name}${variant ? ` (${variant.name})` : ''}` : 'your item';
  const addressLines = [
    shipping.name,
    shipping.address.line1,
    shipping.address.line2,
    [shipping.address.city, shipping.address.state, shipping.address.postal_code].filter(Boolean).join(', '),
  ].filter((line): line is string => Boolean(line));

  // Best-effort: an email failure shouldn't turn into a duplicate Printify
  // order on Stripe's retry, so neither of these ever affects the response status.
  if (customerEmail) {
    try {
      const html = await render(
        OrderConfirmationEmail({ firstName, itemLine, addressLines })
      );

      await sendResendEmail(resendApiKey, {
        fromAddr: ORDER_FROM_ADDR,
        fromName: ORDER_FROM_NAME,
        to: customerEmail,
        subject: 'Your White Rabbit order is confirmed',
        html,
        text: [
          `Thanks, ${firstName}! Your order is confirmed.`,
          ``,
          itemLine,
          ``,
          `Shipping to:`,
          ...addressLines,
          ``,
          `Our rabbit hole crew is already hopping on production and shipping. We can't promise this shirt will fix your frame, but it will absolutely upgrade your dance floor swagger.`,
          ``,
          `Questions? Just reply to this email.`,
        ].join('\n'),
      });
      log(event.id, `Order confirmation email sent to ${customerEmail}`);
    } catch (err) {
      logError(event.id, `Order confirmation email failed for session ${session.id}`, err);
    }
  } else {
    logError(event.id, `No customer email on session ${session.id} — confirmation email skipped`);
  }

  try {
    await sendEmail(merchantEmailBinding, {
      fromAddr: ORDER_FROM_ADDR,
      fromName: ORDER_FROM_NAME,
      to: MERCHANT_TO,
      subject: `New order: ${itemLine}`,
      text: [
        itemLine,
        ``,
        `Customer: ${shipping.name ?? session.customer_details?.name ?? 'Unknown'}${customerEmail ? ` <${customerEmail}>` : ''}`,
        ``,
        `Shipping to:`,
        ...addressLines,
        ``,
        // There's no confirmed direct deep-link for a specific Printify
        // order, so that one links to the general orders list instead
        // (search there by the id below).
        `Printify draft order: ${printifyOrder.id} — review and send to production at https://printify.com/app/orders (search for this order id)`,
        `Stripe: ${stripeDashboardLink(stripeKey, session.id)}`,
      ].join('\n'),
    });
    log(event.id, `Merchant notification sent for session ${session.id}`);
  } catch (err) {
    logError(event.id, `Merchant notification failed for session ${session.id}`, err);
  }

  return new Response('OK', { status: 200 });
}
