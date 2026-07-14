// Renders src/emails/OrderConfirmation.tsx to HTML with sample data and
// opens it in the browser. No Stripe/Printify/Resend involved — for fast
// iteration on email copy/design only.
// Run with: pnpm preview-email

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
import { render } from '@react-email/render';
import { OrderConfirmationEmail } from '../src/emails/OrderConfirmation';
import productsData from '../src/data/products.json' with { type: 'json' };

const __dirname = dirname(fileURLToPath(import.meta.url));

type Product = { name: string; variants: { name: string }[] };
const products = productsData as Product[];
const sampleProduct = products[0];
const sampleVariant = sampleProduct?.variants[0];

const html = await render(
  OrderConfirmationEmail({
    firstName: 'Alex',
    itemLine: sampleProduct
      ? `1 x ${sampleProduct.name}${sampleVariant ? ` (${sampleVariant.name})` : ''}`
      : '1 x Sample Product',
    addressLines: ['Alex Rivera', '123 Main St', 'Apt 4B', 'Phoenix, AZ 85001'],
  })
);

const outPath = join(__dirname, '..', '.email-preview.html');
writeFileSync(outPath, html);

console.log(`Wrote ${outPath}`);

try {
  execFileSync('open', [outPath]);
} catch {
  console.log('Could not auto-open — open the file above manually.');
}
