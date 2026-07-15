// Renders PNG app icons from the master SVG (public/icon.svg).
// Usage: npm run icons   — rerun whenever the master changes.
import sharp from "sharp";
import { readFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const master = readFileSync(path.join(root, "public", "icon.svg"), "utf8");
// Full-bleed square variant: Android maskable icons and iOS apply their own
// corner masking, so the background must fill the entire canvas.
const square = master.replace('rx="100"', 'rx="0"');

const outDir = path.join(root, "public", "icons");
mkdirSync(outDir, { recursive: true });

const jobs = [
  { svg: master, size: 192, name: "pwa-192x192.png" },
  { svg: master, size: 512, name: "pwa-512x512.png" },
  { svg: square, size: 512, name: "maskable-512x512.png" },
  { svg: square, size: 180, name: "apple-touch-icon.png" },
];

for (const { svg, size, name } of jobs) {
  await sharp(Buffer.from(svg), { density: Math.ceil((72 * size) / 512) })
    .resize(size, size)
    .png()
    .toFile(path.join(outDir, name));
  console.log(`${name} (${size}x${size})`);
}
