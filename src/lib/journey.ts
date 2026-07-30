const JOURNEY_KEY = "bible-journey";

export type JourneyState = {
  /** Consecutive calendar days with an app open */
  streak: number;
  /** YYYY-MM-DD of last open that counted toward streak */
  lastDay: string;
  /** Total days the app was opened (lifetime) */
  totalDays: number;
  /** Completed devotion keys: `${theme}:${entryId}` */
  completedDevotions: string[];
  /** Trophy ids unlocked */
  trophies: string[];
  updatedAt: number;
};

export type Trophy = {
  id: string;
  title: string;
  description: string;
  /** Minimum streak days required */
  streakAt: number;
  verseLabel: string;
  verseText: string;
};

export type Level = {
  id: number;
  name: string;
  minStreak: number;
  blurb: string;
};

export const LEVELS: Level[] = [
  { id: 1, name: "Seed", minStreak: 0, blurb: "A heart beginning to listen." },
  { id: 2, name: "Root", minStreak: 3, blurb: "Faith taking hold." },
  { id: 3, name: "Sprout", minStreak: 7, blurb: "A week of returning to God." },
  { id: 4, name: "Branch", minStreak: 14, blurb: "Steady growth in the Word." },
  { id: 5, name: "Tree", minStreak: 30, blurb: "A month of faithful presence." },
  { id: 6, name: "Fruit", minStreak: 60, blurb: "Life shaped by Scripture." },
  { id: 7, name: "Harvest", minStreak: 100, blurb: "Deep roots. Lasting fruit." },
];

export const TROPHIES: Trophy[] = [
  {
    id: "first-light",
    title: "First Light",
    description: "Opened Scripture for the first day.",
    streakAt: 1,
    verseLabel: "Psalm 119:105",
    verseText: "Your word is a lamp to my feet, and a light for my path.",
  },
  {
    id: "rooted",
    title: "Rooted",
    description: "Three days in a row with God.",
    streakAt: 3,
    verseLabel: "Colossians 2:7",
    verseText: "Rooted and built up in him, and established in the faith.",
  },
  {
    id: "week-of-grace",
    title: "Week of Grace",
    description: "Seven faithful days.",
    streakAt: 7,
    verseLabel: "Lamentations 3:22–23",
    verseText: "His mercies are new every morning. Great is your faithfulness.",
  },
  {
    id: "steadfast",
    title: "Steadfast",
    description: "Fourteen days of returning.",
    streakAt: 14,
    verseLabel: "1 Corinthians 15:58",
    verseText: "Be steadfast, immovable, always abounding in the Lord’s work.",
  },
  {
    id: "faithful-month",
    title: "Faithful Month",
    description: "Thirty days with an open heart.",
    streakAt: 30,
    verseLabel: "Hebrews 10:23",
    verseText: "Let’s hold fast the confession of our hope without wavering.",
  },
  {
    id: "deep-roots",
    title: "Deep Roots",
    description: "Sixty days of devotion.",
    streakAt: 60,
    verseLabel: "Jeremiah 17:8",
    verseText: "He will be as a tree planted by the waters… and will not fear.",
  },
  {
    id: "hundredfold",
    title: "Hundredfold",
    description: "One hundred days walking with God.",
    streakAt: 100,
    verseLabel: "Matthew 13:23",
    verseText: "What was sown on good ground… yields fruit — some a hundred times.",
  },
];

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

function emptyState(): JourneyState {
  return {
    streak: 0,
    lastDay: "",
    totalDays: 0,
    completedDevotions: [],
    trophies: [],
    updatedAt: Date.now(),
  };
}

export function loadJourney(): JourneyState {
  try {
    const raw = localStorage.getItem(JOURNEY_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as Partial<JourneyState>;
    return {
      streak: Number(parsed.streak) || 0,
      lastDay: typeof parsed.lastDay === "string" ? parsed.lastDay : "",
      totalDays: Number(parsed.totalDays) || 0,
      completedDevotions: Array.isArray(parsed.completedDevotions)
        ? parsed.completedDevotions.filter((x): x is string => typeof x === "string")
        : [],
      trophies: Array.isArray(parsed.trophies)
        ? parsed.trophies.filter((x): x is string => typeof x === "string")
        : [],
      updatedAt: Number(parsed.updatedAt) || Date.now(),
    };
  } catch {
    return emptyState();
  }
}

function saveJourney(state: JourneyState) {
  localStorage.setItem(JOURNEY_KEY, JSON.stringify(state));
}

function unlockTrophies(state: JourneyState): JourneyState {
  const earned = new Set(state.trophies);
  for (const trophy of TROPHIES) {
    if (state.streak >= trophy.streakAt) earned.add(trophy.id);
  }
  return { ...state, trophies: [...earned] };
}

/**
 * Call once when the app opens on this device.
 * Updates daily streak, lifetime days, and trophies.
 */
export function recordAppOpen(): JourneyState {
  const today = todayKey();
  let state = loadJourney();

  // One-time bridge from legacy streak key
  if (!state.lastDay && !state.streak) {
    try {
      const legacyRaw = localStorage.getItem("bible-streak");
      if (legacyRaw) {
        const legacy = JSON.parse(legacyRaw) as { count?: number; lastDay?: string };
        if (legacy.count && legacy.count > 0) {
          state = {
            ...state,
            streak: Number(legacy.count) || 0,
            lastDay: typeof legacy.lastDay === "string" ? legacy.lastDay : "",
            totalDays: Math.max(state.totalDays, Number(legacy.count) || 0),
          };
        }
      }
    } catch {
      /* ignore */
    }
  }

  if (state.lastDay === today) {
    return unlockTrophies(state);
  }

  const streak =
    state.lastDay === yesterdayKey() ? Math.max(1, state.streak) + 1 : 1;

  state = unlockTrophies({
    ...state,
    streak,
    lastDay: today,
    totalDays: state.totalDays + 1,
    updatedAt: Date.now(),
  });
  saveJourney(state);

  // Keep legacy key aligned
  try {
    localStorage.setItem(
      "bible-streak",
      JSON.stringify({ count: state.streak, lastDay: state.lastDay }),
    );
  } catch {
    /* ignore */
  }

  return state;
}

export function devotionKey(theme: string, entryId: string) {
  return `${theme}:${entryId}`;
}

export function isDevotionComplete(theme: string, entryId: string): boolean {
  return loadJourney().completedDevotions.includes(devotionKey(theme, entryId));
}

export function completeDevotion(theme: string, entryId: string): JourneyState {
  const key = devotionKey(theme, entryId);
  let state = loadJourney();
  if (!state.completedDevotions.includes(key)) {
    state = {
      ...state,
      completedDevotions: [...state.completedDevotions, key],
      updatedAt: Date.now(),
    };
    saveJourney(state);
  }
  return state;
}

export function getLevel(streak: number): Level {
  let current = LEVELS[0];
  for (const level of LEVELS) {
    if (streak >= level.minStreak) current = level;
  }
  return current;
}

export function getNextLevel(streak: number): Level | null {
  const current = getLevel(streak);
  return LEVELS.find((l) => l.id === current.id + 1) ?? null;
}

export function journeyProgress(streak: number) {
  const current = getLevel(streak);
  const next = getNextLevel(streak);
  if (!next) {
    return { current, next: null, ratio: 1, remaining: 0 };
  }
  const span = next.minStreak - current.minStreak;
  const done = streak - current.minStreak;
  const ratio = span <= 0 ? 1 : Math.min(1, Math.max(0, done / span));
  return {
    current,
    next,
    ratio,
    remaining: Math.max(0, next.minStreak - streak),
  };
}
