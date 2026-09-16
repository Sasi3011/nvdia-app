import fs from "fs";
import path from "path";

// Minimal valid 16x16 32-bit RGBA BMP/ICO format
function createSimpleIco() {
  const width = 16;
  const height = 16;
  const bpp = 32;
  const imageSize = 40 + (width * height * 4) + (width * height / 8); // BMP header + RGBA pixels + AND mask
  
  const buffer = Buffer.alloc(6 + 16 + imageSize);
  
  // ICONDIR
  buffer.writeUInt16LE(0, 0); // Reserved
  buffer.writeUInt16LE(1, 2); // Type 1 = ICO
  buffer.writeUInt16LE(1, 4); // 1 Image
  
  // ICONDIRENTRY
  buffer.writeUInt8(width, 6);        // Width
  buffer.writeUInt8(height, 7);       // Height
  buffer.writeUInt8(0, 8);            // Colors in palette
  buffer.writeUInt8(0, 9);            // Reserved
  buffer.writeUInt16LE(1, 10);        // Color planes
  buffer.writeUInt16LE(bpp, 12);      // Bits per pixel
  buffer.writeUInt32LE(imageSize, 14); // Image size
  buffer.writeUInt32LE(22, 18);        // Image offset
  
  // BITMAPINFOHEADER
  let offset = 22;
  buffer.writeUInt32LE(40, offset); offset += 4;         // Header size
  buffer.writeInt32LE(width, offset); offset += 4;       // Width
  buffer.writeInt32LE(height * 2, offset); offset += 4;   // Height (doubled for mask in ICO)
  buffer.writeUInt16LE(1, offset); offset += 2;          // Color planes
  buffer.writeUInt16LE(bpp, offset); offset += 2;        // Bits per pixel
  buffer.writeUInt32LE(0, offset); offset += 4;          // Compression (BI_RGB)
  buffer.writeUInt32LE(width * height * 4, offset); offset += 4; // Raw data size
  buffer.writeInt32LE(0, offset); offset += 4;           // H-res
  buffer.writeInt32LE(0, offset); offset += 4;           // V-res
  buffer.writeUInt32LE(0, offset); offset += 4;          // Colors
  buffer.writeUInt32LE(0, offset); offset += 4;          // Important colors
  
  // Pixel data (BGRA, bottom-to-top)
  // NVIDIA green: R=118 (0x76), G=185 (0xb9), B=0 (0x00), A=255 (0xff)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      buffer.writeUInt8(0x00, offset);     // B
      buffer.writeUInt8(0xb9, offset + 1); // G
      buffer.writeUInt8(0x76, offset + 2); // R
      buffer.writeUInt8(0xff, offset + 3); // A
      offset += 4;
    }
  }
  
  // AND mask (all 0 for opaque)
  buffer.fill(0, offset);
  
  return buffer;
}

const icoBuffer = createSimpleIco();
const targetPath = path.resolve("apps/web/public/favicon.ico");
fs.writeFileSync(targetPath, icoBuffer);
console.log("Successfully created valid favicon.ico at", targetPath);
