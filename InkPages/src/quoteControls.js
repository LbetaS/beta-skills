function normalizeColor(color) {
  return String(color ?? '').trim().toLowerCase();
}

export function setQuotePopoverOpen(button, popover, open, focusTarget = null, openFocusTargets = []) {
  const nextOpen = Boolean(open);
  popover.hidden = !nextOpen;
  button.setAttribute('aria-expanded', String(nextOpen));

  if (nextOpen) {
    const selectedTarget = openFocusTargets.find(
      (target) => target.getAttribute?.('aria-pressed') === 'true',
    );
    const openFocusTarget = selectedTarget || openFocusTargets[0];
    openFocusTarget?.focus?.({ preventScroll: true });
  } else if (typeof focusTarget?.focus === 'function') {
    focusTarget.focus({ preventScroll: true });
  }

  return nextOpen;
}

export function syncQuoteColorControls(swatches, color) {
  const currentColor = normalizeColor(color);

  for (const swatch of swatches) {
    const isCurrent = normalizeColor(swatch.dataset.quoteColor) === currentColor;
    swatch.setAttribute('aria-pressed', String(isCurrent));
  }
}

export function applyQuoteColor(
  colorControl,
  swatches,
  color,
  createInputEvent = () => new Event('input', { bubbles: true }),
) {
  colorControl.value = normalizeColor(color);
  syncQuoteColorControls(swatches, colorControl.value);
  colorControl.dispatchEvent(createInputEvent());
}

export function shouldRenderControlChange(control) {
  return String(control?.type ?? '').toLowerCase() !== 'color';
}
