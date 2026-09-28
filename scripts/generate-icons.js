import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

function createPNG(width, height, drawPixel) {
  // PNG signature
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth 8
  ihdrData.writeUInt8(6, 9); // RGBA color type
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace

  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Raw image data with filter byte (0) before each row
  const rowBytes = width * 4;
  const rawData = Buffer.alloc(height * (rowBytes + 1));

  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawPixel(x, y, width, height);
      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = data.length;
  const buffer = Buffer.alloc(8 + length + 4);
  buffer.writeUInt32BE(length, 0);
  buffer.write(type, 4, 4, 'ascii');
  data.copy(buffer, 8);

  const crc = crc32(buffer.subarray(4, 8 + length));
  buffer.writeInt32BE(crc, 8 + length);
  return buffer;
}

// Standard CRC32 table
const crcTable = new Int32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return crc ^ -1;
}

// Pixel drawing function for Finance Tracker App Icon
function renderFinanceIcon(x, y, w, h, isMaskable = false) {
  const nx = x / w;
  const ny = y / h;

  // Background gradient: #2563eb (37, 99, 235) to #1e3a8a (30, 58, 138)
  const gradT = (nx + ny) / 2;
  let bgR = Math.round(37 + (30 - 37) * gradT);
  let bgG = Math.round(99 + (58 - 99) * gradT);
  let bgB = Math.round(235 + (138 - 235) * gradT);

  // If not maskable, give nice rounded corners
  if (!isMaskable) {
    const cornerRadius = 0.22; // 22% corner radius
    const dx = Math.max(Math.abs(nx - 0.5) - (0.5 - cornerRadius), 0);
    const dy = Math.max(Math.abs(ny - 0.5) - (0.5 - cornerRadius), 0);
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > cornerRadius) {
      return [0, 0, 0, 0]; // Transparent outer edge
    }
  }

  // Draw Card shape in center (safe zone)
  const cx = 0.5;
  const cy = 0.52;
  const cardW = 0.68;
  const cardH = 0.44;
  const cardR = 0.08;

  const inCardX = Math.abs(nx - cx) - (cardW / 2 - cardR);
  const inCardY = Math.abs(ny - cy) - (cardH / 2 - cardR);
  const cardDist = Math.sqrt(Math.max(inCardX, 0) ** 2 + Math.max(inCardY, 0) ** 2);

  if (cardDist <= cardR) {
    // Card face
    if (ny < cy - 0.05) {
      // Top strip
      return [255, 255, 255, 255];
    } else if (ny > cy + 0.08 && ny < cy + 0.12 && nx > cx - 0.25 && nx < cx + 0.05) {
      // Card mock numbers
      return [30, 41, 59, 255];
    } else if (nx > cx + 0.12 && nx < cx + 0.24 && ny > cy + 0.06 && ny < cy + 0.14) {
      // Chip / circle logo
      return [239, 68, 68, 255];
    } else {
      // Soft clean white/slate card
      return [248, 250, 252, 255];
    }
  }

  // Coin indicator on top-right of card
  const coinX = 0.72;
  const coinY = 0.32;
  const coinR = 0.11;
  const coinDist = Math.sqrt((nx - coinX) ** 2 + (ny - coinY) ** 2);
  if (coinDist <= coinR) {
    if (coinDist > coinR - 0.02) {
      return [255, 255, 255, 255]; // White border
    }
    // Green emerald coin
    return [16, 185, 129, 255];
  }

  return [bgR, bgG, bgB, 255];
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate assets
console.log('Generating pwa-192x192.png...');
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPNG(192, 192, (x, y, w, h) => renderFinanceIcon(x, y, w, h, false)));

console.log('Generating pwa-512x512.png...');
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPNG(512, 512, (x, y, w, h) => renderFinanceIcon(x, y, w, h, false)));

console.log('Generating pwa-maskable-512x512.png...');
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPNG(512, 512, (x, y, w, h) => renderFinanceIcon(x, y, w, h, true)));

console.log('Generating apple-touch-icon.png (180x180)...');
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPNG(180, 180, (x, y, w, h) => renderFinanceIcon(x, y, w, h, false)));

console.log('PWA icon generation complete!');
