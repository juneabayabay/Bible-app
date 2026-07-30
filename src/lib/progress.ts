const PROGRESS_KEY = "bible-progress";

export type DayLog = {
  date: string;
  opened: boolean;
  read: boolean;
  grow: boolean;
  challenge: boolean;
};

export type ProgressState = {
  /** Per-day checklist */
  days: Record<string, DayLog>;
  /** Chapters visited: `${version}:${slug}:${chapter}` */
  chaptersRead: string[];
  /** Active reading plan id */
  activePlanId: string | null;
  /** Completed plan days: `${planId}:${dayNumber}` */
  planDaysDone: string[];
  /** Challenges completed: `${date}:${challengeId}` */
  challengesDone: string[];
  /** Quizzes completed: `${slug}:${chapter}` */
  quizzesDone: string[];
  /** Optional one-line reflections: `${date}` → text */
  reflections: Record<string, string>;
  updatedAt: number;
};

export function todayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function empty(): ProgressState {
  return {
    days: {},
    chaptersRead: [],
    activePlanId: null,
    planDaysDone: [],
    challengesDone: [],
    quizzesDone: [],
    reflections: {},
    updatedAt: Date.now(),
  };
}

export function loadProgress(): ProgressState {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return empty();
    const p = JSON.parse(raw) as Partial<ProgressState>;
    return {
      days: p.days && typeof p.days === "object" ? p.days : {},
      chaptersRead: Array.isArray(p.chaptersRead) ? p.chaptersRead : [],
      activePlanId: typeof p.activePlanId === "string" ? p.activePlanId : null,
      planDaysDone: Array.isArray(p.planDaysDone) ? p.planDaysDone : [],
      challengesDone: Array.isArray(p.challengesDone) ? p.challengesDone : [],
      quizzesDone: Array.isArray(p.quizzesDone) ? p.quizzesDone : [],
      reflections: p.reflections && typeof p.reflections === "object" ? p.reflections : {},
      updatedAt: Number(p.updatedAt) || Date.now(),
    };
  } catch {
    return empty();
  }
}

function save(state: ProgressState) {
  state.updatedAt = Date.now();
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(state));
}

function ensureDay(state: ProgressState, date = todayKey()): DayLog {
  if (!state.days[date]) {
    state.days[date] = {
      date,
      opened: false,
      read: false,
      grow: false,
      challenge: false,
    };
  }
  return state.days[date];
}

export function markOpened(date = todayKey()) {
  const state = loadProgress();
  const day = ensureDay(state, date);
  day.opened = true;
  save(state);
  return state;
}

export function markRead(version: string, slug: string, chapter: number) {
  const state = loadProgress();
  const key = `${version}:${slug}:${chapter}`;
  if (!state.chaptersRead.includes(key)) {
    state.chaptersRead = [...state.chaptersRead, key];
  }
  const day = ensureDay(state);
  day.read = true;
  save(state);
  return state;
}

export function markGrow() {
  const state = loadProgress();
  ensureDay(state).grow = true;
  save(state);
  return state;
}

export function markChallengeDone(challengeId: string, date = todayKey()) {
  const state = loadProgress();
  const key = `${date}:${challengeId}`;
  if (!state.challengesDone.includes(key)) {
    state.challengesDone = [...state.challengesDone, key];
  }
  const day = ensureDay(state, date);
  day.challenge = true;
  day.grow = true;
  save(state);
  return state;
}

export function isChallengeDone(challengeId: string, date = todayKey()) {
  return loadProgress().challengesDone.includes(`${date}:${challengeId}`);
}

export function setActivePlan(planId: string | null) {
  const state = loadProgress();
  state.activePlanId = planId;
  save(state);
  return state;
}

export function markPlanDay(planId: string, dayNumber: number) {
  const state = loadProgress();
  const key = `${planId}:${dayNumber}`;
  if (!state.planDaysDone.includes(key)) {
    state.planDaysDone = [...state.planDaysDone, key];
  }
  if (!state.activePlanId) state.activePlanId = planId;
  ensureDay(state).read = true;
  save(state);
  return state;
}

export function isPlanDayDone(planId: string, dayNumber: number) {
  return loadProgress().planDaysDone.includes(`${planId}:${dayNumber}`);
}

export function planCompletedCount(planId: string) {
  const prefix = `${planId}:`;
  return loadProgress().planDaysDone.filter((k) => k.startsWith(prefix)).length;
}

export function markQuizDone(slug: string, chapter: number) {
  const state = loadProgress();
  const key = `${slug}:${chapter}`;
  if (!state.quizzesDone.includes(key)) {
    state.quizzesDone = [...state.quizzesDone, key];
  }
  ensureDay(state).grow = true;
  save(state);
  return state;
}

export function isQuizDone(slug: string, chapter: number) {
  return loadProgress().quizzesDone.includes(`${slug}:${chapter}`);
}

export function saveReflection(text: string, date = todayKey()) {
  const state = loadProgress();
  state.reflections[date] = text.trim();
  if (text.trim()) {
    ensureDay(state, date).grow = true;
    ensureDay(state, date).challenge = true;
  }
  save(state);
  return state;
}

export type TodayStatus = {
  date: string;
  opened: boolean;
  read: boolean;
  grow: boolean;
  challenge: boolean;
  doneCount: number;
  total: number;
  complete: boolean;
};

export function getTodayStatus(date = todayKey()): TodayStatus {
  const state = loadProgress();
  const day = state.days[date] ?? {
    date,
    opened: false,
    read: false,
    grow: false,
    challenge: false,
  };
  const flags = [day.opened, day.read, day.grow, day.challenge];
  const doneCount = flags.filter(Boolean).length;
  return {
    date,
    opened: day.opened,
    read: day.read,
    grow: day.grow,
    challenge: day.challenge,
    doneCount,
    total: 4,
    complete: doneCount === 4,
  };
}

/** Stats for the last 7 local calendar days including today. */
export function getWeekStats() {
  const state = loadProgress();
  const days: DayLog[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = todayKey(d);
    days.push(
      state.days[key] ?? {
        date: key,
        opened: false,
        read: false,
        grow: false,
        challenge: false,
      },
    );
  }
  const opened = days.filter((d) => d.opened).length;
  const read = days.filter((d) => d.read).length;
  const grow = days.filter((d) => d.grow).length;
  const challenges = days.filter((d) => d.challenge).length;
  const completeDays = days.filter(
    (d) => d.opened && d.read && d.grow && d.challenge,
  ).length;
  return { days, opened, read, grow, challenges, completeDays };
}
