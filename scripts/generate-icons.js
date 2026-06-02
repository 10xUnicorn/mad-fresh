const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'icons');
const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

function generateSvgIcon(size) {
  // Scale font size proportionally
  const fontSize = Math.round(size * 0.375);
  const textY = Math.round(size * 0.625);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.2)}" fill="#0a0a0a"/>
  <circle cx="${size / 2}" cy="${size * 0.42}" r="${Math.round(size * 0.32)}" fill="#75F663"/>
  <text x="${size / 2}" y="${textY}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="${fontSize}" font-weight="700" fill="white">MF</text>
</svg>`;
}

function main() {
  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  for (const size of SIZES) {
    const svg = generateSvgIcon(size);
    const outputPath = path.join(OUTPUT_DIR, `icon-${size}x${size}.png`);
    // Save as SVG with .png extension as placeholder
    // For production, use sharp or another tool to convert to actual PNG
    fs.writeFileSync(outputPath.replace('.png', '.svg'), svg);
    console.log(`Generated: icon-${size}x${size}.svg`);
  }

  // Also try to generate actual PNGs if sharp is available
  try {
    const sharp = require('sharp');
    console.log('\nsharp available — generating PNG versions...');
    generatePngs(sharp);
  } catch {
    console.log('\nsharp not available — SVG placeholders created.');
    console.log('To generate actual PNGs, run: npm install sharp && node scripts/generate-icons.js');
    console.log('Or use the apple-touch-icon.png source with any image resizing tool.');
  }
}

async function generatePngs(sharp) {
  const SOURCE = path.join(__dirname, '..', 'public', 'apple-touch-icon.png');
  for (const size of SIZES) {
    const outputPath = path.join(OUTPUT_DIR, `icon-${size}x${size}.png`);
    await sharp(SOURCE)
      .resize(size, size, { fit: 'cover' })
      .png()
      .toFile(outputPath);
    console.log(`Generated PNG: icon-${size}x${size}.png`);
  }
  console.log('\nAll PNG icons generated successfully!');
}

main();
