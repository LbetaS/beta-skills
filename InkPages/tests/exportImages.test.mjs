import assert from 'node:assert/strict';
import { test } from 'node:test';

import { exportCanvasesToDirectory } from '../src/exportImages.js';

function createCanvas(label) {
  return {
    toBlob(callback, type) {
      callback({ label, type });
    },
  };
}

test('exportCanvasesToDirectory saves every page after one folder selection', async () => {
  const calls = [];
  const progress = [];
  const directory = {
    async getFileHandle(filename, options) {
      calls.push(['file', filename, options.create]);
      return {
        async createWritable() {
          return {
            async write(blob) {
              calls.push(['write', filename, blob.label, blob.type]);
            },
            async close() {
              calls.push(['close', filename]);
            },
          };
        },
      };
    },
  };
  let pickerCalls = 0;

  const result = await exportCanvasesToDirectory(
    [createCanvas('page-1'), createCanvas('page-2'), createCanvas('page-3')],
    {
      showDirectoryPicker: async () => {
        pickerCalls += 1;
        return directory;
      },
      onProgress: (completed, total) => progress.push([completed, total]),
    },
  );

  assert.equal(pickerCalls, 1);
  assert.equal(result.count, 3);
  assert.deepEqual(
    calls.filter(([type]) => type === 'file').map(([, filename]) => filename),
    ['xiaohongshu-page-01.png', 'xiaohongshu-page-02.png', 'xiaohongshu-page-03.png'],
  );
  assert.deepEqual(progress, [
    [0, 3],
    [1, 3],
    [2, 3],
    [3, 3],
  ]);
});

test('exportCanvasesToDirectory rejects when a canvas cannot create a PNG', async () => {
  const canvas = {
    toBlob(callback) {
      callback(null);
    },
  };

  await assert.rejects(
    () =>
      exportCanvasesToDirectory([canvas], {
        showDirectoryPicker: async () => ({
          async getFileHandle() {
            throw new Error('should not write a file');
          },
        }),
      }),
    /第 1 页生成失败/,
  );
});
