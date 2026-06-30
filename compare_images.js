import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const dirPath = '/Users/alesiastowers/.gemini/antigravity/brain/240678d3-c1dc-4747-bc24-aff74a99d2e1';

function getHash(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(content).digest('hex');
}

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      if (file !== '.system_generated') {
        scanDir(fullPath);
      }
    } else if (file.endsWith('.png') || file.endsWith('.jpg')) {
      const hash = getHash(fullPath);
      console.log(`File: ${path.relative(dirPath, fullPath)}`);
      console.log(`  Size: ${stat.size} bytes`);
      console.log(`  MD5: ${hash}`);
      console.log(`  Modified: ${stat.mtime.toISOString()}`);
    }
  }
}

console.log("Scanning images in:", dirPath);
scanDir(dirPath);
