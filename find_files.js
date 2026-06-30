import fs from 'fs';
import path from 'path';

const searchDirs = [
  '/Volumes/G-Drive/chroma key pro/chromakey-pro_-vfx-unmixing-lab',
  '/Users/alesiastowers/.gemini/antigravity/brain/240678d3-c1dc-4747-bc24-aff74a99d2e1'
];

const now = Date.now();
const twoHoursAgo = now - 2 * 60 * 60 * 1000;

function scanDir(dir) {
  let files;
  try {
    files = fs.readdirSync(dir);
  } catch (e) {
    return;
  }
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    let stat;
    try {
      stat = fs.statSync(fullPath);
    } catch (e) {
      continue;
    }
    
    if (stat.isDirectory()) {
      if (file !== '.system_generated' && file !== 'node_modules') {
        scanDir(fullPath);
      }
    } else {
      // Check if file was modified recently or is an image
      const isRecent = stat.mtimeMs > twoHoursAgo;
      const isImage = file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.svg');
      
      if (isRecent || isImage) {
        console.log(`Path: ${fullPath}`);
        console.log(`  Size: ${stat.size} bytes`);
        console.log(`  Modified: ${stat.mtime.toISOString()} (${Math.round((now - stat.mtimeMs) / 60000)} mins ago)`);
      }
    }
  }
}

for (const dir of searchDirs) {
  console.log(`Scanning: ${dir}`);
  scanDir(dir);
}
