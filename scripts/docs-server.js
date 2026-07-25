import { createReadStream, watch } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildSite } from './docs-build.js';

const scriptsDirectory = dirname(fileURLToPath(import.meta.url));
const projectDirectory = join(scriptsDirectory, '..');
const sourceDirectory = join(projectDirectory, 'docs-src');
const outputDirectory = normalize(join(projectDirectory, 'docs'));
const hostname = process.env.HOST ?? '127.0.0.1';
const port = Number.parseInt(process.env.PORT ?? '4000', 10);

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

buildSite();

let rebuildTimer;
const stylesheetWatcher = watch(join(sourceDirectory, 'styles.css'), () => {
  clearTimeout(rebuildTimer);
  rebuildTimer = setTimeout(buildSite, 50);
});

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

server.listen(port, hostname, () => {
  console.log(`Serving east8th.nyc at http://${hostname}:${port}`);
});

server.on('close', () => {
  clearTimeout(rebuildTimer);
  stylesheetWatcher.close();
});
