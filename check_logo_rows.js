import fs from 'fs';
import zlib from 'zlib';

function analyzeRows(filePath) {
  const buffer = fs.readFileSync(filePath);
  let offset = 8;
  let width = 0;
  let height = 0;
  let idatBuffers = [];

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
    } else if (type === 'IDAT') {
      idatBuffers.push(data);
    } else if (type === 'IEND') {
      break;
    }
    offset += 12 + length;
  }

  const compressed = Buffer.concat(idatBuffers);
  const inflated = zlib.inflateSync(compressed);
  const bytesPerPixel = 4;
  const scanlineLength = 1 + width * bytesPerPixel;
  
  console.log("Row-by-Row Active Pixel Counts (out of 800):");
  let activeRows = [];
  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    let activePixels = 0;
    for (let x = 0; x < width; x++) {
      const alpha = inflated[rowOffset + 1 + x * bytesPerPixel + 3];
      if (alpha > 10) {
        activePixels++;
      }
    }
    if (activePixels > 0) {
      activeRows.push({ y, count: activePixels });
    }
  }

  // Print summary of contiguous blocks
  let blocks = [];
  let currentBlock = null;
  for (const row of activeRows) {
    if (!currentBlock) {
      currentBlock = { start: row.y, end: row.y, maxCount: row.count };
    } else if (row.y === currentBlock.end + 1) {
      currentBlock.end = row.y;
      if (row.count > currentBlock.maxCount) currentBlock.maxCount = row.count;
    } else {
      blocks.push(currentBlock);
      currentBlock = { start: row.y, end: row.y, maxCount: row.count };
    }
  }
  if (currentBlock) blocks.push(currentBlock);

  blocks.forEach((b, i) => {
    console.log(`Block ${i + 1}: Rows ${b.start}-${b.end} (${(b.start/height*100).toFixed(1)}% to ${(b.end/height*100).toFixed(1)}%), Max width: ${b.maxCount}px`);
  });
}

try {
  analyzeRows('/Volumes/G-Drive/chroma key pro/chromakey-pro_-vfx-unmixing-lab/src/assets/logo.png');
} catch (e) {
  console.error(e);
}
