import { spawnSync } from 'node:child_process';

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';

if (process.env.CI) {
  console.log('StreamRadar CI: installing Playwright Chromium and system dependencies...');
  run(npx, ['playwright', 'install', '--with-deps', 'chromium']);
}

run(npx, ['playwright', 'test', '--config=tests/playwright.config.js']);
