// Converts any hero PNGs that don't yet have WebP counterparts.
// Run before `pnpm build` or add to your CI pipeline.
// Requires ffmpeg on PATH.

import { readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync, spawnSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));

const hasFfmpeg = spawnSync('ffmpeg', ['-version'], { stdio: 'pipe' }).status === 0;
if (!hasFfmpeg) {
  console.log('[hero-images] ffmpeg not found, skipping WebP conversion.');
  process.exit(0);
}
const heroDir = join(__dirname, '../public/images/hero/heroImages');

if (!existsSync(heroDir)) {
  console.log('[hero-images] No heroImages directory found, skipping.');
  process.exit(0);
}

const sizes = [
  { suffix: '',     width: 1600, quality: 85 },
  { suffix: '-800', width: 800,  quality: 82 },
  { suffix: '-400', width: 400,  quality: 78 },
];

let converted = 0;
for (const entry of readdirSync(heroDir)) {
  const png = join(heroDir, entry, 'image.png');
  if (!existsSync(png)) continue;

  for (const { suffix, width, quality } of sizes) {
    const out = join(heroDir, entry, `image${suffix}.webp`);
    if (existsSync(out)) continue;

    execSync(
      `ffmpeg -i "${png}" -vf "scale=${width}:-2" -quality ${quality} -y "${out}"`,
      { stdio: 'pipe' }
    );
    console.log(`[hero-images] Converted ${entry}/image.png → image${suffix}.webp`);
    converted++;
  }
}

console.log(`[hero-images] Done. ${converted} new WebP file(s) generated.`);
