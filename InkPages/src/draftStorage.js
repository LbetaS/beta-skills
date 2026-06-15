export function readDraft(storage, key, fallback = '') {
  try {
    return storage?.getItem(key) || fallback;
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
