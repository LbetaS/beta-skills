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

function paragraphStartAt(text, index) {
  const before = text.slice(0, index);
  const separators = Array.from(before.matchAll(/\n(?:[ \t\r]*\n)+/g));
  const separator = separators[separators.length - 1];
  return separator ? separator.index + separator[0].length : 0;
}

function paragraphEndAt(text, index) {
  const separator = text.slice(index).match(/\n(?:[ \t\r]*\n)+/);
  return separator ? index + separator.index : text.length;
}

function quotePrefixLength(content, prefix) {
  if (content.startsWith(prefix)) return prefix.length;

  const compactPrefix = prefix.trimEnd();
  if (compactPrefix !== prefix && compactPrefix && content.startsWith(compactPrefix)) {
    return compactPrefix.length;
  }

  return 0;
}

function quoteLine(line, remove, prefix) {
  if (!line.trim()) return line;
  const leading = line.match(/^[ \t]*/)?.[0] ?? '';
  const content = line.slice(leading.length);

  if (remove) return `${leading}${content.slice(quotePrefixLength(content, prefix))}`;
  return content.startsWith(prefix) ? line : `${leading}${prefix}${content}`;
}

function mapQuoteOffset(lines, relativeOffset, remove, prefix, affinity) {
  let sourceLineStart = 0;
  let delta = 0;

  for (const line of lines) {
    if (line.trim()) {
      const leadingLength = line.match(/^[ \t]*/)?.[0].length ?? 0;
      const content = line.slice(leadingLength);
      const prefixStart = sourceLineStart + leadingLength;

      if (remove) {
        const removedPrefixLength = quotePrefixLength(content, prefix);
        const prefixEnd = prefixStart + removedPrefixLength;
        if (relativeOffset > prefixStart && relativeOffset < prefixEnd) {
          return prefixStart + delta;
        }
        if (relativeOffset >= prefixEnd) delta -= removedPrefixLength;
      } else if (!content.startsWith(prefix)) {
        if (relativeOffset > prefixStart || (relativeOffset === prefixStart && affinity === 'right')) {
          delta += prefix.length;
        }
      }
    }

    sourceLineStart += line.length + 1;
  }

  return Math.max(0, relativeOffset + delta);
}

export function toggleQuoteSelection(value, selectionStart, selectionEnd, prefix = '> ') {
  const text = String(value);
  const { start, end } = clampSelection(text, selectionStart, selectionEnd);
  const hasSelection = start !== end;

  if (!hasSelection) {
    const currentLine = text.slice(lineStartAt(text, start), lineEndAt(text, start));
    if (!currentLine.trim()) {
      return { value: text, selectionStart: start, selectionEnd: end };
    }
  }

  const blockStart = hasSelection ? lineStartAt(text, start) : paragraphStartAt(text, start);
  const selectionEndsAtLineStart = hasSelection && lineStartAt(text, end) === end;
  const selectedLineEnd = selectionEndsAtLineStart ? end - 1 : end;
  const blockEnd = hasSelection ? lineEndAt(text, selectedLineEnd) : paragraphEndAt(text, end);
  const block = text.slice(blockStart, blockEnd);
  const lines = block.split('\n');
  const nonEmptyLines = lines.filter((line) => line.trim());
  const remove =
    nonEmptyLines.length > 0 &&
    nonEmptyLines.every((line) => {
      const leadingLength = line.match(/^[ \t]*/)?.[0].length ?? 0;
      return quotePrefixLength(line.slice(leadingLength), prefix) > 0;
    });
  const nextBlock = lines.map((line) => quoteLine(line, remove, prefix)).join('\n');
  const nextStart = mapQuoteOffset(lines, start - blockStart, remove, prefix, hasSelection ? 'left' : 'right');
  const nextEnd = mapQuoteOffset(lines, end - blockStart, remove, prefix, 'right');

  return {
    value: text.slice(0, blockStart) + nextBlock + text.slice(blockEnd),
    selectionStart: blockStart + nextStart,
    selectionEnd: blockStart + nextEnd,
  };
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
  const selectionEndsAtLineStart = lineStartAt(text, end) === end;
  const selectedLineEnd = selectionEndsAtLineStart ? end - 1 : end;
  const blockEnd = lineEndAt(text, selectedLineEnd);
  const block = text.slice(blockStart, blockEnd);
  const nextBlock = block
    .split('\n')
    .map((line) => bulletLine(line, bullet))
    .join('\n');

  return {
    value: text.slice(0, blockStart) + nextBlock + text.slice(blockEnd),
    selectionStart: blockStart,
    selectionEnd: selectionEndsAtLineStart
      ? end + nextBlock.length - block.length
      : blockStart + nextBlock.length,
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
