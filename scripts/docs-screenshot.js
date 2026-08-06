import { createReadStream, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, extname, join, normalize, sep } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { buildSite } from './docs-build.js';

const scriptsDirectory = dirname(fileURLToPath(import.meta.url));
const projectDirectory = join(scriptsDirectory, '..');
const outputDirectory = normalize(join(projectDirectory, 'docs'));
const previewPath = join(projectDirectory, 'docs-src', 'social-preview.png');

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

const browserCandidates = [
  process.env.CHROME_BIN,
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean);

const browserPath = browserCandidates.find(existsSync);

if (!browserPath) {
  throw new Error('Chrome or Chromium is required to generate social-preview.png.');
}

const server = createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const requestedPath = pathname === '/' ? '/index.html' : pathname;
  const filePath = normalize(join(outputDirectory, requestedPath));

  if (filePath !== outputDirectory && !filePath.startsWith(`${outputDirectory}${sep}`)) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }

  try {
    const file = await stat(filePath);

    if (!file.isFile()) {
      throw new Error('Not a file');
    }

    response.writeHead(200, {
      'Cache-Control': 'no-store',
      'Content-Type': contentTypes[extname(filePath)] ?? 'application/octet-stream',
    });
    createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
  }
});

const listen = () => new Promise((resolve, reject) => {
  server.once('error', reject);
  server.listen(0, '127.0.0.1', resolve);
});

const close = () => new Promise((resolve, reject) => {
  server.close(error => error ? reject(error) : resolve());
});

const runBrowser = (url, profileDirectory) => new Promise((resolve, reject) => {
  const browser = spawn(browserPath, [
    '--headless',
    '--disable-background-networking',
    '--disable-component-update',
    '--disable-extensions',
    '--disable-gpu',
    '--disable-sync',
    '--force-device-scale-factor=1',
    '--hide-scrollbars',
    '--no-default-browser-check',
    '--no-first-run',
    `--screenshot=${previewPath}`,
    `--user-data-dir=${profileDirectory}`,
    '--virtual-time-budget=5000',
    '--window-size=1200,630',
    url,
  ], {
    stdio: ['ignore', 'ignore', 'inherit'],
  });

  browser.once('error', reject);
  browser.once('exit', code => {
    if (code === 0) {
      resolve();
    } else {
      reject(new Error(`Screenshot browser exited with status ${code}.`));
    }
  });
});

const profileDirectory = mkdtempSync(join(tmpdir(), 'east8th-social-preview-'));

try {
  buildSite();
  await listen();

  const { port } = server.address();
  await runBrowser(`http://127.0.0.1:${port}/`, profileDirectory);
  await close();

  buildSite();
  console.log(`Updated social preview at ${previewPath}`);
} finally {
  if (server.listening) {
    await close();
  }

  rmSync(profileDirectory, { force: true, recursive: true });
}
