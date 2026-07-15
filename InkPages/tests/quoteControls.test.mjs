import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  applyQuoteColor,
  setQuotePopoverOpen,
  shouldRenderControlChange,
  syncQuoteColorControls,
} from '../src/quoteControls.js';

function createAttributeElement(initialAttributes = {}) {
  const attributes = new Map(Object.entries(initialAttributes));

  return {
    hidden: false,
    setAttribute(name, value) {
      attributes.set(name, String(value));
    },
    getAttribute(name) {
      return attributes.get(name) ?? null;
    },
  };
}

function createSwatch(color) {
  return {
    ...createAttributeElement({ 'aria-pressed': 'false' }),
    dataset: { quoteColor: color },
  };
}

test('setQuotePopoverOpen keeps hidden and aria-expanded in sync', () => {
  const button = createAttributeElement({ 'aria-expanded': 'false' });
  const popover = createAttributeElement();
  popover.hidden = true;

  setQuotePopoverOpen(button, popover, true);
  assert.equal(popover.hidden, false);
  assert.equal(button.getAttribute('aria-expanded'), 'true');

  setQuotePopoverOpen(button, popover, false);
  assert.equal(popover.hidden, true);
  assert.equal(button.getAttribute('aria-expanded'), 'false');
});

test('setQuotePopoverOpen focuses an optional target only when closing', () => {
  const button = createAttributeElement({ 'aria-expanded': 'false' });
  const popover = createAttributeElement();
  const focusCalls = [];
  const focusTarget = {
    focus(options) {
      focusCalls.push(options);
    },
  };

  setQuotePopoverOpen(button, popover, true, focusTarget);
  assert.deepEqual(focusCalls, []);

  setQuotePopoverOpen(button, popover, false, focusTarget);
  assert.deepEqual(focusCalls, [{ preventScroll: true }]);
});

test('setQuotePopoverOpen focuses the selected swatch when opening and falls back to the first', () => {
  const button = createAttributeElement({ 'aria-expanded': 'false' });
  const popover = createAttributeElement();
  const first = createSwatch('#155b67');
  const selected = createSwatch('#b64535');
  const focusCalls = [];
  first.focus = (options) => focusCalls.push({ target: 'first', options });
  selected.focus = (options) => focusCalls.push({ target: 'selected', options });
  selected.setAttribute('aria-pressed', 'true');

  setQuotePopoverOpen(button, popover, true, null, [first, selected]);
  assert.deepEqual(focusCalls, [{ target: 'selected', options: { preventScroll: true } }]);

  focusCalls.length = 0;
  selected.setAttribute('aria-pressed', 'false');
  setQuotePopoverOpen(button, popover, true, null, [first, selected]);
  assert.deepEqual(focusCalls, [{ target: 'first', options: { preventScroll: true } }]);
});

test('syncQuoteColorControls marks only the matching preset as pressed', () => {
  const swatches = [createSwatch('#155b67'), createSwatch('#B64535'), createSwatch('#b8892d')];

  syncQuoteColorControls(swatches, '#b64535');

  assert.deepEqual(
    swatches.map((swatch) => swatch.getAttribute('aria-pressed')),
    ['false', 'true', 'false'],
  );
});

test('applyQuoteColor updates the global control, swatches and dispatches input', () => {
  const swatches = [createSwatch('#155b67'), createSwatch('#b64535')];
  const dispatched = [];
  const colorControl = {
    value: '#155b67',
    dispatchEvent(event) {
      dispatched.push(event);
      return true;
    },
  };
  const inputEvent = { type: 'input', bubbles: true };

  applyQuoteColor(colorControl, swatches, '#b64535', () => inputEvent);

  assert.equal(colorControl.value, '#b64535');
  assert.equal(swatches[0].getAttribute('aria-pressed'), 'false');
  assert.equal(swatches[1].getAttribute('aria-pressed'), 'true');
  assert.deepEqual(dispatched, [inputEvent]);
});

test('shouldRenderControlChange skips duplicate color changes and keeps other settings', () => {
  assert.equal(shouldRenderControlChange({ type: 'color' }), false);
  assert.equal(shouldRenderControlChange({ type: 'range' }), true);
  assert.equal(shouldRenderControlChange({ type: 'text' }), true);
  assert.equal(shouldRenderControlChange({ type: 'checkbox' }), true);
});
