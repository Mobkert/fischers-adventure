/**
 * Extract fish sprites from white-bg sheets → transparent PNGs.
 */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "..", "images");
const ASSETS =
  "C:\\Users\\user\\.cursor\\projects\\c-Users-user-Documents-Fischer-Adventure\\assets";

const SHEET5 = path.join(
  ASSETS,
  "c__Users_user_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_5-f3e1aa27-72fd-4a89-8acb-4a445a612d41.png"
);
const SHEET1 = path.join(
  ASSETS,
  "c__Users_user_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_7-a578abe8-2472-4dff-b182-2dd02f3d4cd3.png"
);

const WHITE_THRESH = 245; // RGB all >= this → transparent
const MIN_AREA = 80; // ignore tiny noise blobs
const PAD = 4;

function isWhite(r, g, b, a) {
  if (a < 8) return true;
  return r >= WHITE_THRESH && g >= WHITE_THRESH && b >= WHITE_THRESH;
}

function findComponents(width, height, data) {
  const visited = new Uint8Array(width * height);
  const comps = [];

  const idx = (x, y) => (y * width + x) * 4;
  const key = (x, y) => y * width + x;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = idx(x, y);
      if (visited[key(x, y)]) continue;
      if (isWhite(data[i], data[i + 1], data[i + 2], data[i + 3])) {
        visited[key(x, y)] = 1;
        continue;
      }

      // BFS flood fill
      const stack = [[x, y]];
      visited[key(x, y)] = 1;
      let minX = x,
        maxX = x,
        minY = y,
        maxY = y;
      let area = 0;

      while (stack.length) {
        const [cx, cy] = stack.pop();
        area++;
        if (cx < minX) minX = cx;
        if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy;
        if (cy > maxY) maxY = cy;

        for (const [nx, ny] of [
          [cx - 1, cy],
          [cx + 1, cy],
          [cx, cy - 1],
          [cx, cy + 1],
        ]) {
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const k = key(nx, ny);
          if (visited[k]) continue;
          visited[k] = 1;
          const ni = idx(nx, ny);
          if (isWhite(data[ni], data[ni + 1], data[ni + 2], data[ni + 3])) continue;
          stack.push([nx, ny]);
        }
      }

      if (area >= MIN_AREA) {
        comps.push({ minX, maxX, minY, maxY, area });
      }
    }
  }

  // Sort top-to-bottom, then left-to-right
  comps.sort((a, b) => {
    const ay = (a.minY + a.maxY) / 2;
    const by = (b.minY + b.maxY) / 2;
    if (Math.abs(ay - by) > 40) return ay - by;
    return a.minX - b.minX;
  });

  return comps;
}

async function extractFromSheet(sheetPath, namePrefix) {
  const { data, info } = await sharp(sheetPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  console.log(`${path.basename(sheetPath)}: ${width}x${height}`);

  // Make white transparent in a copy
  const rgba = Buffer.from(data);
  for (let i = 0; i < rgba.length; i += 4) {
    if (isWhite(rgba[i], rgba[i + 1], rgba[i + 2], rgba[i + 3])) {
      rgba[i + 3] = 0;
    }
  }

  const comps = findComponents(width, height, rgba);
  console.log(`  found ${comps.length} components`);

  const saved = [];
  for (let n = 0; n < comps.length; n++) {
    const c = comps[n];
    const left = Math.max(0, c.minX - PAD);
    const top = Math.max(0, c.minY - PAD);
    const right = Math.min(width - 1, c.maxX + PAD);
    const bottom = Math.min(height - 1, c.maxY + PAD);
    const w = right - left + 1;
    const h = bottom - top + 1;

    const crop = Buffer.alloc(w * h * 4);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const sx = left + x;
        const sy = top + y;
        const si = (sy * width + sx) * 4;
        const di = (y * w + x) * 4;
        crop[di] = rgba[si];
        crop[di + 1] = rgba[si + 1];
        crop[di + 2] = rgba[si + 2];
        crop[di + 3] = rgba[si + 3];
      }
    }

    const name = `${namePrefix}_${n + 1}.png`;
    const outPath = path.join(OUT, name);
    await sharp(crop, { raw: { width: w, height: h, channels: 4 } })
      .png()
      .toFile(outPath);
    console.log(`  wrote ${name} (${w}x${h}, area ${c.area})`);
    saved.push(outPath);
  }
  return saved;
}

async function main() {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

  // Sheet with 5 fish → cavefish_1..5
  const five = await extractFromSheet(SHEET5, "cavefish");
  // Single grey fish → cavefish_6
  const one = await extractFromSheet(SHEET1, "cavefish_solo");

  // Rename solo to cavefish_6 for a clean set of 6
  if (one.length >= 1) {
    const dest = path.join(OUT, "cavefish_6.png");
    fs.copyFileSync(one[0], dest);
    if (path.basename(one[0]) !== "cavefish_6.png") {
      fs.unlinkSync(one[0]);
    }
    // Remove any cavefish_solo_* leftovers
    for (const f of fs.readdirSync(OUT)) {
      if (f.startsWith("cavefish_solo")) {
        fs.unlinkSync(path.join(OUT, f));
      }
    }
    console.log(`  renamed solo → cavefish_6.png`);
  }

  console.log("\nDone. Files in images/:");
  for (const f of fs.readdirSync(OUT).filter((x) => x.startsWith("cavefish"))) {
    console.log(" ", f);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
