# Shop — Printify + Stripe

Product data is fetched from Printify and committed to `src/data/products.json`. The shop page is entirely static at build time; SSR only activates for `/api/checkout` and `/api/stripe-webhook`.

## Order Flow

1. Customer selects product/variant → `/api/checkout` creates a Stripe Checkout session
2. Stripe redirects to hosted checkout; on success, fires a webhook to `/api/stripe-webhook`
3. Webhook calls `createPrintifyOrder` in `src/lib/printful.ts`, which creates a **draft** order in Printify
4. Webhook sends the customer an order-confirmation email via Resend, and a new-order notification to `whiterabbitwcs@gmail.com` (both best-effort — failure is logged but doesn't fail the webhook or retry the Printify order)
5. Draft sits in the Printify dashboard for manual review — hit "Send to production" there to fulfill

Printify itself never emails the customer here — this is a custom API integration, not a connected storefront, so Printify only talks to the merchant account. All customer-facing email is this app's responsibility.

Orders are intentionally left as drafts (the `send_to_production` API call is omitted) so each order can be reviewed before Printify charges for fulfillment.

## Security

- `success_url`/`cancel_url` use a hardcoded `SITE_ORIGIN` (the deployed site's own URL) rather than the client-supplied `Origin` header. That header is trivially spoofable and, unvalidated, would let anyone redirect a paying customer to an arbitrary domain after a real Stripe payment completes.
- `/api/checkout` requires a Cloudflare Turnstile token, same as the contact form (`verifyTurnstile` in `src/lib/turnstile.ts`), gated behind `TURNSTILE_SECRET_KEY`. Without it the endpoint could be scripted to generate unlimited Stripe Checkout sessions.
- Both `checkout.ts` and `stripe-webhook.ts` log the real error server-side but return a generic message to the caller — never leak exception text in the HTTP response.

## Debugging

`checkout.ts` and `stripe-webhook.ts` log to Cloudflare Workers Logs (`console.log`/`console.error`, viewable in the Cloudflare dashboard or `wrangler tail`). Webhook logs are prefixed `[stripe-webhook] [<stripe event id>]` so every line for one order can be grepped out together; checkout logs are prefixed `[checkout]` and include the Stripe session id, which correlates to the webhook logs for the same order.

## Customer Order-Confirmation Email

Sent from the webhook via [Resend](https://resend.com)'s HTTP API (`sendResendEmail` in `src/lib/email.ts`), gated behind a `RESEND_API_KEY` secret. Chosen over Cloudflare's own Email Service because Cloudflare requires a Workers Paid plan ($5/mo flat) just to send to arbitrary (non-pre-verified) recipients, whereas Resend's free tier — 3,000 emails/month, 100/day — costs $0 and comfortably covers this shop's volume.

Setup (one-time, outside this repo):

1. Sign up at resend.com (free)
2. Add and verify the sending domain (`whiterabbitwcs.com`) — Resend walks you through the SPF/DKIM DNS records
3. Create an API key, then `wrangler secret put RESEND_API_KEY`

## Merchant New-Order Notification

Sent to `whiterabbitwcs@gmail.com` via the same `SEND_EMAIL` Cloudflare binding the contact form uses (`sendEmail` in `src/lib/email.ts`) — no separate setup needed, it's already configured. If order volume ever makes this noisy, filter it on the Gmail side rather than touching the code (the sender is `orders@whiterabbitwcs.com`).

Until `RESEND_API_KEY` is set, `sendResendEmail()` falls back to a `console.log` stub — safe to deploy either way, but customers won't actually receive anything until Resend is configured.

This is separate from the `SEND_EMAIL` binding used by the contact form, which stays on Cloudflare's own Email Routing since it only ever sends to the site's own inbox (free, no plan requirement, no domain onboarding needed — it was already working).

Stripe's own automatic payment-receipt email (Dashboard → Settings → Customer emails → "Successful payments") is a separate, independent toggle and worth enabling too — it's the payment record, not a replacement for the order-confirmation email above.

## Payment Model

Stripe and Printify billing are completely separate:

- **Stripe** collects the retail price from the customer and deposits it to the bank account
- **Printify** charges the payment method on file in your Printify account for production + shipping costs

The margin is the spread between the two. Printify has no visibility into what the customer was charged.

To update the Printify payment method: **printify.com → Wallet → Payments**.

## Key Files

| Path | Purpose |
|------|---------|
| `src/pages/shop.astro` | Shop UI — product grid, dialog, variant selectors |
| `src/pages/api/checkout.ts` | Creates Stripe Checkout session |
| `src/pages/api/stripe-webhook.ts` | Handles `checkout.session.completed`, creates Printify order |
| `src/lib/printful.ts` | `createPrintifyOrder` — Printify API wrapper (filename is legacy) |
| `src/lib/email.ts` | `sendResendEmail` (order confirmations, via Resend) and `sendEmail` (contact form, via Cloudflare `send_email` binding) |
| `src/data/products.json` | Pre-fetched product catalog (committed; update via fetch script) |

## Refreshing Product Data

```bash
PRINTIFY_API_TOKEN=xxx PRINTIFY_SHOP_ID=xxx node scripts/fetch-products.js
```

## Known Quirk — Swapped color/size Fields

Printify variant titles use different orderings across product types (`"Color / Size"` for tees, `"Size / Color"` for tanks and hats). The fetch script always treats the last segment as size, which gets it wrong for some products.

If `color`/`size` look swapped in `products.json` after a re-fetch, fix them directly in the JSON — the affected products are tank tops and one-size hats (where sizes like `M`/`L` end up in the `color` field).
