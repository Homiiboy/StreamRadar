import { cp, mkdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');
const files = [
  'index.html',
  'styles.css',
  'original-overrides.js',
  'tmdb.js',
  'tvmaze.js',
  'app.js',
  'calendar.js',
  'stability.js',
  'polish.js',
  'desktop.js',
  'ui.js'
];

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
for (const file of files) {
  const target = resolve(dist, file);
  await mkdir(dirname(target), { recursive: true });
  await cp(resolve(root, file), target);
}

console.log(`StreamRadar desktop frontend packed: ${files.length} files -> dist/`);
