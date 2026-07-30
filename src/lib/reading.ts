const LAST_READ_KEY = "bible-last-read";
const STREAK_KEY = "bible-streak";

export type LastRead = {
  version: string;
  slug: string;
  book: string;
  chapter: number;
  updatedAt: number;
};

export type StreakData = {
  count: number;
  lastDay: string; // YYYY-MM-DD local
};

function todayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function yesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return todayKey(d);
}

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
  touchStreak();
}

export function loadStreak(): StreakData {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (!raw) return { count: 0, lastDay: "" };
    const parsed = JSON.parse(raw) as StreakData;
    return {
      count: Number(parsed.count) || 0,
      lastDay: typeof parsed.lastDay === "string" ? parsed.lastDay : "",
    };
  } catch {
    return { count: 0, lastDay: "" };
  }
}

/** Call when the user opens Scripture; returns updated streak. */
export function touchStreak(): StreakData {
  const today = todayKey();
  const current = loadStreak();

  if (current.lastDay === today) return current;

  const next: StreakData = {
    count: current.lastDay === yesterdayKey() ? current.count + 1 : 1,
    lastDay: today,
  };
  localStorage.setItem(STREAK_KEY, JSON.stringify(next));
  return next;
}
