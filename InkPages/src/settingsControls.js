export const darkModeColorPreset = {
  backgroundColor: '#0f0d0a',
  textColor: '#f1ece4',
  pageNumberColor: '#1f5966',
};

export function applyColorPresetToControls(controls, preset) {
  for (const control of controls) {
    const setting = control.dataset?.setting;
    if (setting && Object.hasOwn(preset, setting)) {
      control.value = preset[setting];
    }
  }
}

export function readSettingControlValue(currentValue, control) {
  if (control.type === 'checkbox') {
    return control.checked;
  }

  if (control.type === 'number' || control.type === 'range') {
    const rawValue = String(control.value ?? '').trim();
    if (!rawValue) return currentValue;

    const numericValue = Number(rawValue);
    if (!Number.isFinite(numericValue)) return currentValue;

    const minimum = Number(control.min);
    const maximum = Number(control.max);
    const boundedMinimum = control.min !== '' && Number.isFinite(minimum) ? minimum : -Infinity;
    const boundedMaximum = control.max !== '' && Number.isFinite(maximum) ? maximum : Infinity;
    return Math.min(boundedMaximum, Math.max(boundedMinimum, numericValue));
  }

  return control.value;
}
