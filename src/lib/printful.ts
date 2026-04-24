export interface ProductVariant {
  id: number;
  name: string;
  size: string;
  color: string;
  price: string; // e.g. "35.00"
  inStock: boolean;
  previewUrl: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  thumbnailUrl: string;
  variants: ProductVariant[];
}

export interface PrintfulOrderRecipient {
  name: string;
  email: string;
  address1: string;
  city: string;
  state_code: string;
  country_code: string;
  zip: string;
}

export async function createPrintfulOrder(
  apiKey: string,
  recipient: PrintfulOrderRecipient,
  items: { variantId: number; quantity: number }[]
): Promise<void> {
  const res = await fetch('https://api.printful.com/orders', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      recipient,
      items: items.map(i => ({ variant_id: i.variantId, quantity: i.quantity })),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Printful order failed: ${res.status} ${body}`);
  }
}
