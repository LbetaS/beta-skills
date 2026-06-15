export function wrapBoldSelection(value, selectionStart, selectionEnd, placeholder = '加粗文字') {
  const text = String(value);
  const start = Math.max(0, Math.min(selectionStart, text.length));
  const end = Math.max(start, Math.min(selectionEnd, text.length));
  const hasSelection = start !== end;
  const selected = text.slice(start, end) || placeholder;
  const replacement =
    hasSelection && selected.includes('\n')
      ? selected
          .split('\n')
          .map((line) => (line.trim() ? `**${line}**` : line))
          .join('\n')
      : `**${selected}**`;
  const cursorAfterMarker = start + replacement.length;

  return {
    value: text.slice(0, start) + replacement + text.slice(end),
    selectionStart: hasSelection ? cursorAfterMarker : start + 2,
    selectionEnd: hasSelection ? cursorAfterMarker : start + 2 + selected.length,
  };
}

function clampSelection(text, selectionStart, selectionEnd) {
  const start = Math.max(0, Math.min(selectionStart, text.length));
  const end = Math.max(start, Math.min(selectionEnd, text.length));
  return { start, end };
}

function lineStartAt(text, index) {
  return text.lastIndexOf('\n', Math.max(0, index - 1)) + 1;
}

function lineEndAt(text, index) {
  const nextBreak = text.indexOf('\n', index);
  return nextBreak === -1 ? text.length : nextBreak;
}

function bulletLine(line, bullet) {
  if (!line.trim()) return line;
  const leading = line.match(/^\s*/)?.[0] ?? '';
  const content = line.slice(leading.length);
  return content.startsWith(bullet) ? line : `${leading}${bullet}${content}`;
}

export function applyBulletList(value, selectionStart, selectionEnd, bullet = '• ') {
  const text = String(value);
  const { start, end } = clampSelection(text, selectionStart, selectionEnd);

  if (start === end) {
    const currentLineStart = lineStartAt(text, start);
    const currentLineEnd = lineEndAt(text, start);
    const currentLine = text.slice(currentLineStart, currentLineEnd);

    if (!currentLine.trim()) {
      return {
        value: text.slice(0, start) + bullet + text.slice(end),
        selectionStart: start + bullet.length,
        selectionEnd: start + bullet.length,
      };
    }

    const nextLine = bulletLine(currentLine, bullet);
    const offset = nextLine.length - currentLine.length;
    return {
      value: text.slice(0, currentLineStart) + nextLine + text.slice(currentLineEnd),
      selectionStart: start + offset,
      selectionEnd: start + offset,
    };
  }

  const blockStart = lineStartAt(text, start);
  const blockEnd = lineEndAt(text, end);
  const block = text.slice(blockStart, blockEnd);
  const nextBlock = block
    .split('\n')
    .map((line) => bulletLine(line, bullet))
    .join('\n');

  return {
    value: text.slice(0, blockStart) + nextBlock + text.slice(blockEnd),
    selectionStart: blockStart,
    selectionEnd: blockStart + nextBlock.length,
  };
}

export function insertImageReference(value, imageId, selectionStart, selectionEnd) {
  const text = String(value);
  const { start, end } = clampSelection(text, selectionStart, selectionEnd);
  const before = text.slice(0, start).replace(/[ \t]*\n*$/, '');
  const after = text.slice(end).replace(/^\n*[ \t]*/, '');
  const marker = `[[图片:${imageId}]]`;
  const prefix = before ? `${before}\n\n` : '';
  const suffix = after ? `\n\n${after}` : '\n\n';
  const cursor = prefix.length + marker.length + 2;

  return {
    value: `${prefix}${marker}${suffix}`,
    selectionStart: cursor,
    selectionEnd: cursor,
  };
}

const imageMarkerPattern = /^\[\[(?:图片|image):([A-Za-z0-9_-]+)\]\]$/;

export function extractReferencedImageIds(value) {
  const ids = [];
  const seen = new Set();

  for (const line of String(value).replace(/\r\n/g, '\n').split('\n')) {
    const match = line.trim().match(imageMarkerPattern);
    if (!match || seen.has(match[1])) continue;
    seen.add(match[1]);
    ids.push(match[1]);
  }

  return ids;
}

export function removeImageReference(value, imageId) {
  return String(value)
    .replace(/\r\n/g, '\n')
    .split('\n')
    .filter((line) => {
      const match = line.trim().match(imageMarkerPattern);
      return !match || match[1] !== imageId;
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
