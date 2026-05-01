// Fetches product data from Printify and saves as JSON.
// Run with: PRINTIFY_API_TOKEN=xxx PRINTIFY_SHOP_ID=xxx node scripts/fetch-products.js

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const API_TOKEN = process.env.PRINTIFY_API_TOKEN;
const SHOP_ID = process.env.PRINTIFY_SHOP_ID;

if (!API_TOKEN) { console.error('PRINTIFY_API_TOKEN not set'); process.exit(1); }
if (!SHOP_ID) { console.error('PRINTIFY_SHOP_ID not set'); process.exit(1); }

function stripHtml(html) {
  return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

function parseVariantTitle(title) {
  const parts = title.split(' / ');
  if (parts.length >= 2) {
    return { color: parts.slice(0, -1).join(' / '), size: parts[parts.length - 1] };
  }
  return { color: '', size: title };
}

const headers = { Authorization: `Bearer ${API_TOKEN}` };

const res = await fetch(`https://api.printify.com/v1/shops/${SHOP_ID}/products.json?limit=50`, { headers });
if (!res.ok) { console.error(`Printify API failed: ${res.status} ${await res.text()}`); process.exit(1); }

const { data } = await res.json();

const products = data
  .filter(p => p.variants.some(v => v.is_enabled && v.is_available))
  .map(p => {
    const defaultImage = p.images.find(i => i.is_default && i.position === 'front') ?? p.images[0];
    const thumbnailUrl = defaultImage?.src ?? '';

    const variants = p.variants
      .filter(v => v.is_enabled)
      .map(v => {
        const { color, size } = parseVariantTitle(v.title);
        const frontImage = p.images.find(i => i.variant_ids.includes(v.id) && i.position === 'front');
        const backImage = p.images.find(i => i.variant_ids.includes(v.id) && i.position === 'back');
        return {
          id: v.id,
          name: `${p.title} / ${v.title}`,
          size,
          color,
          price: (v.price / 100).toFixed(2),
          inStock: v.is_available,
          previewUrl: frontImage?.src ?? thumbnailUrl,
          ...(backImage ? { backPreviewUrl: backImage.src } : {}),
        };
      });

    return {
      id: p.id,
      name: p.title,
      description: p.description ? stripHtml(p.description) : '',
      thumbnailUrl,
      variants,
    };
  });

const outPath = join(__dirname, '../src/data/products.json');
writeFileSync(outPath, JSON.stringify(products, null, 2));
console.log(`[Products] Wrote ${products.length} products to src/data/products.json`);
