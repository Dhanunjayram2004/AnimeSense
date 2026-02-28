const STORAGE_KEY = "animesense:pinnedReferences:v1";

export function loadPinnedReferences() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x) => x && typeof x === "object" && typeof x.url === "string");
  } catch {
    return [];
  }
}

export function savePinnedReferences(pins) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pins));
}

export function upsertPinnedReference(pin) {
  const pins = loadPinnedReferences();
  const idx = pins.findIndex((p) => p?.id && pin?.id && p.id === pin.id);
  const next = { ...pin, pinnedAt: pin?.pinnedAt ?? Date.now() };
  if (idx >= 0) {
    const out = pins.slice();
    out[idx] = { ...pins[idx], ...next };
    savePinnedReferences(out);
    return out;
  }
  const out = [next, ...pins];
  savePinnedReferences(out);
  return out;
}

export function removePinnedReference(id) {
  const pins = loadPinnedReferences();
  const out = pins.filter((p) => p?.id !== id);
  savePinnedReferences(out);
  return out;
}

export function isPinned(id) {
  return loadPinnedReferences().some((p) => p?.id === id);
}

