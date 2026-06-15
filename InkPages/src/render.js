import {
  createDefaultSettings,
  layoutArticle,
  resolveAuthorHeaderMetrics,
  resolveAuthorHeaderY,
  shouldShowAuthorHeader,
  shouldShowTitleHeader,
  wrapParagraph,
} from './layout.js';

export function makeCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function resolveLetterSpacing(style = {}) {
  const letterSpacing = Number(style.letterSpacing);
  return Number.isFinite(letterSpacing) ? letterSpacing : 0;
}

function measureTextWidth(context, text, style = {}) {
  const letterSpacing = resolveLetterSpacing(style);
  const textWidth = context.measureText(text).width;
  const gapCount = Math.max(0, Array.from(String(text)).length - 1);
  return textWidth + gapCount * letterSpacing;
}

function drawText(context, text, x, y, style = {}) {
  const letterSpacing = resolveLetterSpacing(style);
  if (!letterSpacing) {
    context.fillText(text, x, y);
    return;
  }

  let cursorX = x;
  for (const char of Array.from(String(text))) {
    context.fillText(char, cursorX, y);
    cursorX += context.measureText(char).width + letterSpacing;
  }
}

export function makeCanvasMeasurer(settings) {
  const canvas = makeCanvas(10, 10);
  const context = canvas.getContext('2d');
  return (text, style = {}) => {
    const size = style.fontSize ?? settings.fontSize;
    const weight = style.fontWeight ?? 400;
    const family = style.fontFamily ?? settings.fontFamily;
    context.fontKerning = 'normal';
    context.letterSpacing = '0px';
    context.font = `${weight} ${size}px ${family}`;
    return measureTextWidth(context, text, style);
  };
}

function measureWithContext(context, settings) {
  return (text, style = {}) => {
    const size = style.fontSize ?? settings.fontSize;
    const weight = style.fontWeight ?? 400;
    const family = style.fontFamily ?? settings.fontFamily;
    context.font = `${weight} ${size}px ${family}`;
    return measureTextWidth(context, text, style);
  };
}

function drawAuthorHeader(context, settings, avatarImage, avatarY) {
  const authorMetrics = resolveAuthorHeaderMetrics(settings);
  const avatarSize = authorMetrics.avatarSize;
  const avatarX = settings.marginLeft;
  const nameX = avatarX + avatarSize + Math.round(avatarSize * 0.22);
  const nameY = avatarY + Math.round(avatarSize * 0.06);
  const dateY = avatarY + Math.round(avatarSize * 0.45);

  context.textBaseline = 'top';
  context.save();
  context.beginPath();
  context.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
  context.clip();

  if (avatarImage) {
    const side = Math.min(avatarImage.naturalWidth || avatarImage.width, avatarImage.naturalHeight || avatarImage.height);
    const sx = ((avatarImage.naturalWidth || avatarImage.width) - side) / 2;
    const sy = ((avatarImage.naturalHeight || avatarImage.height) - side) / 2;
    context.drawImage(avatarImage, sx, sy, side, side, avatarX, avatarY, avatarSize, avatarSize);
  } else {
    const gradient = context.createLinearGradient(avatarX, avatarY, avatarX + avatarSize, avatarY + avatarSize);
    gradient.addColorStop(0, '#1d9bf0');
    gradient.addColorStop(1, '#b7e2ff');
    context.fillStyle = gradient;
    context.fillRect(avatarX, avatarY, avatarSize, avatarSize);
  }
  context.restore();

  context.fillStyle = settings.textColor;
  context.font = `700 ${authorMetrics.authorNameFontSize}px ${settings.fontFamily}`;
  context.fillText(settings.authorName || '霖贝塔', nameX, nameY);
  context.fillStyle = settings.footerTextColor;
  context.font = `${settings.fontWeight} ${authorMetrics.authorDateFontSize}px ${settings.fontFamily}`;
  context.fillText(settings.authorDate || '05/15', nameX, dateY);
}

function drawFirstPageHeader(context, settings, avatarImage) {
  const showTitle = shouldShowTitleHeader(settings);
  const showAuthor = shouldShowAuthorHeader(settings);
  context.textBaseline = 'top';

  if (!showTitle) {
    if (showAuthor) drawAuthorHeader(context, settings, avatarImage, resolveAuthorHeaderY(settings));
    return;
  }

  const title = String(settings.articleTitle || '').trim();
  if (!title) {
    drawAuthorHeader(context, settings, avatarImage, settings.marginTop);
    return;
  }

  const titleStyle = {
    fontSize: settings.titleFontSize,
    fontFamily: settings.fontFamily,
    fontWeight: settings.titleFontWeight,
    letterSpacing: settings.titleLetterSpacing,
  };
  const titleLines = wrapParagraph(title, settings, measureWithContext(context, settings), titleStyle);
  let y = settings.titleTop;

  context.fillStyle = settings.textColor;
  context.font = `${settings.titleFontWeight} ${settings.titleFontSize}px ${settings.fontFamily}`;
  for (const line of titleLines) {
    drawText(context, line, settings.marginLeft, y, titleStyle);
    y += settings.titleLineHeight;
  }

  y += settings.titleUnderlineGap;
  context.fillStyle = settings.accentColor;
  context.fillRect(settings.marginLeft, y, settings.titleUnderlineWidth, settings.titleUnderlineHeight);

  y += settings.titleUnderlineHeight;
  if (showAuthor) {
    drawAuthorHeader(context, settings, avatarImage, resolveAuthorHeaderY(settings, y));
  }
}

export function formatPageNumber(currentPage, totalPages) {
  return `${currentPage} / ${totalPages}`;
}

function drawPageNumber(context, page, settings, totalPages) {
  context.save();
  context.textAlign = 'right';
  context.textBaseline = 'top';
  context.fillStyle = settings.pageNumberColor;
  context.font = `700 30px ${settings.fontFamily}`;
  context.fillText(formatPageNumber(page.index + 1, totalPages), settings.width - settings.marginRight, settings.height - 132);
  context.restore();
}

function drawFooter(context, page, settings, totalPages) {
  if (!settings.footerEnabled) {
    drawPageNumber(context, page, settings, totalPages);
    return;
  }

  const lineY = settings.height - settings.footerHeight + 36;
  const textY = settings.height - 132;
  const footerTitle = String(settings.footerTitle || settings.articleTitle || '').trim();

  context.save();
  context.strokeStyle = settings.footerLineColor;
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(settings.marginLeft, lineY);
  context.lineTo(settings.width - settings.marginRight, lineY);
  context.stroke();

  if (footerTitle) {
    context.textAlign = 'left';
    context.textBaseline = 'top';
    context.fillStyle = settings.footerTextColor;
    context.font = `400 24px ${settings.fontFamily}`;
    context.fillText(footerTitle, settings.marginLeft, textY);
  }
  context.restore();
  drawPageNumber(context, page, settings, totalPages);
}

export function drawPage(page, settings, avatarImage, totalPages = page.index + 1) {
  const canvas = makeCanvas(settings.width, settings.height);
  const context = canvas.getContext('2d');

  context.fillStyle = settings.backgroundColor;
  context.fillRect(0, 0, settings.width, settings.height);

  if (page.hasAuthorHeader) {
    drawFirstPageHeader(context, settings, avatarImage);
  }

  context.textBaseline = 'top';
  context.fontKerning = 'normal';
  context.letterSpacing = '0px';
  context.fillStyle = settings.textColor;
  for (const block of page.blocks) {
    if (block.type === 'spacer') {
      continue;
    }

    if (block.type === 'image') {
      const image = settings.images?.[block.id]?.image;
      if (image) {
        context.drawImage(image, block.x, block.y, block.width, block.height);
      } else {
        context.strokeStyle = '#d0d0ca';
        context.lineWidth = 2;
        context.strokeRect(block.x, block.y, block.width, block.height);
        context.fillStyle = '#777';
        context.font = `400 28px ${settings.fontFamily}`;
        context.fillText('图片未加载', block.x + 24, block.y + 24);
        context.fillStyle = settings.textColor;
      }
      continue;
    }

    if (block.type === 'code') {
      context.fillStyle = settings.codeBackgroundColor;
      context.fillRect(block.x, block.y, block.width, block.height);
      context.strokeStyle = settings.codeBorderColor;
      context.lineWidth = 2;
      context.strokeRect(block.x, block.y, block.width, block.height);

      context.fillStyle = settings.codeTextColor;
      context.font = `400 ${settings.codeFontSize}px ${settings.codeFontFamily}`;
      let lineY = block.y + settings.codePaddingY;
      for (const line of block.lines) {
        context.fillText(line.text, block.x + settings.codePaddingX, lineY);
        lineY += settings.codeLineHeight;
      }
      context.fillStyle = settings.textColor;
      continue;
    }

    if (block.type === 'heading') {
      context.fillStyle = settings.accentColor;
      context.fillRect(settings.marginLeft, block.y + 4, settings.headingBarWidth, settings.headingFontSize);
      let x = block.x;
      const runs = block.runs?.length ? block.runs : [block];
      for (const run of runs) {
        context.font = `${run.fontWeight ?? block.fontWeight} ${run.fontSize ?? block.fontSize}px ${settings.fontFamily}`;
        context.fillText(run.text, x, block.y);
        x += context.measureText(run.text).width;
      }
      context.fillStyle = settings.textColor;
      continue;
    }

    let x = block.x;
    const runs = block.runs?.length ? block.runs : [block];
    for (const run of runs) {
      context.font = `${run.fontWeight ?? block.fontWeight} ${run.fontSize ?? block.fontSize}px ${settings.fontFamily}`;
      context.fillText(run.text, x, block.y);
      x += context.measureText(run.text).width;
    }
  }

  drawFooter(context, page, settings, totalPages);

  return canvas;
}

export function renderArticle(text, rawSettings, avatarImage) {
  const settings = createDefaultSettings(rawSettings);
  const measureText = makeCanvasMeasurer(settings);
  const pages = layoutArticle(text, settings, measureText);
  return {
    settings,
    pages,
    canvases: pages.map((page) => drawPage(page, settings, avatarImage, pages.length)),
  };
}

export function downloadCanvas(canvas, filename) {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, 'image/png');
}
