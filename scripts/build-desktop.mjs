import { cp, mkdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');
const files = [
  'index.html',
  'styles.css',
  'v003.css',
  'v004.css',
  'v005.css',
  'v006.css',
  'v007.css',
  'v008.css',
  'v009.css',
  'v0010.css',
  'v0100.css',
  'v011.css',
  'original-overrides.js',
  'tmdb.js',
  'tvmaze.js',
  'app.js',
  'calendar.js',
  'stability.js',
  'polish.js',
  'desktop.js',
  'ui011.js'
];

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
for (const file of files) {
  await cp(resolve(root, file), resolve(dist, file));
}

console.log(`StreamRadar desktop frontend packed: ${files.length} files -> dist/`);
