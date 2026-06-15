function normalizeSnapshot(snapshot) {
  const value = String(snapshot?.value ?? '');
  const selectionStart = Math.max(0, Math.min(Number(snapshot?.selectionStart) || 0, value.length));
  const selectionEnd = Math.max(selectionStart, Math.min(Number(snapshot?.selectionEnd) || 0, value.length));

  return {
    value,
    selectionStart,
    selectionEnd,
  };
}

function sameSnapshot(left, right) {
  return (
    left.value === right.value &&
    left.selectionStart === right.selectionStart &&
    left.selectionEnd === right.selectionEnd
  );
}

export function createEditorHistory(initialSnapshot, limit = 100) {
  const maximum = Math.max(2, Number(limit) || 100);
  const entries = [
    {
      snapshot: normalizeSnapshot(initialSnapshot),
      group: null,
    },
  ];

  return {
    record(snapshot, { group = null } = {}) {
      const nextSnapshot = normalizeSnapshot(snapshot);
      const current = entries.at(-1);
      if (sameSnapshot(current.snapshot, nextSnapshot)) return false;

      if (group && current.group === group) {
        current.snapshot = nextSnapshot;
      } else {
        entries.push({
          snapshot: nextSnapshot,
          group,
        });
        if (entries.length > maximum) entries.shift();
      }
      return true;
    },

    undo() {
      if (entries.length <= 1) return null;
      entries.pop();
      return { ...entries.at(-1).snapshot };
    },

    canUndo() {
      return entries.length > 1;
    },
  };
}
