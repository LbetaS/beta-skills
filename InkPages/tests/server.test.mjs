import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdir, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { test } from 'node:test';

import { createStaticServer, getContentType, resolveRequestPath } from '../server.mjs';

test('resolveRequestPath resolves the app entry inside the project root', () => {
  const root = resolve('fixture-root');

  assert.equal(resolveRequestPath(root, '/'), join(root, 'index.html'));
  assert.equal(resolveRequestPath(root, '/src/app.js'), join(root, 'src', 'app.js'));
});

test('resolveRequestPath blocks parent-directory traversal attempts', () => {
  const root = resolve('fixture-root');

  assert.equal(resolveRequestPath(root, '/../package.json'), null);
  assert.equal(resolveRequestPath(root, '/src/../server.mjs'), null);
});

test('getContentType serves local font files with a font MIME type', () => {
  assert.equal(getContentType('assets/fonts/NotoSerifSC-VF.ttf'), 'font/ttf');
});

test('createStaticServer returns 404 for directories without index files', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'graphic-layout-server-'));
  await mkdir(join(root, 'empty'));
  const server = createStaticServer(root);
  server.listen(0, '127.0.0.1');
  t.after(() => server.close());
  await once(server, 'listening');

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/empty/`, {
    signal: AbortSignal.timeout(1000),
  });

  assert.equal(response.status, 404);
});

test('createStaticServer disables browser caching for development files', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'graphic-layout-server-'));
  await mkdir(join(root, 'src'));
  await import('node:fs/promises').then(({ writeFile }) => writeFile(join(root, 'src', 'app.js'), 'export {};'));
  const server = createStaticServer(root);
  server.listen(0, '127.0.0.1');
  t.after(() => server.close());
  await once(server, 'listening');

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/src/app.js`);

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
});
