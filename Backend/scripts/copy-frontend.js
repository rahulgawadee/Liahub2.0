const fs = require('fs');
const path = require('path');

const rootDist = path.join(__dirname, '..', '..', 'dist');
const backendDist = path.join(__dirname, '..', 'dist');

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return false;
  if (fs.lstatSync(src).isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const item of fs.readdirSync(src)) {
      copyRecursive(path.join(src, item), path.join(dest, item));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
  return true;
}

try {
  if (!fs.existsSync(rootDist)) {
    console.log('No frontend build found at', rootDist);
    process.exit(0);
  }

  // Remove existing backend dist if exists
  if (fs.existsSync(backendDist)) {
    fs.rmSync(backendDist, { recursive: true, force: true });
  }

  copyRecursive(rootDist, backendDist);
  console.log('Copied frontend dist to backend/dist');
} catch (err) {
  console.error('Failed to copy frontend dist:', err);
  process.exit(1);
}
