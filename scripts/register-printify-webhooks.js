// Registers the shipment webhooks with Printify (order:shipment:created and
// order:shipment:delivered), pointing at /api/printify-webhook/<token>.
// Printify has no dashboard UI for this -- API only. Run once; re-run if
// the callback URL or PRINTIFY_WEBHOOK_TOKEN ever changes (it just creates
// new webhook registrations, so delete stale ones in Printify if you do).
//
// Run with:
//   PRINTIFY_API_TOKEN=xxx PRINTIFY_SHOP_ID=xxx PRINTIFY_WEBHOOK_TOKEN=xxx node scripts/register-printify-webhooks.js

const API_TOKEN = process.env.PRINTIFY_API_TOKEN;
const SHOP_ID = process.env.PRINTIFY_SHOP_ID;
const WEBHOOK_TOKEN = process.env.PRINTIFY_WEBHOOK_TOKEN;
const SITE_URL = process.env.SITE_URL ?? 'https://whiterabbitwcs.com';

if (!API_TOKEN) { console.error('PRINTIFY_API_TOKEN not set'); process.exit(1); }
if (!SHOP_ID) { console.error('PRINTIFY_SHOP_ID not set'); process.exit(1); }
if (!WEBHOOK_TOKEN) { console.error('PRINTIFY_WEBHOOK_TOKEN not set (must match the Cloudflare secret of the same name)'); process.exit(1); }

const callbackUrl = `${SITE_URL}/api/printify-webhook/${WEBHOOK_TOKEN}`;
const topics = ['order:shipment:created', 'order:shipment:delivered'];

for (const topic of topics) {
  const res = await fetch(`https://api.printify.com/v1/shops/${SHOP_ID}/webhooks.json`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ topic, url: callbackUrl }),
  });

  const body = await res.json();
  if (!res.ok) {
    console.error(`Failed to register ${topic}:`, body);
    continue;
  }
  console.log(`Registered ${topic} -> webhook id ${body.id}`);
}
