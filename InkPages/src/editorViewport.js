export function captureEditorViewport(textarea, scrollContainer) {
  const documentScroll = textarea.ownerDocument?.scrollingElement;

  return {
    selectionStart: textarea.selectionStart,
    selectionEnd: textarea.selectionEnd,
    scrollTop: textarea.scrollTop,
    scrollLeft: textarea.scrollLeft,
    containerScrollTop: scrollContainer?.scrollTop ?? 0,
    containerScrollLeft: scrollContainer?.scrollLeft ?? 0,
    documentScrollTop: documentScroll?.scrollTop ?? 0,
    documentScrollLeft: documentScroll?.scrollLeft ?? 0,
    active: textarea.ownerDocument?.activeElement === textarea,
  };
}

function restoreScrollPositions(textarea, scrollContainer, documentScroll, snapshot) {
  textarea.scrollTop = snapshot.scrollTop;
  textarea.scrollLeft = snapshot.scrollLeft;

  if (scrollContainer) {
    scrollContainer.scrollTop = snapshot.containerScrollTop;
    scrollContainer.scrollLeft = snapshot.containerScrollLeft;
  }

  if (documentScroll) {
    documentScroll.scrollTop = snapshot.documentScrollTop ?? documentScroll.scrollTop;
    documentScroll.scrollLeft = snapshot.documentScrollLeft ?? documentScroll.scrollLeft;
  }
}

export function restoreEditorViewport(textarea, scrollContainer, snapshot) {
  const documentScroll = textarea.ownerDocument?.scrollingElement;

  if (snapshot.active) {
    textarea.focus({ preventScroll: true });
    textarea.setSelectionRange(snapshot.selectionStart, snapshot.selectionEnd);
  }

  restoreScrollPositions(textarea, scrollContainer, documentScroll, snapshot);

  const scheduleFrame = textarea.ownerDocument?.defaultView?.requestAnimationFrame || globalThis.requestAnimationFrame;
  if (typeof scheduleFrame === 'function') {
    scheduleFrame(() => restoreScrollPositions(textarea, scrollContainer, documentScroll, snapshot));
  }
}
