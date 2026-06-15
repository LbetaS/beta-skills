import assert from 'node:assert/strict';
import { test } from 'node:test';

import { readDraft, writeDraft } from '../src/draftStorage.js';

test('readDraft returns the fallback when browser storage is unavailable', () => {
  const storage = {
    getItem() {
      throw new Error('storage blocked');
    },
  };

  assert.equal(readDraft(storage, 'draft', 'sample'), 'sample');
});

test('writeDraft reports failure without throwing when storage is full', () => {
  const storage = {
    setItem() {
      throw new Error('quota exceeded');
    },
  };

  assert.equal(writeDraft(storage, 'draft', 'content'), false);
});

test('readDraft and writeDraft use available storage normally', () => {
  const values = new Map();
  const storage = {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
  };

  assert.equal(writeDraft(storage, 'draft', 'content'), true);
  assert.equal(readDraft(storage, 'draft', 'sample'), 'content');
});
