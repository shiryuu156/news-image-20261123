// draw.mjs — renders the news-image-20261123 front page, 1024x1024 PNG.
// Written from scratch in this session. Node 22 standard library only:
// a tiny raster canvas, a hand-built 5x7 bitmap font, and a hand-rolled
// PNG encoder (zlib deflate + CRC32). No network, no clock, no randomness,
// so every run writes byte-identical output.
//
// The day: Monday 23 November 2026.
//   Lead: COP31 climate talks in Antalya collapse with no deal.
//   Gulf: Iran strikes Bahrain and tankers near Hormuz; Trump threatens
//     to sink blockade runners and to strike after the New Year.
//   Ukraine: naval drones sink the Russian corvette Merkury at Benghazi.
//   Markets: AI fears drag Asia down; Nvidia reinstates Jensen Huang, +27%.
//   Politics: Democrats take their biggest House majority since 1992.

import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const W = 1024;
const H = 1024;
const buf = new Uint8Array(W * H * 3);

// ---------------------------------------------------------------- palette
const hex = (s) => [
  parseInt(s.slice(1, 3), 16),
  parseInt(s.slice(3, 5), 16),
  parseInt(s.slice(5, 7), 16),
];
const PAPER = hex("#f7f1e2");
const INK = hex("#1b1b1b");
const NAVY = hex("#152a4e");
const RED = hex("#b3231b");
const BLUE = hex("#1e4d7a");
const SKY = hex("#7fb2d9");
const SEA = hex("#2e6da4");
const GREEN = hex("#2e7d32");
const GOLD = hex("#c99700");
const GREY = hex("#6b6b6b");
const LGREY = hex("#d8d0bd");
const ORANGE = hex("#e07b00");
const WHITE = hex("#ffffff");
const BLACK = hex("#000000");

// ---------------------------------------------------------------- canvas
function fillAll(c) {
  for (let i = 0; i < W * H; i++) {
    buf[i * 3] = c[0];
    buf[i * 3 + 1] = c[1];
    buf[i * 3 + 2] = c[2];
  }
}
function px(x, y, c) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  buf[i] = c[0];
  buf[i + 1] = c[1];
  buf[i + 2] = c[2];
}
function rect(x, y, w, h, c) {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) px(i, j, c);
}
function hline(x, y, w, c) {
  rect(x, y, w, 1, c);
}
function vline(x, y, h, c) {
  rect(x, y, 1, h, c);
}
function box(x, y, w, h, c, t = 1) {
  rect(x, y, w, t, c);
  rect(x, y + h - t, w, t, c);
  rect(x, y, t, h, c);
  rect(x + w - t, y, t, h, c);
}
function line(x0, y0, x1, y1, c) {
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let e = dx + dy;
  let x = x0;
  let y = y0;
  for (;;) {
    px(x, y, c);
    if (x === x1 && y === y1) break;
    const e2 = 2 * e;
    if (e2 >= dy) {
      e += dy;
      x += sx;
    }
    if (e2 <= dx) {
      e += dx;
      y += sy;
    }
  }
}
function thickLine(x0, y0, x1, y1, w, c) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  const r = Math.floor(w / 2);
  for (let s = 0; s <= steps; s++) {
    const x = Math.round(x0 + ((x1 - x0) * s) / steps);
    const y = Math.round(y0 + ((y1 - y0) * s) / steps);
    disc(x, y, r, c);
  }
}
function disc(cx, cy, r, c) {
  for (let y = -r; y <= r; y++) {
    const half = Math.floor(Math.sqrt(r * r - y * y));
    for (let x = -half; x <= half; x++) px(cx + x, cy + y, c);
  }
}
function ring(cx, cy, r, c, t = 1) {
  for (let a = 0; a < 360; a++) {
    const rad = (a * Math.PI) / 180;
    for (let k = 0; k < t; k++) {
      px(Math.round(cx + (r + k) * Math.cos(rad)), Math.round(cy + (r + k) * Math.sin(rad)), c);
    }
  }
}
function arc(cx, cy, r, a0, a1, c) {
  for (let a = a0; a <= a1; a += 1) {
    const rad = (a * Math.PI) / 180;
    px(Math.round(cx + r * Math.cos(rad)), Math.round(cy + r * Math.sin(rad)), c);
  }
}
function poly(points, c) {
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    line(a[0], a[1], b[0], b[1], c);
  }
}
function fillPoly(points, c) {
  // Scanline fill of a simple polygon.
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    minY = Math.min(minY, p[1]);
    maxY = Math.max(maxY, p[1]);
  }
  for (let y = minY; y <= maxY; y++) {
    const xs = [];
    for (let i = 0; i < points.length; i++) {
      const a = points[i];
      const b = points[(i + 1) % points.length];
      if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) {
        const t = (y - a[1]) / (b[1] - a[1]);
        xs.push(a[0] + t * (b[0] - a[0]));
      }
    }
    xs.sort((m, n) => m - n);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      for (let x = Math.ceil(xs[k]); x <= Math.floor(xs[k + 1]); x++) px(x, y, c);
    }
  }
}

// ---------------------------------------------------------------- 5x7 font
// Each glyph: 7 rows, each a 5-bit number (bit 4 = leftmost column).
const FONT = {
  A: [14, 17, 17, 31, 17, 17, 17],
  B: [30, 17, 17, 30, 17, 17, 30],
  C: [14, 17, 16, 16, 16, 17, 14],
  D: [30, 17, 17, 17, 17, 17, 30],
  E: [31, 16, 16, 30, 16, 16, 31],
  F: [31, 16, 16, 30, 16, 16, 16],
  G: [14, 17, 16, 23, 17, 17, 15],
  H: [17, 17, 17, 31, 17, 17, 17],
  I: [14, 4, 4, 4, 4, 4, 14],
  J: [7, 2, 2, 2, 2, 18, 12],
  K: [17, 18, 20, 24, 20, 18, 17],
  L: [16, 16, 16, 16, 16, 16, 31],
  M: [17, 27, 21, 21, 17, 17, 17],
  N: [17, 25, 21, 19, 17, 17, 17],
  O: [14, 17, 17, 17, 17, 17, 14],
  P: [30, 17, 17, 30, 16, 16, 16],
  Q: [14, 17, 17, 17, 21, 18, 13],
  R: [30, 17, 17, 30, 20, 18, 17],
  S: [15, 16, 16, 14, 1, 1, 30],
  T: [31, 4, 4, 4, 4, 4, 4],
  U: [17, 17, 17, 17, 17, 17, 14],
  V: [17, 17, 17, 17, 17, 10, 4],
  W: [17, 17, 17, 21, 21, 21, 10],
  X: [17, 17, 10, 4, 10, 17, 17],
  Y: [17, 17, 10, 4, 4, 4, 4],
  Z: [31, 1, 2, 4, 8, 16, 31],
  "0": [14, 17, 19, 21, 25, 17, 14],
  "1": [4, 12, 4, 4, 4, 4, 14],
  "2": [14, 17, 1, 6, 8, 16, 31],
  "3": [31, 2, 4, 2, 1, 17, 14],
  "4": [2, 6, 10, 18, 31, 2, 2],
  "5": [31, 16, 30, 1, 1, 17, 14],
  "6": [6, 8, 16, 30, 17, 17, 14],
  "7": [31, 1, 2, 4, 8, 8, 8],
  "8": [14, 17, 17, 14, 17, 17, 14],
  "9": [14, 17, 17, 15, 1, 2, 12],
  " ": [0, 0, 0, 0, 0, 0, 0],
  ".": [0, 0, 0, 0, 0, 12, 12],
  ",": [0, 0, 0, 0, 12, 4, 8],
  ":": [0, 12, 12, 0, 12, 12, 0],
  ";": [0, 12, 12, 0, 12, 4, 8],
  "!": [4, 4, 4, 4, 4, 0, 4],
  "?": [14, 17, 1, 2, 4, 0, 4],
  "-": [0, 0, 0, 31, 0, 0, 0],
  "'": [4, 4, 8, 0, 0, 0, 0],
  '"': [10, 10, 10, 0, 0, 0, 0],
  "(": [2, 4, 8, 8, 8, 4, 2],
  ")": [8, 4, 2, 2, 2, 4, 8],
  "/": [1, 1, 2, 4, 8, 16, 16],
  "%": [24, 25, 2, 4, 8, 19, 18],
  "+": [0, 4, 4, 31, 4, 4, 0],
  "&": [12, 18, 20, 8, 21, 18, 13],
  "=": [0, 0, 31, 0, 31, 0, 0],
  "*": [0, 4, 21, 14, 21, 4, 0],
  "#": [10, 10, 31, 10, 31, 10, 10],
  $: [4, 15, 20, 14, 5, 30, 4],
  "@": [14, 17, 23, 21, 23, 16, 14],
  "[": [14, 8, 8, 8, 8, 8, 14],
  "]": [14, 2, 2, 2, 2, 2, 14],
  _: [0, 0, 0, 0, 0, 0, 31],
  ">": [8, 4, 2, 1, 2, 4, 8],
  "<": [2, 4, 8, 16, 8, 4, 2],
  "\u2022": [0, 0, 4, 14, 14, 4, 0],
};
function glyph(ch) {
  return FONT[ch] ?? FONT["?"];
}
function textWidth(str, s) {
  return str.length * 6 * s - s;
}
function drawText(str, x, y, s, c) {
  // The bitmap font carries capitals only; render everything in caps.
  str = str.toUpperCase();
  let cx = x;
  for (const ch of str) {
    const g = glyph(ch);
    for (let r = 0; r < 7; r++) {
      for (let col = 0; col < 5; col++) {
        if (g[r] & (16 >> col)) rect(cx + col * s, y + r * s, s, s, c);
      }
    }
    cx += 6 * s;
  }
  return cx;
}
function centerText(str, cx, y, s, c) {
  drawText(str, Math.round(cx - textWidth(str, s) / 2), y, s, c);
}
function wrap(str, s, maxW) {
  const words = str.split(" ");
  const lines = [];
  let cur = "";
  for (const w of words) {
    const trial = cur ? cur + " " + w : w;
    if (textWidth(trial, s) <= maxW) {
      cur = trial;
    } else {
      if (cur) lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}
function para(str, x, y, s, c, maxW, lh) {
  const lines = wrap(str, s, maxW);
  lines.forEach((ln, i) => drawText(ln, x, y + i * lh, s, c));
  return y + lines.length * lh;
}

// ---------------------------------------------------------------- PNG encode
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
function crc32(data) {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, "ascii"), data])), 8 + data.length);
  return out;
}
function encodePNG() {
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0; // filter: none
    Buffer.from(buf.buffer, y * W * 3, W * 3).copy(raw, y * (1 + W * 3) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------- page
function drawPage() {
  fillAll(PAPER);
  // Double outer frame.
  box(10, 10, W - 20, H - 20, NAVY, 3);
  box(18, 18, W - 36, H - 36, NAVY, 1);

  // ---- masthead
  rect(18, 18, W - 36, 108, NAVY);
  centerText("THE WORLD", W / 2, 30, 8, WHITE);
  hline(48, 100, W - 96, GOLD);
  centerText("MONDAY 23 NOVEMBER 2026", W / 2, 106, 2, GOLD);
  drawText("ONE DAY", 44, 106, 2, hex("#9fb4d8"));
  const rightTag = "ONE IMAGE";
  drawText(rightTag, W - 44 - textWidth(rightTag, 2), 106, 2, hex("#9fb4d8"));

  // ---- lead story: COP31 collapse (y 140..436)
  const ly = 140;
  box(28, ly, 968, 296, INK, 2);
  rect(28, ly, 968, 34, RED);
  centerText("CLIMATE SUMMIT IN ANTALYA, TURKEY", W / 2, ly + 10, 2, WHITE);
  drawText("COP31", 52, ly + 52, 6, INK);
  drawText("COLLAPSES", 52, ly + 100, 6, INK);
  drawText("NO DEAL AFTER A RECORD RUN", 52, ly + 152, 2, RED);
  para(
    "The UN climate summit ends with no agreement at all, the longest talks in history, after the EU rejects a final text that never mentions fossil fuels. Negotiations now move to COP32 in Ethiopia.",
    52, ly + 184, 2, INK, 540, 20
  );
  // Globe with a crack, right side of the lead box.
  const gx = 800;
  const gy = ly + 150;
  disc(gx, gy, 96, BLUE);
  disc(gx - 34, gy - 30, 26, GREEN);
  disc(gx + 30, gy + 26, 30, GREEN);
  disc(gx + 42, gy - 44, 16, GREEN);
  arc(gx, gy, 96, 0, 359, hex("#9fc6e8"));
  arc(gx, gy, 62, 0, 359, hex("#9fc6e8"));
  vline(gx, gy - 96, 192, hex("#9fc6e8"));
  hline(gx - 96, gy, 192, hex("#9fc6e8"));
  // Jagged crack across the globe.
  thickLine(gx - 78, gy - 88, gx - 30, gy - 40, 5, BLACK);
  thickLine(gx - 30, gy - 40, gx - 52, gy + 6, 5, BLACK);
  thickLine(gx - 52, gy + 6, gx + 4, gy + 44, 5, BLACK);
  thickLine(gx + 4, gy + 44, gx - 8, gy + 92, 5, BLACK);
  // Red NO DEAL stamp.
  box(gx - 118, gy + 66, 236, 46, RED, 4);
  centerText("NO DEAL", gx, gy + 80, 3, RED);
}

// ---- row 2: Iran war (left) and Ukraine at sea (right), y 452..700
function storyBox(x, y, w, h, kicker, kickerColor) {
  box(x, y, w, h, INK, 2);
  rect(x, y, w, 30, NAVY);
  drawText(kicker, x + 14, y + 8, 2, WHITE);
  return { x, y, w, h };
}
function drawIran() {
  const b = storyBox(28, 452, 476, 248, "THE GULF  -  IRAN WAR", NAVY);
  drawText("IRAN HITS BAHRAIN", b.x + 16, b.y + 44, 3, INK);
  drawText("AND THE TANKERS", b.x + 16, b.y + 70, 3, RED);
  para(
    "Iranian missiles and drones hit a US base area and three tankers near the Strait of Hormuz. Trump vows to sink blockade runners and strike after the New Year if no deal.",
    b.x + 16, b.y + 102, 2, INK, b.w - 32, 18
  );
  // Sea strip with a tanker and missile arcs at the bottom of the box.
  const sy = b.y + b.h - 42;
  rect(b.x + 2, sy, b.w - 4, 40, SEA);
  // Tanker silhouette.
  rect(b.x + 40, sy + 12, 150, 16, INK);
  rect(b.x + 160, sy + 2, 26, 12, INK);
  rect(b.x + 128, sy - 4, 10, 18, RED);
  // Missile arcs and burst.
  thickLine(b.x + 330, sy + 38, b.x + 380, sy - 6, 3, ORANGE);
  thickLine(b.x + 380, sy - 6, b.x + 420, sy + 26, 3, ORANGE);
  disc(b.x + 380, sy - 6, 5, GOLD);
  disc(b.x + 420, sy + 26, 7, ORANGE);
  disc(b.x + 430, sy + 18, 4, GOLD);
  line(b.x + 300, sy + 30, b.x + 330, sy + 38, WHITE);
  line(b.x + 300, sy + 34, b.x + 330, sy + 38, WHITE);
}
function drawUkraine() {
  const b = storyBox(520, 452, 476, 248, "UKRAINE TAKES THE WAR TO SEA", NAVY);
  drawText("UKRAINE SINKS", b.x + 16, b.y + 44, 3, INK);
  drawText("WARSHIP OFF LIBYA", b.x + 16, b.y + 70, 3, RED);
  para(
    "Naval drones sink the corvette Merkury at Benghazi, Zelenskyy confirms. Russian strikes kill at least 11 in Dymer, near Kyiv.",
    b.x + 16, b.y + 102, 2, INK, b.w - 32, 18
  );
  // Sea strip: listing warship, smoke, drone above.
  const sy = b.y + b.h - 42;
  rect(b.x + 2, sy, b.w - 4, 40, SEA);
  fillPoly(
    [
      [b.x + 60, sy + 14],
      [b.x + 210, sy + 14],
      [b.x + 196, sy + 30],
      [b.x + 74, sy + 30],
    ],
    INK
  );
  rect(b.x + 110, sy + 2, 14, 14, INK);
  rect(b.x + 150, sy + 6, 10, 10, INK);
  // Smoke puffs, kept below the body text.
  disc(b.x + 125, sy + 2, 8, GREY);
  disc(b.x + 145, sy - 8, 10, GREY);
  disc(b.x + 168, sy - 18, 8, GREY);
  // Sea drone skimming the water.
  rect(b.x + 320, sy + 22, 34, 8, BLACK);
  disc(b.x + 322, sy + 20, 3, BLACK);
  disc(b.x + 352, sy + 20, 3, BLACK);
  line(b.x + 300, sy + 26, b.x + 320, sy + 26, WHITE);
  line(b.x + 354, sy + 26, b.x + 380, sy + 26, WHITE);
}

// ---- row 3: markets (left) and US House (right), y 716..920
function drawMarkets() {
  const b = storyBox(28, 716, 476, 204, "MARKETS  -  AI FEARS SPREAD", NAVY);
  drawText("ASIAN STOCKS", b.x + 16, b.y + 42, 3, INK);
  drawText("SLIDE; NVIDIA +27%", b.x + 16, b.y + 68, 3, GREEN);
  para(
    "Kospi falls 3.3% to its lowest close since January as AI doubts hit chip stocks. Nvidia reinstates Jensen Huang as CEO.",
    b.x + 16, b.y + 100, 2, INK, b.w - 32, 19
  );
  // Bottom strip: falling red bars, then a green rising arrow.
  const base = b.y + b.h - 6;
  const bars = [20, 16, 12, 8, 4];
  bars.forEach((hgt, i) => rect(b.x + 24 + i * 22, base - hgt, 14, hgt, RED));
  drawText("-3.3% KOSPI", b.x + 150, base - 20, 2, RED);
  thickLine(b.x + 300, base - 4, b.x + 350, base - 22, 4, GREEN);
  thickLine(b.x + 350, base - 22, b.x + 336, base - 18, 4, GREEN);
  thickLine(b.x + 350, base - 22, b.x + 346, base - 8, 4, GREEN);
  drawText("+27%", b.x + 360, base - 20, 2, GREEN);
}
function drawHouse() {
  const b = storyBox(520, 716, 476, 204, "WASHINGTON  -  MIDTERMS", NAVY);
  drawText("DEMOCRATS TAKE", b.x + 16, b.y + 42, 3, INK);
  drawText("BIGGEST HOUSE", b.x + 16, b.y + 68, 3, INK);
  drawText("MAJORITY SINCE 1992", b.x + 16, b.y + 94, 2, RED);
  para(
    "Chuck Hubbard wins a North Carolina recount, giving Democrats at least 258 House seats.",
    b.x + 16, b.y + 120, 2, INK, b.w - 32, 19
  );
  // Bottom strip: the seat count and a small Capitol dome.
  const base = b.y + b.h - 6;
  drawText("258 SEATS", b.x + 16, base - 22, 3, NAVY);
  const dx = b.x + 400;
  rect(dx - 42, base - 12, 84, 12, NAVY);
  for (let i = 0; i < 4; i++) rect(dx - 34 + i * 18, base - 26, 8, 14, NAVY);
  rect(dx - 38, base - 29, 76, 3, NAVY);
  disc(dx, base - 30, 16, NAVY);
  disc(dx, base - 40, 9, NAVY);
  vline(dx, base - 56, 8, NAVY);
  disc(dx, base - 58, 3, RED);
}

// ---- ticker + footer
function drawTicker() {
  const y = 936;
  rect(28, y, 968, 52, BLACK);
  drawText("ALSO TODAY", 44, y + 8, 2, GOLD);
  const items =
    "FBI probes hack of the national crime database  \u2022  Delta outage delays 2,000+ flights  \u2022  South Korea education minister quits over exam chaos  \u2022  Nigeria boat capsizes, 24 dead  \u2022  Webb telescope images Cassiopeia A  \u2022  Belgium national strike grounds flights";
  para(items, 44, y + 28, 1, WHITE, 936, 11);
  centerText(
    "SOURCES: AP  -  REUTERS  -  AFP  -  AL JAZEERA  -  CNBC  -  BBC",
    W / 2, 996, 1, GREY
  );
}

// ---------------------------------------------------------------- main
drawPage();
drawIran();
drawUkraine();
drawMarkets();
drawHouse();
drawTicker();

const dir = dirname(fileURLToPath(import.meta.url));
const png = encodePNG();
const outPath = process.env.DRAW_OUT ?? join(dir, "entry.png");
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, png);
console.log(`wrote ${png.length} bytes to ${outPath}`);
