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

/** Requirements that must all be met (fields omitted = no requirement). */
export type TrophyGate = {
  streakAt?: number;
  minGameRuns?: number;
  minHardClears?: number;
  minPerfectRuns?: number;
  minChallenges?: number;
  minQuizzes?: number;
  minDevotions?: number;
  minFullDays?: number;
  minGameTypes?: number;
};

export type Trophy = {
  id: string;
  title: string;
  description: string;
  category: "streak" | "challenge";
  gate: TrophyGate;
  /** Shown while locked — what to do next */
  hint: string;
  verseLabel: string;
  verseText: string;
};

export type Level = {
  id: number;
  name: string;
  minStreak: number;
  blurb: string;
};

export type UnlockContext = {
  streak: number;
  devotionCount: number;
  challengeCount: number;
  quizCount: number;
  fullDays: number;
  gameRuns: number;
  hardClears: number;
  perfectRuns: number;
  gameTypes: number;
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
  // —— Streak medals (attendance) ——
  {
    id: "first-light",
    title: "First Light",
    description: "Opened Scripture for the first day.",
    category: "streak",
    gate: { streakAt: 1 },
    hint: "Open the app today.",
    verseLabel: "Psalm 119:105",
    verseText: "Your word is a lamp to my feet, and a light for my path.",
  },
  {
    id: "rooted",
    title: "Rooted",
    description: "Three days in a row with God.",
    category: "streak",
    gate: { streakAt: 3 },
    hint: "Reach a 3-day streak.",
    verseLabel: "Colossians 2:7",
    verseText: "Rooted and built up in him, and established in the faith.",
  },
  {
    id: "week-of-grace",
    title: "Week of Grace",
    description: "Seven faithful days.",
    category: "streak",
    gate: { streakAt: 7 },
    hint: "Reach a 7-day streak.",
    verseLabel: "Lamentations 3:22–23",
    verseText: "His mercies are new every morning. Great is your faithfulness.",
  },
  {
    id: "steadfast",
    title: "Steadfast",
    description: "Fourteen days of returning.",
    category: "streak",
    gate: { streakAt: 14 },
    hint: "Reach a 14-day streak.",
    verseLabel: "1 Corinthians 15:58",
    verseText: "Be steadfast, immovable, always abounding in the Lord’s work.",
  },
  {
    id: "faithful-month",
    title: "Faithful Month",
    description: "Thirty days with an open heart.",
    category: "streak",
    gate: { streakAt: 30 },
    hint: "Reach a 30-day streak.",
    verseLabel: "Hebrews 10:23",
    verseText: "Let’s hold fast the confession of our hope without wavering.",
  },
  {
    id: "deep-roots",
    title: "Deep Roots",
    description: "Sixty days of devotion.",
    category: "streak",
    gate: { streakAt: 60 },
    hint: "Reach a 60-day streak.",
    verseLabel: "Jeremiah 17:8",
    verseText: "He will be as a tree planted by the waters… and will not fear.",
  },
  {
    id: "hundredfold",
    title: "Hundredfold",
    description: "One hundred days walking with God.",
    category: "streak",
    gate: { streakAt: 100 },
    hint: "Reach a 100-day streak.",
    verseLabel: "Matthew 13:23",
    verseText: "What was sown on good ground… yields fruit — some a hundred times.",
  },

  // —— Challenge medals (earn by doing hard work) ——
  {
    id: "first-play",
    title: "First Fruits",
    description: "Finished your first Scripture game.",
    category: "challenge",
    gate: { minGameRuns: 1 },
    hint: "Finish any game once.",
    verseLabel: "Proverbs 3:9",
    verseText: "Honor the Lord with your substance, with the first fruits of all your increase.",
  },
  {
    id: "verse-worker",
    title: "Verse Worker",
    description: "Ten finished game runs.",
    category: "challenge",
    gate: { minGameRuns: 10 },
    hint: "Finish 10 games (keep playing).",
    verseLabel: "2 Timothy 2:15",
    verseText: "Give diligence to present yourself approved by God… handling accurately the word of truth.",
  },
  {
    id: "hard-path",
    title: "Hard Path",
    description: "Three Hard-mode finishes with strong accuracy.",
    category: "challenge",
    gate: { minHardClears: 3 },
    hint: "Clear Fill the blank on Hard (75%+) three times.",
    verseLabel: "Matthew 7:14",
    verseText: "Narrow is the gate and restricted is the way that leads to life.",
  },
  {
    id: "perfect-offering",
    title: "Perfect Offering",
    description: "Two clean runs — full score on a full set.",
    category: "challenge",
    gate: { minPerfectRuns: 2 },
    hint: "Score 100% on a run of 5+ questions, twice.",
    verseLabel: "Psalm 19:7",
    verseText: "The law of the Lord is perfect, restoring the soul.",
  },
  {
    id: "six-strings",
    title: "Six Strings",
    description: "Tried every live game at least once.",
    category: "challenge",
    gate: { minGameTypes: 6 },
    hint: "Play all six game types.",
    verseLabel: "Psalm 33:3",
    verseText: "Sing to him a new song. Play skillfully with a shout of joy!",
  },
  {
    id: "challenge-keeper",
    title: "Challenge Keeper",
    description: "Seven daily challenges completed.",
    category: "challenge",
    gate: { minChallenges: 7 },
    hint: "Complete 7 daily challenges.",
    verseLabel: "Philippians 3:14",
    verseText: "I press on toward the goal for the prize of the high calling of God in Christ Jesus.",
  },
  {
    id: "quiz-mind",
    title: "Quiz Mind",
    description: "Five chapter quizzes finished.",
    category: "challenge",
    gate: { minQuizzes: 5 },
    hint: "Finish 5 chapter quizzes.",
    verseLabel: "Proverbs 2:6",
    verseText: "For the Lord gives wisdom. Out of his mouth comes knowledge and understanding.",
  },
  {
    id: "devotion-flame",
    title: "Devotion Flame",
    description: "Eight devotionals completed.",
    category: "challenge",
    gate: { minDevotions: 8 },
    hint: "Complete 8 devotionals.",
    verseLabel: "Psalm 119:11",
    verseText: "I have hidden your word in my heart, that I might not sin against you.",
  },
  {
    id: "full-day",
    title: "Full Day",
    description: "Five days with open, read, grow, and challenge all done.",
    category: "challenge",
    gate: { minFullDays: 5 },
    hint: "Finish 5 full checklist days.",
    verseLabel: "Psalm 90:12",
    verseText: "So teach us to count our days, that we may gain a heart of wisdom.",
  },
  {
    id: "marathon",
    title: "Marathon",
    description: "Fifty game finishes — long obedience.",
    category: "challenge",
    gate: { minGameRuns: 50 },
    hint: "Finish 50 games total.",
    verseLabel: "Hebrews 12:1",
    verseText: "Let’s run with perseverance the race that is set before us.",
  },
];

export const STREAK_TROPHIES = TROPHIES.filter((t) => t.category === "streak");
export const CHALLENGE_TROPHIES = TROPHIES.filter((t) => t.category === "challenge");

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

export function meetsGate(gate: TrophyGate, ctx: UnlockContext): boolean {
  if ((gate.streakAt ?? 0) > 0 && ctx.streak < (gate.streakAt ?? 0)) return false;
  if (gate.minGameRuns && ctx.gameRuns < gate.minGameRuns) return false;
  if (gate.minHardClears && ctx.hardClears < gate.minHardClears) return false;
  if (gate.minPerfectRuns && ctx.perfectRuns < gate.minPerfectRuns) return false;
  if (gate.minChallenges && ctx.challengeCount < gate.minChallenges) return false;
  if (gate.minQuizzes && ctx.quizCount < gate.minQuizzes) return false;
  if (gate.minDevotions && ctx.devotionCount < gate.minDevotions) return false;
  if (gate.minFullDays && ctx.fullDays < gate.minFullDays) return false;
  if (gate.minGameTypes && ctx.gameTypes < gate.minGameTypes) return false;
  return true;
}

function countFullDays(days: Record<string, { opened: boolean; read: boolean; grow: boolean; challenge: boolean }>) {
  let n = 0;
  for (const day of Object.values(days)) {
    if (day.opened && day.read && day.grow && day.challenge) n += 1;
  }
  return n;
}

/** Build unlock context from journey + progress + game profile (lazy imports via params). */
export function buildUnlockContext(
  state: JourneyState,
  progress: {
    days: Record<string, { opened: boolean; read: boolean; grow: boolean; challenge: boolean }>;
    challengesDone: string[];
    quizzesDone: string[];
  },
  game: {
    totalRuns: number;
    hardClears: number;
    perfectRuns: number;
    runsByGame: Partial<Record<string, number>>;
  },
): UnlockContext {
  return {
    streak: state.streak,
    devotionCount: state.completedDevotions.length,
    challengeCount: progress.challengesDone.length,
    quizCount: progress.quizzesDone.length,
    fullDays: countFullDays(progress.days),
    gameRuns: game.totalRuns,
    hardClears: game.hardClears,
    perfectRuns: game.perfectRuns,
    gameTypes: Object.values(game.runsByGame).filter((n) => (n ?? 0) > 0).length,
  };
}

export function applyTrophyUnlocks(
  state: JourneyState,
  ctx: UnlockContext,
): { state: JourneyState; newlyUnlocked: Trophy[] } {
  const earned = new Set(state.trophies);
  const newlyUnlocked: Trophy[] = [];
  for (const trophy of TROPHIES) {
    if (earned.has(trophy.id)) continue;
    if (meetsGate(trophy.gate, ctx)) {
      earned.add(trophy.id);
      newlyUnlocked.push(trophy);
    }
  }
  if (!newlyUnlocked.length) {
    return { state, newlyUnlocked };
  }
  const next = { ...state, trophies: [...earned], updatedAt: Date.now() };
  saveJourney(next);
  return { state: next, newlyUnlocked };
}

/**
 * Call once when the app opens on this device.
 * Updates daily streak, lifetime days, and streak trophies.
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
    return state;
  }

  const streak =
    state.lastDay === yesterdayKey() ? Math.max(1, state.streak) + 1 : 1;

  state = {
    ...state,
    streak,
    lastDay: today,
    totalDays: state.totalDays + 1,
    updatedAt: Date.now(),
  };
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

export function trophyById(id: string): Trophy | undefined {
  return TROPHIES.find((t) => t.id === id);
}
