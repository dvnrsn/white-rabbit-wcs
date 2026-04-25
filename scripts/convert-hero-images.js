// Converts hero images (PNG/JPG) to WebP at 3 sizes if not already done.
// Removes orphaned WebP files whose source image no longer exists.
// Requires ffmpeg on PATH; skips gracefully if unavailable.

import { readdirSync, existsSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync, spawnSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));

const hasFfmpeg = spawnSync('ffmpeg', ['-version'], { stdio: 'pipe' }).status === 0;
if (!hasFfmpeg) {
  console.log('[hero-images] ffmpeg not found, skipping.');
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
let removed = 0;

for (const entry of readdirSync(heroDir)) {
  const dir = join(heroDir, entry);
  const source = ['image.png', 'image.jpg', 'image.jpeg', 'image.webp']
    .map(f => join(dir, f))
    .find(f => existsSync(f));

  // Already WebP — no conversion needed, skip
  if (source?.endsWith('.webp')) continue;

  // No source image — remove any orphaned WebP files
  if (!source) {
    for (const { suffix } of sizes) {
      const orphan = join(dir, `image${suffix}.webp`);
      if (existsSync(orphan)) {
        rmSync(orphan);
        console.log(`[hero-images] Removed orphan ${entry}/image${suffix}.webp`);
        removed++;
      }
    }
    continue;
  }

  // Convert missing sizes
  for (const { suffix, width, quality } of sizes) {
    const out = join(dir, `image${suffix}.webp`);
    if (existsSync(out)) continue;

    execSync(
      `ffmpeg -i "${source}" -vf "scale=${width}:-2" -quality ${quality} -y "${out}"`,
      { stdio: 'pipe' }
    );
    console.log(`[hero-images] Converted ${entry}/${source.split('/').pop()} → image${suffix}.webp`);
    converted++;
  }
}

console.log(`[hero-images] Done. ${converted} converted, ${removed} orphans removed.`);
