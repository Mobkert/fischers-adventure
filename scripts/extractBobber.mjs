import fs from "fs";
import path from "path";
import { PNG } from "pngjs";
import jpeg from "jpeg-js";

const src = process.argv[2];
const dest = process.argv[3];
if (!src || !dest) {
  console.error("Usage: node extractBobber.mjs <src> <dest.png>");
  process.exit(1);
}

const buf = fs.readFileSync(src);
const isJpeg = buf[0] === 0xff && buf[1] === 0xd8;
let png;

if (isJpeg) {
  const { width, height, data } = jpeg.decode(buf, { useTArray: true });
  png = new PNG({ width, height });
  for (let i = 0; i < data.length; i++) {
    png.data[i] = data[i];
  }
} else {
  png = PNG.sync.read(buf);
}

for (let y = 0; y < png.height; y++) {
  for (let x = 0; x < png.width; x++) {
    const i = (png.width * y + x) << 2;
    const r = png.data[i];
    const g = png.data[i + 1];
    const b = png.data[i + 2];
    const a = png.data[i + 3];

    const whiteness = Math.min(r, g, b);
    const spread = Math.max(r, g, b) - whiteness;
    if (a < 16 || (whiteness > 228 && spread < 45)) {
      png.data[i + 3] = 0;
    }
  }
}

png = cropToContent(png, 10);

function cropToContent(src, pad = 8) {
  let minX = src.width;
  let minY = src.height;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < src.height; y++) {
    for (let x = 0; x < src.width; x++) {
      const i = (src.width * y + x) << 2;
      if (src.data[i + 3] > 16) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  if (maxX < minX) return src;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(src.width - 1, maxX + pad);
  maxY = Math.min(src.height - 1, maxY + pad);
  const w = maxX - minX + 1;
  const h = maxY - minY + 1;
  const out = new PNG({ width: w, height: h });
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const si = ((minY + y) * src.width + (minX + x)) << 2;
      const di = (y * w + x) << 2;
      out.data[di] = src.data[si];
      out.data[di + 1] = src.data[si + 1];
      out.data[di + 2] = src.data[si + 2];
      out.data[di + 3] = src.data[si + 3];
    }
  }
  return out;
}

fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, PNG.sync.write(png));
console.log(`Wrote ${dest} (${png.width}x${png.height})`);
