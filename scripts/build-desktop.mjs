import { cp, mkdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');
const files = [
  'index.html',
  'styles.css',
  'themes.css',
  'js/original-overrides.js',
  'js/tmdb.js',
  'js/tvmaze.js',
  'js/app.js',
  'js/calendar.js',
  'js/stability.js',
  'js/polish.js',
  'js/desktop.js',
  'js/ui.js',
  'js/catalog.js',
  'js/themes.js'
];

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
for (const file of files) {
  const target = resolve(dist, file);
  await mkdir(dirname(target), { recursive: true });
  await cp(resolve(root, file), target);
}

console.log(`StreamRadar desktop frontend packed: ${files.length} files -> dist/`);
