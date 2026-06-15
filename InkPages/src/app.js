import { createDefaultSettings } from './layout.js';
import { downloadCanvas, renderArticle } from './render.js';
import { exportCanvasesToDirectory } from './exportImages.js';
import { captureEditorViewport, restoreEditorViewport } from './editorViewport.js';
import {
  applyBulletList,
  extractReferencedImageIds,
  insertImageReference,
  removeImageReference,
  wrapBoldSelection,
} from './editorActions.js';
import { loadImageFile, loadRetainedImageFile } from './imageFiles.js';
import { applyColorPresetToControls, darkModeColorPreset, readSettingControlValue } from './settingsControls.js';
import { readDraft, writeDraft } from './draftStorage.js';
import { createEditorHistory } from './editorHistory.js';

const draftKey = 'graphic-layout-article-draft';
const draftStorage = (() => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
})();

const sampleText = `我第一次用 GitHub，是被 Gemini 逼的。

那时候我刚开始接触AI coding，把自己的第一个html搞崩了，走投无路，问 AI 怎么办，它跟我说：**你去注册个 GitHub 吧。**

我以前就是个破运营，跟代码这个东西没有任何交集。第一次打开 GitHub 的页面，满屏英文，Repository、Clone、Fork、Pull Request——每个单词我都认识，放在一起完全不知道在说什么。

现在回头看，注册 GitHub 可能是我用 AI 以来，做过的最正确的一个决定。

   

# 在咖啡厅美美玩一天，一个 bug 全没了

2025年，Gemini 3.0 刚出来的时候，小红书有一个特别火的玩法：做**手势控制的 HTML 页面**。我看大家都在做，于是也跟风搞了一个。

早上起来有了想法之后，拿起电脑直冲咖啡厅，打开 Gemini 网页就开始动手了。

沉迷 Vibe coding 的人应该知道，一旦开始就停不下来了，从上午搞到了晚上，到傍晚的时候，就差两个bug，优化一下就能用了。

我正准备去修一个摄像头检测的 bug，**但如无意外的话，就要出意外了**。`;

const state = {
  avatarImage: null,
  avatarRelease: null,
  avatarName: '',
  canvases: [],
  exportResetTimer: null,
  images: {},
  nextImageId: 1,
  activeControlViewport: null,
  editorHistory: null,
  typingGroup: null,
  typingGroupCounter: 0,
  typingResetTimer: null,
};

const elements = {
  text: document.querySelector('#articleText'),
  preview: document.querySelector('#preview'),
  count: document.querySelector('#pageCount'),
  exportButton: document.querySelector('#exportButton'),
  undoButton: document.querySelector('#undoButton'),
  boldButton: document.querySelector('#boldButton'),
  bulletButton: document.querySelector('#bulletButton'),
  codeButton: document.querySelector('#codeButton'),
  imageButton: document.querySelector('#imageButton'),
  pageBreakButton: document.querySelector('#pageBreakButton'),
  inlineImageInput: document.querySelector('#inlineImageInput'),
  imageList: document.querySelector('#imageList'),
  panel: document.querySelector('.panel'),
  avatarInput: document.querySelector('#avatarInput'),
  avatarSelectButton: document.querySelector('#avatarSelectButton'),
  avatarStatus: document.querySelector('#avatarStatus'),
  avatarRemoveButton: document.querySelector('#avatarRemoveButton'),
  darkModeButton: document.querySelector('#darkModeButton'),
  controls: Array.from(document.querySelectorAll('[data-setting]')),
};

function readSettings() {
  const settings = createDefaultSettings();
  for (const control of elements.controls) {
    const key = control.dataset.setting;
    settings[key] = readSettingControlValue(settings[key], control);
  }
  settings.accentColor = settings.pageNumberColor;
  const referencedIds = new Set(extractReferencedImageIds(elements.text.value));
  settings.images = Object.fromEntries(Object.entries(state.images).filter(([id]) => referencedIds.has(id)));
  return settings;
}

function syncRangeLabels() {
  for (const range of document.querySelectorAll('input[type="range"][data-setting]')) {
    const output = document.querySelector(`[data-output="${range.dataset.setting}"]`);
    if (output) output.textContent = range.value;
  }
}

function syncAvatarControl() {
  const hasAvatar = Boolean(state.avatarImage);
  elements.avatarSelectButton.textContent = hasAvatar ? '更换头像' : '选择头像';
  elements.avatarStatus.textContent = hasAvatar ? `已上传：${state.avatarName}` : '未上传，使用默认头像';
  elements.avatarRemoveButton.hidden = !hasAvatar;
}

function saveDraft() {
  writeDraft(draftStorage, draftKey, elements.text.value);
}

function snapshotEditorState() {
  return {
    value: elements.text.value,
    selectionStart: elements.text.selectionStart,
    selectionEnd: elements.text.selectionEnd,
  };
}

function syncUndoControl() {
  elements.undoButton.disabled = !state.editorHistory?.canUndo();
}

function endTypingGroup() {
  clearTimeout(state.typingResetTimer);
  state.typingResetTimer = null;
  state.typingGroup = null;
}

function currentTypingGroup() {
  if (!state.typingGroup) {
    state.typingGroupCounter += 1;
    state.typingGroup = `typing-${state.typingGroupCounter}`;
  }

  clearTimeout(state.typingResetTimer);
  state.typingResetTimer = setTimeout(endTypingGroup, 800);
  return state.typingGroup;
}

function recordEditorState(group = null) {
  state.editorHistory.record(snapshotEditorState(), { group });
  syncUndoControl();
}

function render(restoreSnapshot = null) {
  const viewport = restoreSnapshot || captureEditorViewport(elements.text, elements.panel);
  syncRangeLabels();
  syncAvatarControl();
  const settings = readSettings();
  const result = renderArticle(elements.text.value, settings, state.avatarImage);
  state.canvases = result.canvases;
  elements.preview.replaceChildren();

  for (const [index, canvas] of state.canvases.entries()) {
    const frame = document.createElement('section');
    frame.className = 'page-frame';

    const label = document.createElement('span');
    label.className = 'page-label';
    label.textContent = `第 ${index + 1} 页`;

    const view = document.createElement('div');
    view.className = 'canvas-wrap';
    view.appendChild(canvas);

    frame.append(label, view);
    elements.preview.appendChild(frame);
  }

  elements.count.textContent = `${state.canvases.length} 张`;
  renderImageList();
  syncUndoControl();
  restoreEditorViewport(elements.text, elements.panel, viewport);
}

function snapshotWithSelection(snapshot, selectionStart, selectionEnd) {
  return {
    ...snapshot,
    selectionStart,
    selectionEnd,
    active: true,
  };
}

function applyTextEdit(result, viewport = captureEditorViewport(elements.text, elements.panel)) {
  endTypingGroup();
  elements.text.value = result.value;
  elements.text.focus({ preventScroll: true });
  elements.text.setSelectionRange(result.selectionStart, result.selectionEnd);
  recordEditorState();
  saveDraft();
  render(snapshotWithSelection(viewport, result.selectionStart, result.selectionEnd));
}

function undoLastEdit() {
  endTypingGroup();
  const previous = state.editorHistory.undo();
  if (!previous) {
    syncUndoControl();
    return;
  }

  const viewport = captureEditorViewport(elements.text, elements.panel);
  elements.text.value = previous.value;
  elements.text.focus({ preventScroll: true });
  elements.text.setSelectionRange(previous.selectionStart, previous.selectionEnd);
  saveDraft();
  syncUndoControl();
  render(snapshotWithSelection(viewport, previous.selectionStart, previous.selectionEnd));
}

function renderImageList() {
  elements.imageList.replaceChildren();
  const images = extractReferencedImageIds(elements.text.value)
    .map((id) => state.images[id])
    .filter(Boolean);

  if (!images.length) {
    const empty = document.createElement('div');
    empty.className = 'image-empty';
    empty.textContent = '还没有插入图片';
    elements.imageList.appendChild(empty);
    return;
  }

  for (const imageInfo of images) {
    const item = document.createElement('div');
    item.className = 'image-item';

    const thumb = document.createElement('div');
    thumb.className = 'image-thumb';
    const thumbImage = document.createElement('img');
    thumbImage.alt = imageInfo.name || imageInfo.id;
    thumbImage.src = imageInfo.image.src;
    thumb.appendChild(thumbImage);

    const details = document.createElement('div');
    details.className = 'image-details';

    const name = document.createElement('div');
    name.className = 'image-name';
    name.textContent = imageInfo.name || imageInfo.id;

    const meta = document.createElement('span');
    meta.className = 'image-meta';
    meta.textContent = `${imageInfo.width} x ${imageInfo.height}`;

    const marker = document.createElement('button');
    marker.type = 'button';
    marker.className = 'image-token';
    marker.textContent = `[[图片:${imageInfo.id}]]`;
    marker.title = '复制图片标记';
    marker.addEventListener('click', () => {
      navigator.clipboard?.writeText(marker.textContent);
    });

    details.append(name, meta, marker);

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'image-delete';
    deleteButton.textContent = '×';
    deleteButton.setAttribute('aria-label', `删除 ${imageInfo.name || imageInfo.id}`);
    deleteButton.title = '从正文和预览里删除这张图片';
    deleteButton.addEventListener('click', () => {
      const viewport = captureEditorViewport(elements.text, elements.panel);
      const value = removeImageReference(elements.text.value, imageInfo.id);
      const selectionStart = Math.min(elements.text.selectionStart, value.length);
      const selectionEnd = Math.min(elements.text.selectionEnd, value.length);
      applyTextEdit(
        {
          value,
          selectionStart,
          selectionEnd,
        },
        viewport,
      );
    });

    item.append(thumb, details, deleteButton);
    elements.imageList.appendChild(item);
  }
}

elements.text.value = readDraft(draftStorage, draftKey, sampleText);
state.editorHistory = createEditorHistory(snapshotEditorState());

function rememberControlViewport() {
  state.activeControlViewport = {
    ...captureEditorViewport(elements.text, elements.panel),
    active: false,
  };
}

function ensureControlViewport() {
  if (!state.activeControlViewport) rememberControlViewport();
}

function renderFromControl() {
  render(state.activeControlViewport || captureEditorViewport(elements.text, elements.panel));
}

function releaseControlViewportSoon() {
  requestAnimationFrame(() => {
    state.activeControlViewport = null;
  });
}

for (const control of elements.controls) {
  control.addEventListener('pointerdown', rememberControlViewport, { capture: true });
  control.addEventListener('focus', ensureControlViewport);
  control.addEventListener('keydown', ensureControlViewport);
  control.addEventListener('input', renderFromControl);
  control.addEventListener('change', () => {
    renderFromControl();
    releaseControlViewportSoon();
  });
  control.addEventListener('blur', releaseControlViewportSoon);
}

elements.text.addEventListener('input', () => {
  recordEditorState(currentTypingGroup());
  saveDraft();
  render();
});

elements.darkModeButton.addEventListener('click', () => {
  applyColorPresetToControls(elements.controls, darkModeColorPreset);
  render(captureEditorViewport(elements.text, elements.panel));
});

function applyBoldToSelection() {
  const viewport = captureEditorViewport(elements.text, elements.panel);
  const start = elements.text.selectionStart;
  const end = elements.text.selectionEnd;
  const result = wrapBoldSelection(elements.text.value, start, end);

  applyTextEdit(result, viewport);
}

elements.boldButton.addEventListener('click', () => {
  applyBoldToSelection();
});

elements.undoButton.addEventListener('click', () => {
  undoLastEdit();
});

elements.bulletButton.addEventListener('click', () => {
  const viewport = captureEditorViewport(elements.text, elements.panel);
  const result = applyBulletList(elements.text.value, elements.text.selectionStart, elements.text.selectionEnd);
  applyTextEdit(result, viewport);
});

elements.text.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === 'z') {
    event.preventDefault();
    undoLastEdit();
    return;
  }

  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'b') {
    event.preventDefault();
    applyBoldToSelection();
  }
});

elements.codeButton.addEventListener('click', () => {
  const viewport = captureEditorViewport(elements.text, elements.panel);
  const marker = '\n\n```js\n// 在这里写代码\n```\n\n';
  const start = elements.text.selectionStart;
  const end = elements.text.selectionEnd;
  const value = elements.text.value;
  const codeStart = start + '\n\n```js\n'.length;
  const codeEnd = codeStart + '// 在这里写代码'.length;
  applyTextEdit(
    {
      value: value.slice(0, start) + marker + value.slice(end),
      selectionStart: codeStart,
      selectionEnd: codeEnd,
    },
    viewport,
  );
});

elements.pageBreakButton.addEventListener('click', () => {
  const viewport = captureEditorViewport(elements.text, elements.panel);
  const marker = '\n\n   \n\n';
  const start = elements.text.selectionStart;
  const end = elements.text.selectionEnd;
  const value = elements.text.value;
  applyTextEdit(
    {
      value: value.slice(0, start) + marker + value.slice(end),
      selectionStart: start + marker.length,
      selectionEnd: start + marker.length,
    },
    viewport,
  );
});

elements.imageButton.addEventListener('click', () => {
  elements.inlineImageInput.click();
});

elements.inlineImageInput.addEventListener('change', async () => {
  const file = elements.inlineImageInput.files?.[0];
  if (!file) return;

  const viewport = captureEditorViewport(elements.text, elements.panel);
  const selectionStart = elements.text.selectionStart;
  const selectionEnd = elements.text.selectionEnd;
  const id = `img-${state.nextImageId}`;
  state.nextImageId += 1;

  try {
    const imageInfo = await loadImageFile(file);
    state.images[id] = {
      id,
      ...imageInfo,
    };

    elements.inlineImageInput.value = '';
    applyTextEdit(insertImageReference(elements.text.value, id, selectionStart, selectionEnd), viewport);
  } catch (error) {
    elements.inlineImageInput.value = '';
    console.error(error);
  }
});

elements.avatarSelectButton.addEventListener('click', () => {
  elements.avatarInput.click();
});

elements.avatarInput.addEventListener('change', async () => {
  const file = elements.avatarInput.files?.[0];
  if (!file) return;

  elements.avatarStatus.textContent = '正在读取头像...';
  try {
    const loaded = await loadRetainedImageFile(file);
    state.avatarRelease?.();
    state.avatarImage = loaded.image;
    state.avatarRelease = loaded.release;
    state.avatarName = loaded.name;
    elements.avatarInput.value = '';
    render();
  } catch (error) {
    elements.avatarInput.value = '';
    syncAvatarControl();
    console.error(error);
  }
});

elements.avatarRemoveButton.addEventListener('click', () => {
  state.avatarRelease?.();
  state.avatarImage = null;
  state.avatarRelease = null;
  state.avatarName = '';
  elements.avatarInput.value = '';
  render();
});

elements.exportButton.addEventListener('click', async () => {
  const total = state.canvases.length;
  if (!total) return;

  const defaultLabel = '批量导出全部 PNG';
  clearTimeout(state.exportResetTimer);
  elements.exportButton.disabled = true;

  try {
    if (typeof window.showDirectoryPicker === 'function') {
      await exportCanvasesToDirectory(state.canvases, {
        showDirectoryPicker: window.showDirectoryPicker.bind(window),
        onProgress: (completed, pageTotal) => {
          elements.exportButton.textContent = completed
            ? `正在导出 ${completed} / ${pageTotal}`
            : `准备导出 ${pageTotal} 张`;
        },
      });
      elements.exportButton.textContent = `已导出 ${total} 张`;
    } else {
      state.canvases.forEach((canvas, index) => {
        setTimeout(() => downloadCanvas(canvas, `xiaohongshu-page-${String(index + 1).padStart(2, '0')}.png`), index * 150);
      });
      elements.exportButton.textContent = `已开始导出 ${total} 张`;
    }
  } catch (error) {
    if (error?.name === 'AbortError') {
      elements.exportButton.textContent = defaultLabel;
    } else {
      elements.exportButton.textContent = '导出失败，请重试';
      console.error(error);
    }
  } finally {
    elements.exportButton.disabled = false;
    state.exportResetTimer = setTimeout(() => {
      elements.exportButton.textContent = defaultLabel;
    }, 2200);
  }
});

render();
document.fonts?.ready.then(render);

window.addEventListener('beforeunload', () => {
  state.avatarRelease?.();
});
