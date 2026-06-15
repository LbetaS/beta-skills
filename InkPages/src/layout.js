const defaultMarginTop = 104;

export function createDefaultSettings(overrides = {}) {
  return {
    width: 1080,
    height: 1440,
    marginTop: defaultMarginTop,
    marginRight: 88,
    marginBottom: 86,
    marginLeft: 88,
    fontSize: 43,
    fontWeight: 400,
    lineHeight: 74,
    paragraphGap: 52,
    articleTitle: '从来没人说过，学AI第一步是Github',
    titleFontSize: 66,
    titleLetterSpacing: 4,
    titleLineHeight: 82,
    titleFontWeight: 800,
    titleTop: 102,
    titleUnderlineWidth: 94,
    titleUnderlineHeight: 5,
    titleUnderlineGap: 34,
    titleAuthorGap: 46,
    authorScale: 100,
    avatarSize: 124,
    authorNameFontSize: 46,
    authorDateFontSize: 34,
    authorTop: 104,
    authorOffsetY: 0,
    headerContentGap: 86,
    headingFontSize: 48,
    headingLineHeight: 66,
    headingGap: 44,
    headingBarWidth: 6,
    footerEnabled: true,
    footerHeight: 178,
    footerLineColor: '#3a332c',
    footerTextColor: '#8a8176',
    imageGap: 52,
    imageBeforeGap: 24,
    imageMinFitHeight: 180,
    imageMinFitWidth: 320,
    codeGap: 52,
    codePaddingX: 28,
    codePaddingY: 24,
    codeFontSize: 28,
    codeLineHeight: 42,
    codeFontFamily: 'Consolas, "Cascadia Mono", "Courier New", monospace',
    codeBackgroundColor: '#19150f',
    codeBorderColor: '#3a332c',
    codeTextColor: '#f1ece4',
    fontFamily: '"XHS Reference Serif", "Noto Serif SC", "Source Han Serif SC", "Songti SC", SimSun, serif',
    textColor: '#f1ece4',
    backgroundColor: '#0f0d0a',
    pageNumberColor: '#1f5966',
    accentColor: '#1f5966',
    firstPageHeader: false,
    titleHeaderEnabled: null,
    authorHeaderEnabled: null,
    authorHeaderHeight: 184,
    authorName: '霖贝塔',
    authorDate: '05/15',
    ...overrides,
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function resolveAuthorHeaderMetrics(rawSettings = {}) {
  const settings = createDefaultSettings(rawSettings);
  const scale = clamp(Number(settings.authorScale) || 100, 70, 130) / 100;

  return {
    avatarSize: Math.round(settings.avatarSize * scale),
    authorNameFontSize: Math.round(settings.authorNameFontSize * scale),
    authorDateFontSize: Math.round(settings.authorDateFontSize * scale),
    headerContentGap: Math.round(settings.headerContentGap * scale),
  };
}

export function resolveAuthorHeaderY(rawSettings = {}, titleBottom = null) {
  const settings = createDefaultSettings(rawSettings);
  const offset = Number(settings.authorOffsetY) || 0;
  const baseY = titleBottom === null ? settings.authorTop : titleBottom + settings.titleAuthorGap;
  return Math.round(baseY + offset);
}

function resolveAuthorHeaderFlowY(settings, titleBottom = null) {
  return resolveAuthorHeaderY(
    {
      ...settings,
      authorOffsetY: 0,
    },
    titleBottom,
  );
}

export function shouldShowTitleHeader(settings) {
  const enabled = settings.titleHeaderEnabled === true || settings.firstPageHeader === true;
  return enabled && settings.titleHeaderEnabled !== false && Boolean(String(settings.articleTitle || '').trim());
}

export function shouldShowAuthorHeader(settings) {
  const enabled = settings.authorHeaderEnabled === true || settings.firstPageHeader === true;
  return enabled && settings.authorHeaderEnabled !== false;
}

export function shouldShowFirstPageHeader(settings) {
  return shouldShowTitleHeader(settings) || shouldShowAuthorHeader(settings);
}

export function splitParagraphs(text) {
  return String(text)
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/g)
    .map((paragraph) => paragraph.replace(/\s*\n\s*/g, '').trim())
    .filter(Boolean);
}

function isSectionMarker(text) {
  return /^\d{1,2}$/.test(text.trim());
}

function parseHeadingMarker(text) {
  const match = text.trim().match(/^#{1,2}\s+(.+)$/);
  return match ? match[1].trim() : null;
}

function parseImageMarker(text) {
  const match = text.trim().match(/^\[\[(?:图片|image):([A-Za-z0-9_-]+)\]\]$/);
  return match ? match[1] : null;
}

function isPageBreakLine(line) {
  return /^ {3,}$/.test(line) || line.trim() === '[[换页]]' || line.trim() === '[[pagebreak]]';
}

export function parseArticleBlocks(text) {
  const blocks = [];
  let paragraphLines = [];
  let codeLanguage = null;
  let codeLines = [];
  let blankLineRun = 0;

  const pushParagraph = () => {
    const paragraph = paragraphLines.join('\n').trim();
    paragraphLines = [];
    if (!paragraph) return;

    const imageId = parseImageMarker(paragraph);
    if (imageId) {
      blocks.push({
        type: 'image',
        id: imageId,
      });
      return;
    }

    const headingText = parseHeadingMarker(paragraph);
    if (headingText) {
      blocks.push({
        type: 'heading',
        text: headingText,
      });
      return;
    }

    blocks.push({
      type: 'text',
      text: paragraph,
    });
  };

  const pushCodeBlock = () => {
    blocks.push({
      type: 'code',
      language: codeLanguage || '',
      code: codeLines.join('\n'),
    });
    codeLanguage = null;
    codeLines = [];
  };

  for (const line of String(text).replace(/\r\n/g, '\n').split('\n')) {
    const trimmed = line.trim();

    if (codeLanguage !== null) {
      if (trimmed === '```') {
        pushCodeBlock();
      } else {
        codeLines.push(line);
      }
      continue;
    }

    if (trimmed.startsWith('```')) {
      pushParagraph();
      blankLineRun = 0;
      codeLanguage = trimmed.slice(3).trim();
      codeLines = [];
      continue;
    }

    if (isPageBreakLine(line)) {
      pushParagraph();
      blankLineRun = 0;
      blocks.push({ type: 'pageBreak' });
      continue;
    }

    const imageId = parseImageMarker(line);
    if (imageId) {
      pushParagraph();
      blankLineRun = 0;
      blocks.push({
        type: 'image',
        id: imageId,
      });
      continue;
    }

    if (!line.trim()) {
      pushParagraph();
      blankLineRun += 1;
      if (blankLineRun > 1) {
        blocks.push({ type: 'spacer' });
      }
      continue;
    }

    blankLineRun = 0;
    paragraphLines.push(line.trim());
  }

  pushParagraph();
  if (codeLanguage !== null) pushCodeBlock();
  return blocks;
}

function canBreakBefore(char) {
  return !/[，。！？；：、,.!?;:）】》」』]/.test(char);
}

function measureCandidate(measureText, text, style) {
  return measureText(text, style);
}

function mergeRuns(runs) {
  const merged = [];
  for (const run of runs) {
    if (!run.text) continue;
    const previous = merged[merged.length - 1];
    if (previous && previous.fontWeight === run.fontWeight) {
      previous.text += run.text;
    } else {
      merged.push({ ...run });
    }
  }
  return merged;
}

export function parseInlineRuns(text, style = {}) {
  const normalWeight = style.fontWeight ?? 400;
  const boldWeight = style.boldWeight ?? 700;
  const runs = [];
  let bold = false;
  let buffer = '';

  const flush = () => {
    if (!buffer) return;
    runs.push({
      text: buffer,
      fontSize: style.fontSize,
      fontFamily: style.fontFamily,
      fontWeight: bold ? boldWeight : normalWeight,
      type: style.type,
    });
    buffer = '';
  };

  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === '*' && text[index + 1] === '*') {
      flush();
      bold = !bold;
      index += 1;
      continue;
    }
    buffer += text[index];
  }

  flush();
  return mergeRuns(runs);
}

function measureRuns(measureText, runs) {
  return runs.reduce((width, run) => width + measureText(run.text, run), 0);
}

function runsToItems(runs) {
  return runs.flatMap((run) =>
    Array.from(run.text).map((char) => ({
      char,
      fontSize: run.fontSize,
      fontFamily: run.fontFamily,
      fontWeight: run.fontWeight,
      type: run.type,
    })),
  );
}

function itemsToLine(items) {
  const runs = mergeRuns(
    items.map((item) => ({
      text: item.char,
      fontSize: item.fontSize,
      fontFamily: item.fontFamily,
      fontWeight: item.fontWeight,
      type: item.type,
    })),
  );

  return {
    text: runs.map((run) => run.text).join(''),
    runs,
  };
}

export function wrapParagraph(paragraph, settings, measureText, style = {}) {
  const maxWidth = settings.width - settings.marginLeft - settings.marginRight;
  const chars = Array.from(paragraph);
  const lines = [];
  let current = '';

  for (const char of chars) {
    const candidate = current + char;
    if (!current || measureCandidate(measureText, candidate, style) <= maxWidth) {
      current = candidate;
      continue;
    }

    if (!canBreakBefore(char) && current.length > 1) {
      const carried = current.slice(-1);
      lines.push(current.slice(0, -1));
      current = carried + char;
    } else {
      lines.push(current);
      current = char;
    }
  }

  if (current) lines.push(current);
  return lines;
}

export function wrapRichParagraph(paragraph, settings, measureText, style = {}) {
  const maxWidth = settings.width - settings.marginLeft - settings.marginRight;
  const items = runsToItems(parseInlineRuns(paragraph, style));
  const lines = [];
  let current = [];

  for (const item of items) {
    const candidate = [...current, item];
    if (!current.length || measureRuns(measureText, itemsToLine(candidate).runs) <= maxWidth) {
      current = candidate;
      continue;
    }

    if (!canBreakBefore(item.char) && current.length > 1) {
      const carried = current.pop();
      lines.push(itemsToLine(current));
      current = [carried, item];
    } else {
      lines.push(itemsToLine(current));
      current = [item];
    }
  }

  if (current.length) lines.push(itemsToLine(current));
  return lines;
}

function wrapCodeLine(line, settings, measureText, style) {
  const maxWidth = settings.width - settings.marginLeft - settings.marginRight - settings.codePaddingX * 2;
  const chars = Array.from(line);
  const lines = [];
  let current = '';

  for (const char of chars) {
    const candidate = current + char;
    if (!current || measureCandidate(measureText, candidate, style) <= maxWidth) {
      current = candidate;
      continue;
    }

    lines.push(current);
    current = char;
  }

  lines.push(current);
  return lines;
}

function createPage(index, settings) {
  return {
    index,
    width: settings.width,
    height: settings.height,
    backgroundColor: settings.backgroundColor,
    hasAuthorHeader: index === 0 && shouldShowFirstPageHeader(settings),
    blocks: [],
  };
}

export function computeFirstPageHeaderHeight(settings, measureText) {
  const authorMetrics = resolveAuthorHeaderMetrics(settings);
  const firstPageContentGap = Math.max(0, authorMetrics.headerContentGap + settings.marginTop - defaultMarginTop);
  const showTitle = shouldShowTitleHeader(settings);
  const showAuthor = shouldShowAuthorHeader(settings);
  if (!showTitle && !showAuthor) return settings.marginTop;

  if (!showTitle) {
    const authorY = resolveAuthorHeaderFlowY(settings);
    return authorY + Math.max(settings.authorHeaderHeight, authorMetrics.avatarSize + firstPageContentGap);
  }

  const titleStyle = {
    fontSize: settings.titleFontSize,
    fontFamily: settings.fontFamily,
    fontWeight: settings.titleFontWeight,
    letterSpacing: settings.titleLetterSpacing,
  };
  const titleLines = wrapParagraph(String(settings.articleTitle || '').trim(), settings, measureText, titleStyle);
  const titleHeight = titleLines.length * settings.titleLineHeight;
  const underlineHeight = settings.titleUnderlineGap + settings.titleUnderlineHeight;
  const titleBottom = settings.titleTop + titleHeight + underlineHeight;
  if (!showAuthor) return titleBottom + firstPageContentGap;

  const authorY = resolveAuthorHeaderFlowY(settings, titleBottom);
  return authorY + authorMetrics.avatarSize + firstPageContentGap;
}

function fitImageToBox(sourceWidth, sourceHeight, maxWidth, maxHeight) {
  const ratio = sourceHeight / sourceWidth;
  let width = Math.max(1, Math.min(sourceWidth, maxWidth));
  let height = Math.max(1, Math.round(width * ratio));

  if (height > maxHeight) {
    height = Math.max(1, Math.floor(maxHeight));
    width = Math.max(1, Math.round(height / ratio));
  }

  return { width, height };
}

export function layoutArticle(text, rawSettings = {}, measureText) {
  const settings = createDefaultSettings(rawSettings);
  if (typeof measureText !== 'function') {
    throw new TypeError('layoutArticle requires a measureText function');
  }

  const articleBlocks = parseArticleBlocks(text);
  const pages = [createPage(0, settings)];
  const bottom = settings.height - (settings.footerEnabled ? settings.footerHeight : settings.marginBottom);
  let page = pages[0];
  let y = page.hasAuthorHeader ? computeFirstPageHeaderHeight(settings, measureText) : settings.marginTop;

  const nextPage = () => {
    page = createPage(pages.length, settings);
    pages.push(page);
    y = settings.marginTop;
  };

  const pageHasOccupiedSpace = () => page.hasAuthorHeader || page.blocks.length > 0;

  for (const articleBlock of articleBlocks) {
    if (articleBlock.type === 'pageBreak') {
      if (page.blocks.length) {
        nextPage();
      }
      continue;
    }

    if (articleBlock.type === 'spacer') {
      if (pageHasOccupiedSpace() && y + settings.lineHeight > bottom) {
        nextPage();
      }
      page.blocks.push({
        type: 'spacer',
        y,
        height: settings.lineHeight,
      });
      y += settings.lineHeight;
      continue;
    }

    if (articleBlock.type === 'image') {
      const availableWidth = settings.width - settings.marginLeft - settings.marginRight;
      const imageInfo = settings.images?.[articleBlock.id] ?? {};
      const sourceWidth = imageInfo.width || availableWidth;
      const sourceHeight = imageInfo.height || Math.round(availableWidth * 0.66);
      const fullSize = fitImageToBox(sourceWidth, sourceHeight, availableWidth, bottom - settings.marginTop);
      let width = fullSize.width;
      let height = fullSize.height;

      if (y + height > bottom) {
        const remainingHeight = bottom - y;
        const fittedSize = fitImageToBox(sourceWidth, sourceHeight, availableWidth, remainingHeight);
        const minReadableHeight = Math.min(settings.imageMinFitHeight, fullSize.height);
        const minReadableWidth = Math.min(settings.imageMinFitWidth, fullSize.width);

        if (
          fittedSize.height >= minReadableHeight &&
          fittedSize.width >= minReadableWidth &&
          fittedSize.height <= remainingHeight
        ) {
          width = fittedSize.width;
          height = fittedSize.height;
        } else if (page.blocks.length) {
          const compactY = Math.max(settings.marginTop, y - Math.max(0, settings.paragraphGap - settings.imageBeforeGap));
          const compactRemainingHeight = bottom - compactY;
          const compactFittedSize = fitImageToBox(sourceWidth, sourceHeight, availableWidth, compactRemainingHeight);

          if (
            compactFittedSize.height >= minReadableHeight &&
            compactFittedSize.width >= minReadableWidth &&
            compactFittedSize.height <= compactRemainingHeight
          ) {
            y = compactY;
            width = compactFittedSize.width;
            height = compactFittedSize.height;
          } else {
            nextPage();
            ({ width, height } = fitImageToBox(sourceWidth, sourceHeight, availableWidth, bottom - y));
          }
        } else {
          nextPage();
          ({ width, height } = fitImageToBox(sourceWidth, sourceHeight, availableWidth, bottom - y));
        }
      }

      const x = settings.marginLeft + Math.round((availableWidth - width) / 2);

      page.blocks.push({
        type: 'image',
        id: articleBlock.id,
        x,
        y,
        width,
        height,
      });
      y += height + settings.imageGap;
      continue;
    }

    if (articleBlock.type === 'code') {
      const availableWidth = settings.width - settings.marginLeft - settings.marginRight;
      const codeStyle = {
        fontSize: settings.codeFontSize,
        fontFamily: settings.codeFontFamily,
        fontWeight: 400,
        type: 'code',
      };
      const codeLines = String(articleBlock.code)
        .split('\n')
        .flatMap((line) => wrapCodeLine(line, settings, measureText, codeStyle))
        .map((line) => ({ ...codeStyle, text: line }));

      let remaining = codeLines.length ? [...codeLines] : [{ ...codeStyle, text: '' }];

      while (remaining.length) {
        let maxLines = Math.floor((bottom - y - settings.codePaddingY * 2) / settings.codeLineHeight);
        if (maxLines < 1 && pageHasOccupiedSpace()) {
          nextPage();
          maxLines = Math.floor((bottom - y - settings.codePaddingY * 2) / settings.codeLineHeight);
        }
        maxLines = Math.max(1, maxLines);

        const lines = remaining.splice(0, maxLines);
        const height = settings.codePaddingY * 2 + lines.length * settings.codeLineHeight;

        page.blocks.push({
          type: 'code',
          language: articleBlock.language,
          x: settings.marginLeft,
          y,
          width: availableWidth,
          height,
          lines,
        });

        y += height + settings.codeGap;
        if (remaining.length) nextPage();
      }
      continue;
    }

    if (articleBlock.type === 'heading') {
      const style = {
        fontSize: settings.headingFontSize,
        fontFamily: settings.fontFamily,
        fontWeight: 800,
        type: 'heading',
      };
      const lines = wrapParagraph(articleBlock.text, settings, measureText, style);
      const requiredHeight = lines.length * settings.headingLineHeight + settings.headingGap;
      if (pageHasOccupiedSpace() && y + requiredHeight > bottom) {
        nextPage();
      }

      for (const line of lines) {
        if (y + settings.headingFontSize > bottom && pageHasOccupiedSpace()) {
          nextPage();
        }
        page.blocks.push({
          ...style,
          text: line,
          runs: [{ ...style, text: line }],
          x: settings.marginLeft + settings.headingBarWidth + 24,
          y,
        });
        y += settings.headingLineHeight;
      }

      y += settings.headingGap;
      continue;
    }

    const paragraph = articleBlock.text;
    const section = isSectionMarker(paragraph);
    const style = {
      fontSize: settings.fontSize,
      fontFamily: settings.fontFamily,
      fontWeight: section ? 700 : settings.fontWeight,
      type: section ? 'section' : 'body',
    };
    const lines = paragraph.split('\n').flatMap((hardLine) =>
      section
        ? wrapParagraph(hardLine, settings, measureText, style).map((line) => ({
            text: line,
            runs: [{ ...style, text: line }],
          }))
        : wrapRichParagraph(hardLine, settings, measureText, style),
    );

    if (pageHasOccupiedSpace() && y + settings.lineHeight > bottom) {
      nextPage();
    }

    for (const line of lines) {
      if (y + settings.fontSize > bottom && pageHasOccupiedSpace()) {
        nextPage();
      }
      page.blocks.push({
        ...style,
        text: line.text,
        runs: line.runs,
        x: settings.marginLeft,
        y,
      });
      y += settings.lineHeight;
    }

    y += settings.paragraphGap;
  }

  return pages;
}
