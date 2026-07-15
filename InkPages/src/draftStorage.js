export function readDraft(storage, key, fallback = '') {
  try {
    const value = storage?.getItem(key);
    return typeof value === 'string' ? value : fallback;
  } catch {
    return fallback;
  }
}

export function writeDraft(storage, key, value) {
  try {
    storage?.setItem(key, value);
    return Boolean(storage);
  } catch {
    return false;
  }
}
