const STORAGE_KEY = "bible-prayers";

export type PrayerEntry = {
  id: string;
  forWhom: string;
  note: string;
  createdAt: string;
};

export function loadPrayers(): PrayerEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PrayerEntry[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (p) =>
          p &&
          typeof p.id === "string" &&
          typeof p.forWhom === "string" &&
          typeof p.createdAt === "string",
      )
      .map((p) => ({
        id: p.id,
        forWhom: p.forWhom,
        note: typeof p.note === "string" ? p.note : "",
        createdAt: p.createdAt,
      }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
}

export function savePrayers(entries: PrayerEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    /* private mode / quota */
  }
}

export function addPrayer(forWhom: string, note = ""): PrayerEntry[] {
  const trimmed = forWhom.trim();
  if (!trimmed) return loadPrayers();
  const next: PrayerEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    forWhom: trimmed,
    note: note.trim(),
    createdAt: new Date().toISOString(),
  };
  const list = [next, ...loadPrayers()];
  savePrayers(list);
  return list;
}

export function removePrayer(id: string): PrayerEntry[] {
  const list = loadPrayers().filter((p) => p.id !== id);
  savePrayers(list);
  return list;
}
