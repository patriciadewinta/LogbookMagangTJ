const fs = require("fs");
const zlib = require("zlib");

const PATH = "C:/Users/patri/.claude/image-cache/031c1a14-5f58-4244-b77b-0ab653a6154c/1.png";

function decodePng(buf) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (!buf.slice(0, 8).equals(sig)) throw new Error("not png");
  let off = 8;
  let width, height, colorType, bitDepth;
  const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off); off += 4;
    const type = buf.toString("ascii", off, off + 4); off += 4;
    const data = buf.slice(off, off + len); off += len;
    off += 4; // crc
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === "IDAT") {
      idat.push(data);
    } else if (type === "IEND") {
      break;
    }
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[colorType];
  const stride = width * channels;
  const out = Buffer.alloc(height * stride);
  let pos = 0;
  const prev = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[pos++];
    const line = raw.slice(pos, pos + stride); pos += stride;
    const cur = Buffer.alloc(stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? cur[x - channels] : 0;
      const b = prev[x];
      const c = x >= channels ? prev[x - channels] : 0;
      let v = line[x];
      switch (filter) {
        case 0: break;
        case 1: v = (v + a) & 0xff; break;
        case 2: v = (v + b) & 0xff; break;
        case 3: v = (v + ((a + b) >> 1)) & 0xff; break;
        case 4: {
          const p = a + b - c;
          const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
          const pr = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
          v = (v + pr) & 0xff; break;
        }
      }
      cur[x] = v;
    }
    cur.copy(prev);
    cur.copy(out, y * stride);
  }
  return { width, height, channels, data: out, stride };
}

function hex(p) {
  return "#" + [p.r, p.g, p.b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

const buf = fs.readFileSync(PATH);
const img = decodePng(buf);
console.log("DIMENSIONS", img.width + "x" + img.height, "channels", img.channels);

function px(x, y) {
  const i = y * img.stride + x * img.channels;
  return { r: img.data[i], g: img.data[i + 1], b: img.data[i + 2] };
}

// Color grid: sample every 100px
console.log("\n=== COLOR GRID (x step 100, y step 100) ===");
const xs = [];
for (let x = 20; x < img.width; x += 100) xs.push(x);
const ys = [];
for (let y = 20; y < img.height; y += 100) ys.push(y);
for (const y of ys) {
  const row = xs.map((x) => hex(px(x, y))).join("  ");
  console.log("y=" + String(y).padStart(3) + "  " + row);
}

// Sample specific key points per the spec layout
console.log("\n=== KEY POINTS ===");
const pts = [
  [100, 100, "sidebar upper"],
  [100, 300, "sidebar mid"],
  [100, 520, "sidebar settings area"],
  [250, 40, "title area"],
  [250, 560, "main bg bottom-left"],
  [900, 560, "main bg bottom-right"],
  [250, 200, "card area"],
  [700, 250, "card/table area"],
  [250, 130, "card toolbar area"],
];
for (const [x, y, label] of pts) {
  if (x < img.width && y < img.height) console.log(label.padEnd(24), "(" + x + "," + y + ")", hex(px(x, y)));
}
