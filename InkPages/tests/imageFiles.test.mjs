import assert from 'node:assert/strict';
import { test } from 'node:test';

import { loadImageFile, loadRetainedImageFile } from '../src/imageFiles.js';

function createUrlRecorder() {
  const calls = [];
  return {
    calls,
    urlApi: {
      createObjectURL(file) {
        calls.push(['create', file.name]);
        return `blob:${file.name}`;
      },
      revokeObjectURL(url) {
        calls.push(['revoke', url]);
      },
    },
  };
}

test('loadImageFile revokes the temporary object URL after a successful load', async () => {
  const { calls, urlApi } = createUrlRecorder();
  const image = {
    naturalWidth: 640,
    naturalHeight: 360,
    width: 640,
    height: 360,
    set src(value) {
      this.currentSrc = value;
      queueMicrotask(() => this.onload());
    },
    get src() {
      return this.currentSrc;
    },
  };

  const result = await loadImageFile(
    { name: 'cover.png' },
    {
      createImage: () => image,
      urlApi,
    },
  );

  assert.deepEqual(
    {
      image: result.image,
      width: result.width,
      height: result.height,
      name: result.name,
    },
    {
      image,
      width: 640,
      height: 360,
      name: 'cover.png',
    },
  );
  assert.deepEqual(calls, [
    ['create', 'cover.png'],
    ['revoke', 'blob:cover.png'],
  ]);
});

test('loadImageFile revokes the temporary object URL after a failed load', async () => {
  const { calls, urlApi } = createUrlRecorder();
  const image = {
    set src(value) {
      this.currentSrc = value;
      queueMicrotask(() => this.onerror(new Error('decode failed')));
    },
    get src() {
      return this.currentSrc;
    },
  };

  await assert.rejects(
    () =>
      loadImageFile(
        { name: 'broken.png' },
        {
          createImage: () => image,
          urlApi,
        },
      ),
    /无法读取图片：broken\.png/,
  );
  assert.deepEqual(calls, [
    ['create', 'broken.png'],
    ['revoke', 'blob:broken.png'],
  ]);
});

test('loadRetainedImageFile keeps the object URL until the caller releases it', async () => {
  const { calls, urlApi } = createUrlRecorder();
  const image = {
    naturalWidth: 320,
    naturalHeight: 320,
    set src(value) {
      this.currentSrc = value;
      queueMicrotask(() => this.onload());
    },
    get src() {
      return this.currentSrc;
    },
  };

  const result = await loadRetainedImageFile(
    { name: 'avatar.png' },
    {
      createImage: () => image,
      urlApi,
    },
  );

  assert.deepEqual(calls, [['create', 'avatar.png']]);
  result.release();
  assert.deepEqual(calls, [
    ['create', 'avatar.png'],
    ['revoke', 'blob:avatar.png'],
  ]);
});
