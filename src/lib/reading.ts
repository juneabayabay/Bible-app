const LAST_READ_KEY = "bible-last-read";

export type LastRead = {
  version: string;
  slug: string;
  book: string;
  chapter: number;
  updatedAt: number;
};

export function loadLastRead(): LastRead | null {
  try {
    const raw = localStorage.getItem(LAST_READ_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LastRead;
    if (!parsed?.version || !parsed?.slug || !parsed?.chapter) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveLastRead(entry: Omit<LastRead, "updatedAt">) {
  const payload: LastRead = { ...entry, updatedAt: Date.now() };
  localStorage.setItem(LAST_READ_KEY, JSON.stringify(payload));
}
