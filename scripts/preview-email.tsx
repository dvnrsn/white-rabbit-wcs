// Renders one of src/emails/*.tsx to HTML with sample data and opens it in
// the browser. No Stripe/Printify/Resend involved -- for fast iteration on
// email copy/design only.
// Run with: pnpm preview-email [confirmation|shipped|delivered]

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
import { render } from '@react-email/render';
import { OrderConfirmationEmail } from '../src/emails/OrderConfirmation';
import { OrderShippedEmail } from '../src/emails/OrderShipped';
import { OrderDeliveredEmail } from '../src/emails/OrderDelivered';
import productsData from '../src/data/products.json' with { type: 'json' };

const __dirname = dirname(fileURLToPath(import.meta.url));

type Product = { name: string; variants: { name: string; price: string }[] };
const products = productsData as Product[];
const sampleProduct = products[0];
const sampleVariant = sampleProduct?.variants[0];
const sampleItemLine = sampleProduct
  ? `1 x ${sampleProduct.name}${sampleVariant ? ` (${sampleVariant.name})` : ''}`
  : '1 x Sample Product';

const template = process.argv[2] ?? 'confirmation';

const templates = {
  confirmation: () =>
    OrderConfirmationEmail({
      firstName: 'Alex',
      itemLine: sampleItemLine,
      amountPaid: sampleVariant
        ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(parseFloat(sampleVariant.price))
        : '$35.00',
      addressLines: ['Alex Rivera', '123 Main St', 'Apt 4B', 'Phoenix, AZ 85001'],
    }),
  shipped: () =>
    OrderShippedEmail({
      firstName: 'Alex',
      itemLine: sampleItemLine,
      carrier: { code: 'usps', trackingNumber: '9400111899223344556677', trackingUrl: 'https://tools.usps.com/go/TrackConfirmAction' },
    }),
  delivered: () => OrderDeliveredEmail({ firstName: 'Alex', itemLine: sampleItemLine }),
};

if (!(template in templates)) {
  console.error(`Unknown template "${template}". Choose one of: ${Object.keys(templates).join(', ')}`);
  process.exit(1);
}

const html = await render(templates[template as keyof typeof templates]());

const outPath = join(__dirname, '..', '.email-preview.html');
writeFileSync(outPath, html);

console.log(`Wrote ${outPath}`);

try {
  execFileSync('open', [outPath]);
} catch {
  console.log('Could not auto-open — open the file above manually.');
}
