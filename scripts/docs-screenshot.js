import { createReadStream, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { copyFile, readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, extname, join, normalize, sep } from 'node:path';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
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

const waitForScreenshot = async screenshotPath => {
  const timeoutAt = Date.now() + 30_000;

  while (Date.now() < timeoutAt) {
    try {
      const screenshot = await readFile(screenshotPath);
      const chunkType = screenshot.subarray(-8, -4).toString('ascii');

      if (chunkType === 'IEND') {
        return;
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }

    await delay(100);
  }

  throw new Error('Chrome did not generate the social preview within 30 seconds.');
};

const runBrowser = async (url, profileDirectory) => {
  const screenshotPath = join(profileDirectory, 'social-preview.png');
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
    `--screenshot=${screenshotPath}`,
    `--user-data-dir=${profileDirectory}`,
    '--virtual-time-budget=5000',
    '--window-size=1200,630',
    url,
  ], {
    stdio: ['ignore', 'ignore', 'inherit'],
  });

  let screenshotReady = false;
  let forceKillTimer;
  const browserExit = new Promise((resolve, reject) => {
    browser.once('error', reject);
    browser.once('exit', (code, signal) => {
      clearTimeout(forceKillTimer);

      if (code === 0 || (screenshotReady && signal)) {
        resolve();
      } else {
        reject(new Error(`Screenshot browser exited with status ${code ?? signal}.`));
      }
    });
  });

  const screenshotComplete = waitForScreenshot(screenshotPath).then(() => {
    screenshotReady = true;

    if (browser.exitCode === null && browser.signalCode === null) {
      browser.kill('SIGTERM');
      forceKillTimer = setTimeout(() => browser.kill('SIGKILL'), 1_000);
    }
  });

  try {
    await Promise.all([browserExit, screenshotComplete]);
    await copyFile(screenshotPath, previewPath);
  } finally {
    clearTimeout(forceKillTimer);

    if (browser.exitCode === null && browser.signalCode === null) {
      browser.kill('SIGKILL');
    }
  }
};

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
