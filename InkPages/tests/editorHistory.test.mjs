import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEditorHistory } from '../src/editorHistory.js';

test('editor history restores the previous value and selection', () => {
  const history = createEditorHistory({
    value: '第一段',
    selectionStart: 3,
    selectionEnd: 3,
  });

  history.record({
    value: '第一段\n第二段',
    selectionStart: 7,
    selectionEnd: 7,
  });

  assert.equal(history.canUndo(), true);
  assert.deepEqual(history.undo(), {
    value: '第一段',
    selectionStart: 3,
    selectionEnd: 3,
  });
  assert.equal(history.canUndo(), false);
});

test('editor history merges consecutive records from the same typing group', () => {
  const history = createEditorHistory({
    value: '',
    selectionStart: 0,
    selectionEnd: 0,
  });

  history.record({ value: '你', selectionStart: 1, selectionEnd: 1 }, { group: 'typing-1' });
  history.record({ value: '你好', selectionStart: 2, selectionEnd: 2 }, { group: 'typing-1' });
  history.record({ value: '你好啊', selectionStart: 3, selectionEnd: 3 }, { group: 'typing-1' });

  assert.deepEqual(history.undo(), {
    value: '',
    selectionStart: 0,
    selectionEnd: 0,
  });
});

test('editor history ignores duplicate states and does not invent undo steps', () => {
  const initial = {
    value: '正文',
    selectionStart: 2,
    selectionEnd: 2,
  };
  const history = createEditorHistory(initial);

  history.record(initial);

  assert.equal(history.canUndo(), false);
  assert.equal(history.undo(), null);
});
