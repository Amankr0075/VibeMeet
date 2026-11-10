
// generate-icons.js — Run once with Node to produce all PWA icon sizes from logo.png
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT = path.join(__dirname, 'public', 'logo.png');
const OUTPUT_DIR = path.join(__dirname, 'public', 'icons');

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

async function generate() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const src = fs.existsSync(INPUT) ? INPUT : path.join(__dirname, 'public', 'logo.jpg');
  if (!fs.existsSync(src)) {
    console.error('No logo.png or logo.jpg found in public/');
    process.exit(1);
  }

  for (const size of SIZES) {
    await sharp(src)
      .resize(size, size, { fit: 'cover', background: { r: 10, g: 15, b: 30, alpha: 1 } })
      .png()
      .toFile(path.join(OUTPUT_DIR, `icon-${size}.png`));
    console.log(`✅ icon-${size}.png`);
  }
  console.log('\nAll PWA icons generated!');
}

generate().catch(console.error);
