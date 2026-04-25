import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const API_KEY = process.env.PRINTFUL_API_KEY;
const STORE_ID = process.env.PRINTFUL_STORE_ID;

if (!API_KEY) throw new Error('PRINTFUL_API_KEY is required');
if (!STORE_ID) throw new Error('PRINTFUL_STORE_ID is required');

async function pf(path) {
  const res = await fetch(`https://api.printful.com${path}`, {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'X-PF-Store-Id': STORE_ID,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Printful ${path} → ${res.status}: ${body}`);
  }
  const { result } = await res.json();
  return result;
}

const syncProducts = await pf('/store/products?limit=100');

const products = await Promise.all(
  syncProducts.map(async (p) => {
    const detail = await pf(`/store/products/${p.id}`);
    const variants = detail.sync_variants.map((v) => ({
      id: v.id,
      name: v.name,
      size: v.size || '',
      color: v.color || '',
      price: v.retail_price,
      inStock: v.availability_status === 'active',
      previewUrl: v.files?.find((f) => f.type === 'preview')?.preview_url || p.thumbnail_url,
    }));

    return {
      id: p.id,
      name: p.name,
      description: detail.sync_product.description || '',
      thumbnailUrl: p.thumbnail_url,
      variants,
    };
  })
);

const outPath = join(__dirname, '../src/data/products.json');
writeFileSync(outPath, JSON.stringify(products, null, 2));
console.log(`[Products] Wrote ${products.length} products to src/data/products.json`);
