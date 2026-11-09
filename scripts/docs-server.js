import { createReadStream, readFileSync, watch } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildSite } from './docs-build.js';
import { generateSocialPreview } from './docs-social-preview.js';
import { dimensions } from '../docs-src/renovation/dimensions.js';
import { buildRenovation } from '../docs-src/renovation/build.js';
import { generateEditorHtml } from '../docs-src/renovation/editor/page.js';
import { itemsRevision, readItems, writeItems } from '../docs-src/renovation/items-file.js';
import { downloadLinks } from '../docs-src/renovation/downloads.js';

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
  '.map': 'application/json; charset=utf-8',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

buildSite();

// Local-only editor for the renovation items. It is never part of the built
// site; saving rewrites docs-src/renovation/items.js, and pushing that is the
// deploy.
const editorDirectory = join(sourceDirectory, 'renovation', 'editor');
const editorFiles = { 'editor.js': '.js', 'editor.css': '.css' };

function sendJson(response, status, body) {
  response.writeHead(status, {
    'Cache-Control': 'no-store',
    'Content-Type': contentTypes['.json'],
  });
  response.end(JSON.stringify(body));
}

async function readJsonBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 1_000_000) throw new Error('Request body too large');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

async function handleRenovationEditor(request, response, pathname) {
  const origin = request.headers.origin;
  if (origin && new URL(origin).host !== request.headers.host) {
    sendJson(response, 403, { errors: ['Cross-origin requests are not allowed'] });
    return;
  }

  if (pathname === '/renovation/api/items') {
    if (request.method === 'GET') {
      const items = await readItems();
      sendJson(response, 200, { items, dimensions, downloads: downloadLinks(items), revision: itemsRevision() });
      return;
    }
    if (request.method === 'PUT') {
      let body;
      try {
        body = await readJsonBody(request);
      } catch (error) {
        sendJson(response, 400, { errors: [error.message] });
        return;
      }
      if (!Array.isArray(body?.items)) {
        sendJson(response, 400, { errors: ['Expected { items: [...] }'] });
        return;
      }
      if (body.revision !== itemsRevision()) {
        sendJson(response, 409, {
          errors: ['items.js changed on disk since the editor loaded it. Reload the editor to get the latest items, then make your changes again.'],
        });
        return;
      }
      try {
        const items = writeItems(body.items);
        buildRenovation(sourceDirectory, outputDirectory, items);
        sendJson(response, 200, { items, revision: itemsRevision() });
      } catch (error) {
        sendJson(response, 400, { errors: error.errors ?? [error.message] });
      }
      return;
    }
    response.writeHead(405, { Allow: 'GET, PUT' });
    response.end();
    return;
  }

  if (pathname === '/renovation/edit') {
    response.writeHead(308, { Location: '/renovation/edit/' });
    response.end();
    return;
  }
  if (pathname === '/renovation/edit/') {
    response.writeHead(200, {
      'Cache-Control': 'no-store',
      'Content-Type': contentTypes['.html'],
    });
    response.end(generateEditorHtml());
    return;
  }
  const file = pathname.slice('/renovation/edit/'.length);
  if (Object.hasOwn(editorFiles, file)) {
    response.writeHead(200, {
      'Cache-Control': 'no-store',
      'Content-Type': contentTypes[editorFiles[file]],
    });
    createReadStream(join(editorDirectory, file)).pipe(response);
    return;
  }
  response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  response.end('Not found');
}

let rebuildTimer;
const scheduleBuild = () => {
  clearTimeout(rebuildTimer);
  rebuildTimer = setTimeout(buildSite, 50);
};
const assetWatchers = ['favicon.svg', 'social-preview.png', 'styles.css']
  .map(file => watch(join(sourceDirectory, file), scheduleBuild));
assetWatchers.push(watch(join(sourceDirectory, 'renovation'), scheduleBuild));

const server = createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);

  if (pathname === '/__social-preview') {
    const pageHtml = readFileSync(join(outputDirectory, 'index.html'), 'utf8');
    response.writeHead(200, {
      'Cache-Control': 'no-store',
      'Content-Type': 'text/html; charset=utf-8',
    });
    response.end(generateSocialPreview(pageHtml));
    return;
  }

  if (pathname === '/renovation/api/items' || pathname.startsWith('/renovation/edit')) {
    await handleRenovationEditor(request, response, pathname);
    return;
  }

  if (pathname === '/favicon.ico') {
    response.writeHead(307, {
      'Cache-Control': 'no-store',
      Location: '/favicon.svg',
    });
    response.end();
    return;
  }

  const requestedPath = pathname.endsWith('/') ? `${pathname}index.html` : pathname;
  const filePath = normalize(join(outputDirectory, requestedPath));

  if (filePath !== outputDirectory && !filePath.startsWith(`${outputDirectory}${sep}`)) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }

  try {
    const file = await stat(filePath);

    if (file.isDirectory() && !pathname.endsWith('/')) {
      const redirectUrl = new URL(request.url, 'http://localhost');
      redirectUrl.pathname += '/';
      response.writeHead(308, {
        'Cache-Control': 'no-store',
        Location: `${redirectUrl.pathname}${redirectUrl.search}`,
      });
      response.end();
      return;
    }

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
  console.log(`Serving removation at http://${hostname}:${port}/renovation`);
  console.log(`Preview Messages card at http://${hostname}:${port}/__social-preview`);
});

server.on('close', () => {
  clearTimeout(rebuildTimer);
  assetWatchers.forEach(watcher => watcher.close());
});
