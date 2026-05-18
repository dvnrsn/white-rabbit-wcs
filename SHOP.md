# Shop — Printify + Stripe

Product data is fetched from Printify and committed to `src/data/products.json`. The shop page is entirely static at build time; SSR only activates for `/api/checkout` and `/api/stripe-webhook`.

## Order Flow

1. Customer selects product/variant → `/api/checkout` creates a Stripe Checkout session
2. Stripe redirects to hosted checkout; on success, fires a webhook to `/api/stripe-webhook`
3. Webhook calls `createPrintifyOrder` in `src/lib/printful.ts`, which creates a **draft** order in Printify
4. Draft sits in the Printify dashboard for manual review — hit "Send to production" there to fulfill

Orders are intentionally left as drafts (the `send_to_production` API call is omitted) so each order can be reviewed before Printify charges for fulfillment.

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
| `src/data/products.json` | Pre-fetched product catalog (committed; update via fetch script) |

## Refreshing Product Data

```bash
PRINTIFY_API_TOKEN=xxx PRINTIFY_SHOP_ID=xxx node scripts/fetch-products.js
```

## Known Quirk — Swapped color/size Fields

Printify variant titles use different orderings across product types (`"Color / Size"` for tees, `"Size / Color"` for tanks and hats). The fetch script always treats the last segment as size, which gets it wrong for some products.

If `color`/`size` look swapped in `products.json` after a re-fetch, fix them directly in the JSON — the affected products are tank tops and one-size hats (where sizes like `M`/`L` end up in the `color` field).
