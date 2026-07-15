import type { APIRoute } from 'astro';
import { env as cfEnv } from 'cloudflare:workers';
import { sendResendEmail } from '../../../lib/email';
import { alertDev } from '../../../lib/alert';

export const prerender = false;

const ORDER_FROM_ADDR = 'orders@whiterabbitwcs.com';
const ORDER_FROM_NAME = 'White Rabbit WCS';

interface OrderMapping {
  email: string;
  firstName: string;
  itemLine: string;
}

interface PrintifyCarrier {
  code: string;
  tracking_number: string;
  tracking_url?: string;
}

interface PrintifyShipmentEvent {
  id: string;
  type: string;
  resource: {
    id: string;
    data?: {
      carrier?: PrintifyCarrier;
    };
  };
}

function log(msg: string) {
  console.log(`[printify-webhook] ${msg}`);
}
function logError(msg: string, err?: unknown) {
  console.error(`[printify-webhook] ${msg}`, err ?? '');
}

export const POST: APIRoute = async ({ request, params, locals }) => {
  const e = cfEnv as any;
  const webhookToken = e.PRINTIFY_WEBHOOK_TOKEN as string | undefined;
  const kv = e.SESSION as
    | { get: (k: string, t?: string) => Promise<any>; put: (k: string, v: string, o?: any) => Promise<void> }
    | undefined;
  const env = (locals as { runtime?: { env?: Record<string, string> } }).runtime?.env ?? {};
  const resendApiKey = env.RESEND_API_KEY;

  // Printify has no webhook signing scheme (confirmed against their OpenAPI
  // spec -- the webhook object is just {topic, url, shop_id, id}, no secret
  // field). A hard-to-guess path segment, checked in constant time, is the
  // only practical protection available here.
  const token = params.token ?? '';
  const enc = new TextEncoder();
  const tokenBytes = enc.encode(token);
  const secretBytes = enc.encode(webhookToken ?? '');
  const validToken =
    !!webhookToken &&
    tokenBytes.byteLength === secretBytes.byteLength &&
    crypto.subtle.timingSafeEqual(tokenBytes, secretBytes);

  if (!validToken) {
    logError('Rejected request with invalid or missing token');
    return new Response('Unauthorized', { status: 401 });
  }

  if (!kv) {
    logError('SESSION KV binding unavailable');
    return new Response('Not configured', { status: 500 });
  }

  let payload: PrintifyShipmentEvent;
  try {
    payload = await request.json();
  } catch {
    logError('Invalid JSON body');
    return new Response('Invalid JSON', { status: 400 });
  }

  if (payload.type !== 'order:shipment:created' && payload.type !== 'order:shipment:delivered') {
    log(`Ignoring unhandled topic=${payload.type}`);
    return new Response('OK', { status: 200 });
  }

  // Idempotency: Printify retries up to 3 times on a non-2xx response.
  const idempotencyKey = `printify_event:${payload.id}`;
  const already = await kv.get(idempotencyKey);
  if (already) {
    log(`Duplicate event ${payload.id}, skipping`);
    return new Response('OK', { status: 200 });
  }

  const printifyOrderId = payload.resource.id;
  const mappingRaw = await kv.get(`printify_order:${printifyOrderId}`);
  if (!mappingRaw) {
    logError(`No stored mapping for Printify order ${printifyOrderId} -- can't notify, skipping`);
    await alertDev(
      env,
      `Printify order ${printifyOrderId}: shipment notification not sent`,
      [
        `Printify sent a ${payload.type} event for order ${printifyOrderId}, but there's no stored customer mapping for it, so no email went out.`,
        ``,
        `Event id: ${payload.id}`,
        `This can happen for orders placed before shipment notifications existed, or if the original KV write failed.`,
      ].join('\n')
    );
    await kv.put(idempotencyKey, '1', { expirationTtl: 604800 });
    return new Response('OK', { status: 200 });
  }

  const { email, firstName, itemLine } = JSON.parse(mappingRaw) as OrderMapping;
  const carrier = payload.resource.data?.carrier;

  try {
    if (payload.type === 'order:shipment:created') {
      const carrierLines = carrier
        ? [
            `Carrier: ${carrier.code}`,
            `Tracking number: ${carrier.tracking_number}`,
            carrier.tracking_url ? `Track it: ${carrier.tracking_url}` : null,
          ].filter((line): line is string => Boolean(line))
        : [];

      await sendResendEmail(resendApiKey, {
        fromAddr: ORDER_FROM_ADDR,
        fromName: ORDER_FROM_NAME,
        to: email,
        subject: 'Your White Rabbit order has shipped',
        text: [
          `Hi ${firstName},`,
          ``,
          `${itemLine} is on its way!`,
          ``,
          ...carrierLines,
          ``,
          `Questions? Just reply to this email.`,
        ].join('\n'),
      });
      log(`Shipped email sent to ${email} for Printify order ${printifyOrderId}`);
    } else {
      await sendResendEmail(resendApiKey, {
        fromAddr: ORDER_FROM_ADDR,
        fromName: ORDER_FROM_NAME,
        to: email,
        subject: 'Your White Rabbit order was delivered',
        text: [
          `Hi ${firstName},`,
          ``,
          `${itemLine} has been delivered! We hope you love it.`,
          ``,
          `Questions? Just reply to this email.`,
        ].join('\n'),
      });
      log(`Delivered email sent to ${email} for Printify order ${printifyOrderId}`);
    }
  } catch (err) {
    logError(`Notification email failed for Printify order ${printifyOrderId}`, err);
    await alertDev(
      env,
      `Printify order ${printifyOrderId}: shipment notification failed to send`,
      [
        `The ${payload.type} email to ${email} for order ${printifyOrderId} failed to send.`,
        ``,
        `Error: ${err instanceof Error ? err.message : String(err)}`,
        `You may want to follow up with the customer directly.`,
      ].join('\n')
    );
  }

  await kv.put(idempotencyKey, '1', { expirationTtl: 604800 });
  return new Response('OK', { status: 200 });
};
