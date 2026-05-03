export interface ProductImage {
  src: string;
  position: string;
  variantIds: number[];
}

export interface ProductVariant {
  id: number;
  name: string;
  size: string;
  color: string;
  price: string; // e.g. "35.00"
  inStock: boolean;
  previewUrl: string;
  backPreviewUrl?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  thumbnailUrl: string;
  images: ProductImage[];
  variants: ProductVariant[];
}

export interface PrintifyOrderRecipient {
  first_name: string;
  last_name: string;
  email: string;
  address1: string;
  city: string;
  region: string;
  country: string;
  zip: string;
}

export async function createPrintifyOrder(
  apiToken: string,
  shopId: string,
  recipient: PrintifyOrderRecipient,
  items: { productId: string; variantId: number; quantity: number }[]
): Promise<void> {
  const res = await fetch(`https://api.printify.com/v1/shops/${shopId}/orders.json`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      line_items: items.map(i => ({
        product_id: i.productId,
        variant_id: i.variantId,
        quantity: i.quantity,
      })),
      shipping_method: 1,
      address_to: recipient,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Printify order failed: ${res.status} ${body}`);
  }
}
