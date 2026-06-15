import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeFirstPageHeaderHeight,
  createDefaultSettings,
  layoutArticle,
  parseArticleBlocks,
  parseInlineRuns,
  resolveAuthorHeaderMetrics,
  resolveAuthorHeaderY,
  splitParagraphs,
} from '../src/layout.js';
import {
  applyBulletList,
  extractReferencedImageIds,
  insertImageReference,
  removeImageReference,
  wrapBoldSelection,
} from '../src/editorActions.js';
import { captureEditorViewport, restoreEditorViewport } from '../src/editorViewport.js';
import { formatPageNumber } from '../src/render.js';

const measure = (text, style = {}) => {
  const size = style.fontSize ?? 42;
  let units = 0;
  for (const char of text) {
    if (/[A-Za-z0-9_.-]/.test(char)) units += 0.56;
    else if (/\s/.test(char)) units += 0.34;
    else units += 1;
  }
  return units * size;
};

test('splitParagraphs trims text and removes empty paragraph gaps', () => {
  assert.deepEqual(splitParagraphs('  第一段  \n\n\n第二段\n  \n3  '), ['第一段', '第二段', '3']);
});

test('layoutArticle wraps long paragraphs inside the text width', () => {
  const settings = createDefaultSettings();
  const pages = layoutArticle('这是一个很长很长的段落，用来验证文字会按照页面宽度自动换行，而不是直接跑出画布边界。', settings, measure);

  assert.equal(pages.length, 1);
  assert.ok(pages[0].blocks.length > 1);
  for (const block of pages[0].blocks) {
    assert.ok(measure(block.text, block) <= settings.width - settings.marginLeft - settings.marginRight + settings.fontSize);
  }
});

test('layoutArticle paginates long text and keeps all lines in reading order', () => {
  const settings = createDefaultSettings({ height: 360, marginTop: 40, marginBottom: 40, lineHeight: 52, paragraphGap: 30 });
  const article = Array.from({ length: 12 }, (_, index) => `第${index + 1}段内容需要分页显示。`).join('\n\n');
  const pages = layoutArticle(article, settings, measure);

  assert.ok(pages.length > 1);
  const output = pages.flatMap((page) => page.blocks.map((block) => block.text)).join('');
  assert.match(output, /第1段内容/);
  assert.match(output, /第12段内容/);
});

test('layoutArticle reserves first page space when author header is enabled', () => {
  const settings = createDefaultSettings({ firstPageHeader: true, authorHeaderHeight: 190 });
  const pages = layoutArticle('第一段\n\n第二段', settings, measure);

  assert.equal(pages[0].hasAuthorHeader, true);
  assert.ok(pages[0].blocks[0].y >= computeFirstPageHeaderHeight(settings, measure));
});

test('layoutArticle uses top margin as the gap below the first-page author header', () => {
  const compact = createDefaultSettings({ firstPageHeader: true, articleTitle: 'Title', marginTop: 80 });
  const loose = createDefaultSettings({ firstPageHeader: true, articleTitle: 'Title', marginTop: 140 });
  const compactPages = layoutArticle('body', compact, measure);
  const loosePages = layoutArticle('body', loose, measure);

  assert.equal(loosePages[0].blocks[0].y - compactPages[0].blocks[0].y, 60);
});

test('layoutArticle reserves first-page space when only the title is visible', () => {
  const settings = createDefaultSettings({
    articleTitle: 'Title',
    titleHeaderEnabled: true,
    authorHeaderEnabled: false,
  });
  const pages = layoutArticle('body', settings, measure);

  assert.equal(pages[0].hasAuthorHeader, true);
  assert.ok(pages[0].blocks[0].y > settings.marginTop);
});

test('layoutArticle reserves first-page space when only the author is visible', () => {
  const settings = createDefaultSettings({
    titleHeaderEnabled: false,
    authorHeaderEnabled: true,
  });
  const pages = layoutArticle('body', settings, measure);

  assert.equal(pages[0].hasAuthorHeader, true);
  assert.ok(pages[0].blocks[0].y > settings.marginTop);
});

test('layoutArticle reserves footer space on every page', () => {
  const settings = createDefaultSettings({ height: 520, marginTop: 40, footerHeight: 118, lineHeight: 60 });
  const pages = layoutArticle('第一段\n\n第二段\n\n第三段\n\n第四段\n\n第五段', settings, measure);
  const bottom = settings.height - settings.footerHeight;

  for (const block of pages.flatMap((page) => page.blocks)) {
    if (block.y !== undefined) assert.ok(block.y + (block.fontSize ?? 0) <= bottom);
  }
});

test('createDefaultSettings uses the embedded reference serif font by default', () => {
  const settings = createDefaultSettings();

  assert.match(settings.fontFamily, /XHS Reference Serif/);
  assert.equal(settings.fontWeight, 400);
});

test('createDefaultSettings uses Lin Beta as the default author name', () => {
  const settings = createDefaultSettings();

  assert.equal(settings.authorName, '霖贝塔');
});

test('createDefaultSettings includes a customizable page number color', () => {
  const settings = createDefaultSettings();

  assert.equal(settings.pageNumberColor, '#1f5966');
});

test('createDefaultSettings includes reference-style title and footer settings', () => {
  const settings = createDefaultSettings();

  assert.equal(settings.articleTitle, '从来没人说过，学AI第一步是Github');
  assert.equal(settings.titleFontSize, 66);
  assert.equal(settings.titleLetterSpacing, 4);
  assert.equal(settings.authorScale, 100);
  assert.equal(settings.avatarSize, 124);
  assert.equal(settings.authorNameFontSize, 46);
  assert.equal(settings.authorDateFontSize, 34);
  assert.equal(settings.accentColor, '#1f5966');
  assert.equal(settings.footerEnabled, true);
});

test('computeFirstPageHeaderHeight measures titles with title letter spacing', () => {
  const observedLetterSpacing = [];
  const settings = createDefaultSettings({
    articleTitle: 'Title',
    titleHeaderEnabled: true,
    authorHeaderEnabled: false,
    titleLetterSpacing: 6,
  });
  const titleMeasure = (text, style = {}) => {
    if (style.fontSize === settings.titleFontSize) {
      observedLetterSpacing.push(style.letterSpacing);
    }
    return measure(text, style);
  };

  computeFirstPageHeaderHeight(settings, titleMeasure);

  assert.ok(observedLetterSpacing.includes(6));
});

test('resolveAuthorHeaderMetrics scales the author identity block from a single control', () => {
  const compact = resolveAuthorHeaderMetrics(createDefaultSettings({ authorScale: 80 }));
  const normal = resolveAuthorHeaderMetrics(createDefaultSettings({ authorScale: 100 }));
  const large = resolveAuthorHeaderMetrics(createDefaultSettings({ authorScale: 130 }));

  assert.deepEqual(
    {
      avatarSize: normal.avatarSize,
      authorNameFontSize: normal.authorNameFontSize,
      authorDateFontSize: normal.authorDateFontSize,
    },
    {
      avatarSize: 124,
      authorNameFontSize: 46,
      authorDateFontSize: 34,
    },
  );
  assert.ok(compact.avatarSize < normal.avatarSize);
  assert.ok(compact.authorNameFontSize < normal.authorNameFontSize);
  assert.ok(large.avatarSize > normal.avatarSize);
  assert.ok(large.authorDateFontSize > normal.authorDateFontSize);
});

test('resolveAuthorHeaderY keeps author position independent from body top margin', () => {
  const compactBodyGap = createDefaultSettings({ marginTop: 60 });
  const largeBodyGap = createDefaultSettings({ marginTop: 150 });

  assert.equal(resolveAuthorHeaderY(compactBodyGap), resolveAuthorHeaderY(largeBodyGap));
});

test('resolveAuthorHeaderY moves the full author block with its own offset', () => {
  const normal = createDefaultSettings({ authorOffsetY: 0 });
  const moved = createDefaultSettings({ authorOffsetY: 48 });

  assert.equal(resolveAuthorHeaderY(moved) - resolveAuthorHeaderY(normal), 48);
});

test('layoutArticle keeps body position fixed when author block moves', () => {
  const normal = createDefaultSettings({
    titleHeaderEnabled: true,
    authorHeaderEnabled: true,
    authorOffsetY: 0,
  });
  const moved = createDefaultSettings({
    titleHeaderEnabled: true,
    authorHeaderEnabled: true,
    authorOffsetY: 80,
  });
  const normalPages = layoutArticle('正文第一行', normal, measure);
  const movedPages = layoutArticle('正文第一行', moved, measure);

  assert.equal(movedPages[0].blocks[0].y, normalPages[0].blocks[0].y);
});

test('layoutArticle moves body text to page two when the first-page header fills the page', () => {
  const settings = createDefaultSettings({
    width: 720,
    height: 960,
    titleHeaderEnabled: true,
    authorHeaderEnabled: true,
    articleTitle: '这是一个非常长的标题'.repeat(14),
  });
  const pages = layoutArticle('正文第一行', settings, measure);
  const bottom = settings.height - settings.footerHeight;

  assert.equal(pages.length, 2);
  assert.equal(pages[0].blocks.length, 0);
  assert.ok(pages[1].blocks[0].y + pages[1].blocks[0].fontSize <= bottom);
});

test('layoutArticle moves a heading to page two when the first-page header fills the page', () => {
  const settings = createDefaultSettings({
    width: 720,
    height: 960,
    titleHeaderEnabled: true,
    authorHeaderEnabled: true,
    articleTitle: '这是一个非常长的标题'.repeat(14),
  });
  const pages = layoutArticle('# 章节标题', settings, measure);
  const bottom = settings.height - settings.footerHeight;

  assert.equal(pages.length, 2);
  assert.equal(pages[0].blocks.length, 0);
  assert.ok(pages[1].blocks[0].y + pages[1].blocks[0].fontSize <= bottom);
});

test('layoutArticle moves a code block to page two when the first-page header fills the page', () => {
  const settings = createDefaultSettings({
    width: 720,
    height: 960,
    titleHeaderEnabled: true,
    authorHeaderEnabled: true,
    articleTitle: '这是一个非常长的标题'.repeat(14),
  });
  const pages = layoutArticle('```js\nconst answer = 42;\n```', settings, measure);
  const bottom = settings.height - settings.footerHeight;

  assert.equal(pages.length, 2);
  assert.equal(pages[0].blocks.length, 0);
  assert.ok(pages[1].blocks[0].y + pages[1].blocks[0].height <= bottom);
});

test('formatPageNumber returns current page over total pages', () => {
  assert.equal(formatPageNumber(1, 12), '1 / 12');
  assert.equal(formatPageNumber(2, 12), '2 / 12');
});

test('parseArticleBlocks recognizes markdown headings for reference-style section titles', () => {
  const blocks = parseArticleBlocks('# 在咖啡厅美美玩一天，一个 bug 全没了\n\n正文');

  assert.deepEqual(blocks.map((block) => block.type), ['heading', 'text']);
  assert.equal(blocks[0].text, '在咖啡厅美美玩一天，一个 bug 全没了');
});

test('parseInlineRuns turns markdown bold markers into bold text runs', () => {
  const settings = createDefaultSettings();
  const runs = parseInlineRuns('普通**重点**结束', {
    fontSize: settings.fontSize,
    fontFamily: settings.fontFamily,
    fontWeight: settings.fontWeight,
  });

  assert.deepEqual(runs.map((run) => run.text), ['普通', '重点', '结束']);
  assert.deepEqual(runs.map((run) => run.fontWeight), [400, 700, 400]);
});

test('layoutArticle renders bold markers as styled runs without showing marker characters', () => {
  const settings = createDefaultSettings();
  const pages = layoutArticle('普通**重点**结束', settings, measure);
  const block = pages[0].blocks[0];

  assert.equal(block.text, '普通重点结束');
  assert.equal(block.text.includes('**'), false);
  assert.deepEqual(block.runs.map((run) => run.fontWeight), [400, 700, 400]);
});

test('wrapBoldSelection wraps selected text and moves the cursor after the closing marker', () => {
  const result = wrapBoldSelection('普通重点结束', 2, 4);

  assert.equal(result.value, '普通**重点**结束');
  assert.equal(result.selectionStart, 8);
  assert.equal(result.selectionEnd, 8);
});

test('wrapBoldSelection keeps placeholder selected when there is no selected text', () => {
  const result = wrapBoldSelection('普通结束', 2, 2);

  assert.equal(result.value, '普通**加粗文字**结束');
  assert.equal(result.selectionStart, 4);
  assert.equal(result.selectionEnd, 8);
});

test('wrapBoldSelection applies bold markers to every selected non-empty line', () => {
  const value = '第一行\n第二行\n\n第三行';
  const result = wrapBoldSelection(value, 0, value.length);

  assert.equal(result.value, '**第一行**\n**第二行**\n\n**第三行**');
  assert.equal(result.selectionStart, result.value.length);
  assert.equal(result.selectionEnd, result.value.length);
});

test('applyBulletList prefixes each selected non-empty line with a bullet', () => {
  const result = applyBulletList('项目背景\n执行方式\n\n完成标准', 0, 9);

  assert.equal(result.value, '• 项目背景\n• 执行方式\n\n完成标准');
  assert.equal(result.selectionStart, 0);
  assert.equal(result.selectionEnd, '• 项目背景\n• 执行方式'.length);
});

test('applyBulletList prefixes the current line when there is no selection', () => {
  const result = applyBulletList('标题\n执行方式', 5, 5);

  assert.equal(result.value, '标题\n• 执行方式');
  assert.equal(result.selectionStart, 7);
  assert.equal(result.selectionEnd, 7);
});

test('insertImageReference inserts marker at the captured selection', () => {
  const result = insertImageReference('开头内容\n结尾内容', 'img-7', 5, 5);

  assert.equal(result.value, '开头内容\n\n[[图片:img-7]]\n\n结尾内容');
  assert.equal(result.selectionStart, '开头内容\n\n[[图片:img-7]]\n\n'.length);
  assert.equal(result.selectionEnd, result.selectionStart);
});

test('layoutArticle preserves a single Enter as a visible line break', () => {
  const settings = createDefaultSettings();
  const pages = layoutArticle('第一行\n第二行', settings, measure);
  const blocks = pages[0].blocks;

  assert.equal(blocks[0].text, '第一行');
  assert.equal(blocks[1].text, '第二行');
  assert.equal(blocks[1].y, blocks[0].y + settings.lineHeight);
});

test('layoutArticle preserves repeated Enter presses as additional blank lines', () => {
  const settings = createDefaultSettings({
    titleHeaderEnabled: false,
    authorHeaderEnabled: false,
  });
  const pages = layoutArticle('第一行\n\n\n第二行', settings, measure);
  const blocks = pages[0].blocks;
  const firstLine = blocks.find((block) => block.text === '第一行');
  const spacer = blocks.find((block) => block.type === 'spacer');
  const secondLine = blocks.find((block) => block.text === '第二行');

  assert.ok(spacer);
  assert.equal(spacer.height, settings.lineHeight);
  assert.equal(
    secondLine.y,
    firstLine.y + settings.lineHeight + settings.paragraphGap + settings.lineHeight,
  );
});

test('parseArticleBlocks recognizes standalone image markers', () => {
  const blocks = parseArticleBlocks('第一段\n\n[[图片:img-1]]\n\n第二段');

  assert.deepEqual(blocks.map((block) => block.type), ['text', 'image', 'text']);
  assert.equal(blocks[1].id, 'img-1');
});

test('parseArticleBlocks recognizes image markers on their own line inside text flow', () => {
  const blocks = parseArticleBlocks('打开Codex，设定目标或直接对话。\n[[图片:img-1]]\n提示词如下：');

  assert.deepEqual(blocks.map((block) => block.type), ['text', 'image', 'text']);
  assert.equal(blocks[0].text, '打开Codex，设定目标或直接对话。');
  assert.equal(blocks[1].id, 'img-1');
  assert.equal(blocks[2].text, '提示词如下：');
});

test('layoutArticle does not render image marker text when marker only has single line breaks', () => {
  const settings = createDefaultSettings({
    images: {
      'img-1': { width: 420, height: 210 },
    },
  });
  const pages = layoutArticle('打开Codex，设定目标或直接对话。\n[[图片:img-1]]\n提示词如下：', settings, measure);
  const blocks = pages.flatMap((page) => page.blocks);

  assert.ok(blocks.some((block) => block.type === 'image' && block.id === 'img-1'));
  assert.equal(blocks.some((block) => block.text?.includes('[[图片')), false);
});

test('parseArticleBlocks recognizes fenced code modules', () => {
  const blocks = parseArticleBlocks('说明\n\n```js\nconst a = 1;\nconsole.log(a);\n```\n\n结束');

  assert.deepEqual(blocks.map((block) => block.type), ['text', 'code', 'text']);
  assert.equal(blocks[1].language, 'js');
  assert.equal(blocks[1].code, 'const a = 1;\nconsole.log(a);');
});

test('layoutArticle places fenced code as a code module without marker characters', () => {
  const settings = createDefaultSettings();
  const pages = layoutArticle('说明\n\n```js\nconst a = 1;\n```\n\n结束', settings, measure);
  const blocks = pages.flatMap((page) => page.blocks);
  const codeBlock = blocks.find((block) => block.type === 'code');

  assert.ok(codeBlock);
  assert.equal(codeBlock.language, 'js');
  assert.equal(codeBlock.lines[0].text, 'const a = 1;');
  assert.equal(codeBlock.x, settings.marginLeft);
  assert.equal(codeBlock.width, settings.width - settings.marginLeft - settings.marginRight);
  assert.equal(blocks.some((block) => block.text?.includes('```')), false);
});

test('parseArticleBlocks recognizes a standalone space line as a page break', () => {
  const blocks = parseArticleBlocks('第一页内容\n\n   \n\nAI 模型');

  assert.deepEqual(blocks.map((block) => block.type), ['text', 'pageBreak', 'text']);
  assert.equal(blocks[2].text, 'AI 模型');
});

test('layoutArticle starts content after a page break on the next page', () => {
  const settings = createDefaultSettings();
  const pages = layoutArticle('第一页内容\n\n   \n\nAI 模型', settings, measure);

  assert.equal(pages.length, 2);
  assert.equal(pages[0].blocks.at(-1).text, '第一页内容');
  assert.equal(pages[1].blocks[0].text, 'AI 模型');
});

test('layoutArticle places image blocks without showing marker text', () => {
  const settings = createDefaultSettings({
    images: {
      'img-1': { width: 1200, height: 800 },
    },
  });
  const pages = layoutArticle('第一段\n\n[[图片:img-1]]\n\n第二段', settings, measure);
  const imageBlock = pages.flatMap((page) => page.blocks).find((block) => block.type === 'image');

  assert.ok(imageBlock);
  assert.equal(imageBlock.id, 'img-1');
  assert.equal(imageBlock.width, settings.width - settings.marginLeft - settings.marginRight);
  assert.equal(imageBlock.height, Math.round(imageBlock.width * (800 / 1200)));
  assert.equal(pages.flatMap((page) => page.blocks).some((block) => block.text?.includes('[[图片')), false);
});

test('layoutArticle fits a first-page leading image into the remaining header space', () => {
  const settings = createDefaultSettings({
    titleHeaderEnabled: true,
    authorHeaderEnabled: true,
    images: {
      'img-1': { width: 800, height: 1200 },
    },
  });
  const pages = layoutArticle('[[图片:img-1]]', settings, measure);
  const imageBlock = pages[0].blocks[0];
  const bottom = settings.height - settings.footerHeight;

  assert.equal(imageBlock.type, 'image');
  assert.ok(imageBlock.y + imageBlock.height <= bottom);
});

test('layoutArticle uses original image size when it fits and preserves aspect ratio', () => {
  const settings = createDefaultSettings({
    images: {
      'img-1': { width: 420, height: 210 },
    },
  });
  const pages = layoutArticle('before\n\n[[image:img-1]]\n\nafter', settings, measure);
  const imageBlock = pages.flatMap((page) => page.blocks).find((block) => block.type === 'image');
  const availableWidth = settings.width - settings.marginLeft - settings.marginRight;

  assert.equal(imageBlock.width, 420);
  assert.equal(imageBlock.height, 210);
  assert.equal(imageBlock.x, settings.marginLeft + Math.round((availableWidth - 420) / 2));
});

test('layoutArticle scales an image into the remaining page space when it stays readable', () => {
  const settings = createDefaultSettings({
    firstPageHeader: false,
    footerEnabled: false,
    images: {
      'img-1': { width: 1254, height: 1254 },
    },
  });
  const article = [
    '第一段内容',
    '第二段内容',
    '第三段内容',
    '第四段内容',
    '第五段内容',
    '[[image:img-1]]',
    '图片下面的文字',
  ].join('\n\n');
  const pages = layoutArticle(article, settings, measure);
  const imageBlock = pages[0].blocks.find((block) => block.type === 'image');

  assert.ok(imageBlock);
  assert.equal(imageBlock.id, 'img-1');
  assert.ok(imageBlock.width < settings.width - settings.marginLeft - settings.marginRight);
  assert.equal(imageBlock.width, imageBlock.height);
  assert.ok(imageBlock.y + imageBlock.height <= settings.height - settings.marginBottom);
});

test('layoutArticle moves an image to the next page when fitting would make it shorter than the readable minimum', () => {
  const settings = createDefaultSettings({
    height: 520,
    marginTop: 40,
    marginBottom: 40,
    lineHeight: 60,
    paragraphGap: 52,
    footerEnabled: false,
    images: {
      'img-1': { width: 1000, height: 1000 },
    },
  });
  const article = ['第一段', '第二段', '第三段', '第四段', '[[image:img-1]]'].join('\n\n');
  const pages = layoutArticle(article, settings, measure);
  const imagePageIndex = pages.findIndex((page) => page.blocks.some((block) => block.type === 'image'));

  assert.equal(imagePageIndex, 1);
});

test('layoutArticle prioritizes using a visible remaining page slot for images', () => {
  const settings = createDefaultSettings({
    footerEnabled: false,
    images: {
      'img-1': { width: 1254, height: 1254 },
    },
  });
  const article = [
    '如何让你的Codex变的越来越聪明，越来越懂你?',
    '昨天跟朋友直播时，他说他的开发Skill，每周都能无痛更新。',
    '因为他会让Codex扫描本周对话记录，让AI提炼他的开发经验、审美偏好并写入Skill，从而让它越来越强。',
    '建议人人都试试，下面是做法和提示词。',
    '打开Codex，设定目标或直接对话。',
    '[[image:img-1]]',
    '提示词如下：',
  ].join('\n\n');
  const pages = layoutArticle(article, settings, measure);
  const imageBlock = pages[0].blocks.find((block) => block.type === 'image');

  assert.ok(imageBlock);
  assert.ok(imageBlock.height >= settings.imageMinFitHeight);
  assert.ok(imageBlock.y + imageBlock.height <= settings.height - settings.marginBottom);
});

test('layoutArticle fits a wide screenshot into a smaller readable remaining slot', () => {
  const settings = createDefaultSettings({
    height: 900,
    marginTop: 80,
    marginBottom: 80,
    lineHeight: 60,
    paragraphGap: 52,
    firstPageHeader: false,
    footerEnabled: false,
    images: {
      'img-1': { width: 2680, height: 1692 },
    },
  });
  const article = ['一段文字', '二段文字', '三段文字', '四段文字', '五段文字', '[[image:img-1]]'].join('\n\n');
  const pages = layoutArticle(article, settings, measure);
  const imageBlock = pages[0].blocks.find((block) => block.type === 'image');

  assert.ok(imageBlock);
  assert.ok(imageBlock.width >= settings.imageMinFitWidth);
  assert.ok(imageBlock.height >= settings.imageMinFitHeight);
  assert.ok(imageBlock.y + imageBlock.height <= settings.height - settings.marginBottom);
});

test('extractReferencedImageIds returns unique image ids in article order', () => {
  const ids = extractReferencedImageIds('a\n\n[[图片:img-2]]\n\n[[image:img-1]]\n\n[[图片:img-2]]');

  assert.deepEqual(ids, ['img-2', 'img-1']);
});

test('removeImageReference removes a standalone image marker without changing nearby text', () => {
  const text = '第一段\n\n[[图片:img-1]]\n\n第二段\n\n[[image:img-2]]';

  assert.equal(removeImageReference(text, 'img-1'), '第一段\n\n第二段\n\n[[image:img-2]]');
});

test('restoreEditorViewport keeps textarea scroll and selection stable after render', () => {
  const textarea = {
    selectionStart: 42,
    selectionEnd: 48,
    scrollTop: 360,
    scrollLeft: 0,
    ownerDocument: null,
    setSelectionRange(start, end) {
      this.selectionStart = start;
      this.selectionEnd = end;
    },
    focus() {},
  };
  const panel = { scrollTop: 220, scrollLeft: 0 };
  const snapshot = captureEditorViewport(textarea, panel);
  snapshot.active = true;

  textarea.scrollTop = 999;
  textarea.selectionStart = 0;
  textarea.selectionEnd = 0;
  panel.scrollTop = 888;

  restoreEditorViewport(textarea, panel, snapshot);

  assert.equal(textarea.scrollTop, 360);
  assert.equal(textarea.selectionStart, 42);
  assert.equal(textarea.selectionEnd, 48);
  assert.equal(panel.scrollTop, 220);
});

test('restoreEditorViewport restores scroll after selection changes try to scroll the textarea', () => {
  const textarea = {
    selectionStart: 12,
    selectionEnd: 18,
    scrollTop: 420,
    scrollLeft: 0,
    ownerDocument: null,
    setSelectionRange(start, end) {
      this.selectionStart = start;
      this.selectionEnd = end;
      this.scrollTop = 999;
    },
    focus() {},
  };
  const snapshot = captureEditorViewport(textarea, null);
  snapshot.active = true;

  textarea.scrollTop = 0;
  textarea.selectionStart = 0;
  textarea.selectionEnd = 0;

  restoreEditorViewport(textarea, null, snapshot);

  assert.equal(textarea.selectionStart, 12);
  assert.equal(textarea.selectionEnd, 18);
  assert.equal(textarea.scrollTop, 420);
});

test('restoreEditorViewport keeps document scroll stable after settings render', () => {
  const documentScroll = { scrollTop: 720, scrollLeft: 0 };
  const textarea = {
    selectionStart: 12,
    selectionEnd: 18,
    scrollTop: 420,
    scrollLeft: 0,
    ownerDocument: {
      activeElement: { dataset: { setting: 'paragraphGap' } },
      scrollingElement: documentScroll,
    },
    setSelectionRange(start, end) {
      this.selectionStart = start;
      this.selectionEnd = end;
      documentScroll.scrollTop = 0;
    },
  };
  const snapshot = captureEditorViewport(textarea, null);

  documentScroll.scrollTop = 0;
  textarea.scrollTop = 0;

  restoreEditorViewport(textarea, null, snapshot);

  assert.equal(documentScroll.scrollTop, 720);
  assert.equal(textarea.scrollTop, 420);
});

test('restoreEditorViewport does not move text selection when a setting control is active', () => {
  let selectionCalls = 0;
  const textarea = {
    selectionStart: 12,
    selectionEnd: 18,
    scrollTop: 420,
    scrollLeft: 0,
    ownerDocument: {
      activeElement: { dataset: { setting: 'paragraphGap' } },
      scrollingElement: { scrollTop: 0, scrollLeft: 0 },
    },
    setSelectionRange() {
      selectionCalls += 1;
    },
  };
  const panel = { scrollTop: 500, scrollLeft: 0 };
  const snapshot = captureEditorViewport(textarea, panel);

  panel.scrollTop = 0;
  restoreEditorViewport(textarea, panel, snapshot);

  assert.equal(selectionCalls, 0);
  assert.equal(panel.scrollTop, 500);
});

test('restoreEditorViewport reapplies panel scroll on the next animation frame', () => {
  const frameCallbacks = [];
  const textarea = {
    selectionStart: 12,
    selectionEnd: 18,
    scrollTop: 420,
    scrollLeft: 0,
    ownerDocument: {
      activeElement: { dataset: { setting: 'paragraphGap' } },
      scrollingElement: { scrollTop: 0, scrollLeft: 0 },
      defaultView: {
        requestAnimationFrame(callback) {
          frameCallbacks.push(callback);
        },
      },
    },
    setSelectionRange() {},
  };
  const panel = { scrollTop: 500, scrollLeft: 0 };
  const snapshot = captureEditorViewport(textarea, panel);

  panel.scrollTop = 0;
  restoreEditorViewport(textarea, panel, snapshot);
  panel.scrollTop = 0;
  frameCallbacks.forEach((callback) => callback());

  assert.equal(panel.scrollTop, 500);
});
