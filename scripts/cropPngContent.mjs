import fs from "fs";
import { PNG } from "pngjs";

const file = process.argv[2];
const pad = Number(process.argv[3] ?? 10);
if (!file) {
  console.error("Usage: node cropPngContent.mjs <file.png> [pad]");
  process.exit(1);
}

const png = PNG.sync.read(fs.readFileSync(file));
let minX = png.width;
let minY = png.height;
let maxX = 0;
let maxY = 0;

for (let y = 0; y < png.height; y++) {
  for (let x = 0; x < png.width; x++) {
    const i = (png.width * y + x) << 2;
    if (png.data[i + 3] > 16) {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
}

if (maxX < minX) {
  console.error("No opaque pixels found");
  process.exit(1);
}

minX = Math.max(0, minX - pad);
minY = Math.max(0, minY - pad);
maxX = Math.min(png.width - 1, maxX + pad);
maxY = Math.min(png.height - 1, maxY + pad);
const w = maxX - minX + 1;
const h = maxY - minY + 1;
const out = new PNG({ width: w, height: h });

for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    const si = ((minY + y) * png.width + (minX + x)) << 2;
    const di = (y * w + x) << 2;
    out.data[di] = png.data[si];
    out.data[di + 1] = png.data[si + 1];
    out.data[di + 2] = png.data[si + 2];
    out.data[di + 3] = png.data[si + 3];
  }
}

fs.writeFileSync(file, PNG.sync.write(out));
console.log(`Cropped ${file} to ${w}x${h}`);
