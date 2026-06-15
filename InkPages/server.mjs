import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const port = Number(process.env.PORT || 4174);

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
};

function isInsideRoot(root, filePath) {
  const resolvedRoot = resolve(root);
  const resolvedFile = resolve(filePath);
  return resolvedFile === resolvedRoot || resolvedFile.startsWith(`${resolvedRoot}${sep}`);
}

export function resolveRequestPath(root, pathname) {
  const segments = String(pathname)
    .replaceAll('\\', '/')
    .split('/')
    .filter(Boolean);

  if (segments.some((segment) => segment === '..')) return null;

  const filePath = resolve(root, ...(segments.length ? segments : ['index.html']));
  return isInsideRoot(root, filePath) ? filePath : null;
}

export function getContentType(filePath) {
  return types[extname(filePath).toLowerCase()] || 'application/octet-stream';
}

export function createStaticServer(root = process.cwd()) {
  return createServer(async (request, response) => {
    const url = new URL(request.url || '/', `http://${request.headers.host}`);
    let pathname = url.pathname;

    try {
      pathname = decodeURIComponent(pathname);
    } catch {
      response.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('Bad request');
      return;
    }

    let filePath = resolveRequestPath(root, pathname);
    if (!filePath) {
      response.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('Forbidden');
      return;
    }

    try {
      let fileStat = await stat(filePath);
      if (fileStat.isDirectory()) {
        filePath = resolve(filePath, 'index.html');
        if (!isInsideRoot(root, filePath)) throw new Error('Directory index outside root');
        fileStat = await stat(filePath);
      }
      if (!fileStat.isFile()) throw new Error('Not a file');

      response.writeHead(200, {
        'content-type': getContentType(filePath),
        'cache-control': 'no-store',
      });
      createReadStream(filePath)
        .on('error', () => {
          response.destroy();
        })
        .pipe(response);
    } catch {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('Not found');
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  createStaticServer().listen(port, () => {
    console.log(`http://localhost:${port}`);
  });
}
