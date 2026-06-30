import fs from 'fs';

function getPngDimensions(filePath) {
  const buffer = fs.readFileSync(filePath);
  // PNG header check
  if (buffer.readUInt32BE(0) !== 0x89504E47) {
    throw new Error("Not a valid PNG file");
  }
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  return { width, height };
}

try {
  const dims = getPngDimensions('/Volumes/G-Drive/chroma key pro/chromakey-pro_-vfx-unmixing-lab/src/assets/logo.png');
  console.log("PNG Logo dimensions:", dims);
  console.log("Aspect ratio:", dims.width / dims.height);
} catch (e) {
  console.error("Error reading logo:", e);
}
