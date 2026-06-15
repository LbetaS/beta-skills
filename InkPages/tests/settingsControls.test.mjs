import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as settingsControls from '../src/settingsControls.js';

const { readSettingControlValue } = settingsControls;

test('readSettingControlValue keeps the current numeric value while an input is empty', () => {
  assert.equal(
    readSettingControlValue(1080, {
      type: 'number',
      value: '',
    }),
    1080,
  );
});

test('applyColorPresetToControls applies dark mode colors to matching controls', () => {
  assert.equal(typeof settingsControls.applyColorPresetToControls, 'function');

  const controls = [
    { dataset: { setting: 'backgroundColor' }, value: '#ffffff' },
    { dataset: { setting: 'textColor' }, value: '#111111' },
    { dataset: { setting: 'pageNumberColor' }, value: '#b8895b' },
    { dataset: { setting: 'fontSize' }, value: '43' },
  ];

  settingsControls.applyColorPresetToControls(controls, settingsControls.darkModeColorPreset);

  assert.equal(controls[0].value, '#0f0d0a');
  assert.equal(controls[1].value, '#f1ece4');
  assert.equal(controls[2].value, '#1f5966');
  assert.equal(controls[3].value, '43');
});

test('readSettingControlValue keeps the current numeric value for invalid input', () => {
  assert.equal(
    readSettingControlValue(1440, {
      type: 'number',
      value: 'not-a-number',
    }),
    1440,
  );
});

test('readSettingControlValue accepts zero and negative range values', () => {
  assert.equal(
    readSettingControlValue(0, {
      type: 'range',
      value: '-40',
    }),
    -40,
  );
});

test('readSettingControlValue clamps number inputs to their declared limits', () => {
  assert.equal(
    readSettingControlValue(1080, {
      type: 'number',
      value: '999999',
      min: '720',
      max: '2160',
    }),
    2160,
  );
  assert.equal(
    readSettingControlValue(1440, {
      type: 'number',
      value: '12',
      min: '960',
      max: '2880',
    }),
    960,
  );
});

test('readSettingControlValue reads checkbox and text values', () => {
  assert.equal(readSettingControlValue(false, { type: 'checkbox', checked: true }), true);
  assert.equal(readSettingControlValue('', { type: 'text', value: '新标题' }), '新标题');
});
