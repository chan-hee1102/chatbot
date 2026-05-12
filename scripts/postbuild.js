const fs = require('node:fs');
const path = require('node:path');

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return false;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const sp = path.join(src, entry.name);
    const dp = path.join(dest, entry.name);
    if (entry.isDirectory()) copyRecursive(sp, dp);
    else fs.copyFileSync(sp, dp);
  }
  return true;
}

const standaloneDir = path.join('.next', 'standalone');

if (!fs.existsSync(standaloneDir)) {
  console.log('[postbuild] no standalone output; skipping');
  process.exit(0);
}

const copiedPublic = copyRecursive('public', path.join(standaloneDir, 'public'));
const copiedStatic = copyRecursive(
  path.join('.next', 'static'),
  path.join(standaloneDir, '.next', 'static')
);

console.log(
  `[postbuild] standalone assets ready (public=${copiedPublic}, static=${copiedStatic})`
);
