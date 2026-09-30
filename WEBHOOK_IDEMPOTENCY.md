# Webhook Idempotency Race Condition

## What's the problem

`src/pages/api/stripe-webhook.ts` uses a read-then-write pattern to prevent
duplicate Printify orders when Stripe delivers the same event more than once:

```ts
// line 41 — check
const already = await kv.get(idempotencyKey);
if (already) return new Response('OK', { status: 200 });

// ... create Printify order (~300–800ms async work) ...

// line 92 — mark done
await kv.put(idempotencyKey, session.id, { expirationTtl: 604800 });
```

The gap between the `get` and the `put` is a window where two Worker
invocations processing the same event ID can both pass the guard, both call
`createPrintifyOrder`, and create two identical orders for one payment.

## When does it actually happen

Stripe retries webhooks on any non-2xx response or network timeout. If a
Worker instance times out or crashes after placing the order but before writing
the idempotency key, Stripe retries and a second order is created. Less likely
but possible: Stripe occasionally delivers the same event to multiple endpoints
nearly simultaneously during failover.

Cloudflare Workers does not serialise requests to the same URL — concurrent
invocations are the norm at any meaningful traffic level.

## Why Cloudflare KV can't fully fix it

KV is eventually consistent with no compare-and-swap (CAS) operation. There's
no `putIfAbsent` or conditional write, so any "write a lock first" approach has
the same race at the lock-write step.

## Options

### 1. Accept the race, make Printify idempotent (recommended)

The `createPrintifyOrder` call already passes `externalId: session.id`
(line 83). If Printify treats `externalId` as a unique constraint and rejects
or deduplicates duplicate submissions, the double-order problem is solved at
the source regardless of the KV race.

**Action:** verify Printify's behaviour when the same `externalId` is submitted
twice. If it returns a 409 or silently deduplicates, no further work is needed.

### 2. Move to Durable Objects

Cloudflare Durable Objects provide single-threaded, serialised execution per
key. A `WebhookLock` Durable Object keyed by event ID would make the
check-and-set atomic.

Trade-off: added cost and complexity for a low-traffic merch shop where
duplicate orders are already rare.

### 3. Write the key before placing the order

```ts
// Write the key optimistically with a short TTL
await kv.put(idempotencyKey, 'processing', { expirationTtl: 60 });

// Place the order
await createPrintifyOrder(...);

// Extend to full 7-day TTL
await kv.put(idempotencyKey, session.id, { expirationTtl: 604800 });
```

This narrows the window significantly — the race is now only between the
two `kv.put('processing')` calls, which is milliseconds rather than the
full order-creation round-trip. Not perfectly atomic, but good enough for
a low-volume store.

## Practical risk at current scale

At a few orders per week the probability of two simultaneous webhook
deliveries for the same event is very low. The most realistic trigger is a
Worker timeout causing a Stripe retry. Monitoring Printify for duplicate
`externalId` values would catch this if it does occur.
