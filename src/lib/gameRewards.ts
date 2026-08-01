/** Bible-shaped ranks, tenure borders, and play XP for Scripture games. */

const PROFILE_KEY = "bible-game-profile";
const RECENT_CAP = 48;

export type GameId =
  | "fill"
  | "unscramble"
  | "match"
  | "next"
  | "theme"
  | "speed";

export type TitleDef = {
  id: string;
  name: string;
  blurb: string;
  verseLabel: string;
  minXp: number;
};

export type BorderDef = {
  id: string;
  name: string;
  blurb: string;
  /** Days since first play */
  minDays: number;
  frameClass: string;
};

export type RunHonor = {
  id: string;
  title: string;
  blurb: string;
};

export type GameProfile = {
  firstPlayedAt: number;
  totalRuns: number;
  totalCorrect: number;
  totalAttempted: number;
  xp: number;
  bestRunAccuracy: number;
  /** Hard fill clears at ≥75% accuracy */
  hardClears: number;
  /** Full-score runs with total ≥ 5 */
  perfectRuns: number;
  recentCites: string[];
  titleId: string;
  borderId: string;
  runsByGame: Partial<Record<GameId, number>>;
  updatedAt: number;
};

export type RunResult = {
  gameId: GameId;
  score: number;
  total: number;
  cites: string[];
  /** Fill difficulty multiplier */
  difficulty?: "easy" | "medium" | "hard";
  bestStreak?: number;
};

export type RewardSnapshot = {
  title: TitleDef;
  border: BorderDef;
  runHonor: RunHonor;
  xpGained: number;
  titleChanged: boolean;
  borderChanged: boolean;
  tenureDays: number;
  tenureLabel: string;
  xp: number;
  accuracy: number;
  score: number;
  total: number;
  newMedals: Array<{ id: string; title: string; description: string }>;
};

/** Titles earned by wisdom XP — how you play. */
export const TITLES: TitleDef[] = [
  {
    id: "seeker",
    name: "Seeker",
    blurb: "Ask, and it will be given.",
    verseLabel: "Matthew 7:7",
    minXp: 0,
  },
  {
    id: "listener",
    name: "Listener",
    blurb: "Quick to hear the Word.",
    verseLabel: "James 1:19",
    minXp: 40,
  },
  {
    id: "disciple",
    name: "Disciple",
    blurb: "Learning to follow day by day.",
    verseLabel: "Luke 9:23",
    minXp: 120,
  },
  {
    id: "scribe",
    name: "Scribe",
    blurb: "Set the heart to study Scripture.",
    verseLabel: "Ezra 7:10",
    minXp: 250,
  },
  {
    id: "watchman",
    name: "Watchman",
    blurb: "Alert on the wall of the Word.",
    verseLabel: "Ezekiel 33:7",
    minXp: 450,
  },
  {
    id: "steward",
    name: "Steward",
    blurb: "Found faithful with what was given.",
    verseLabel: "1 Corinthians 4:2",
    minXp: 700,
  },
  {
    id: "elder",
    name: "Elder",
    blurb: "Laboring in the Word and teaching.",
    verseLabel: "1 Timothy 5:17",
    minXp: 1000,
  },
  {
    id: "ambassador",
    name: "Ambassador",
    blurb: "Carrying Christ’s appeal in memory.",
    verseLabel: "2 Corinthians 5:20",
    minXp: 1400,
  },
  {
    id: "overcomer",
    name: "Overcomer",
    blurb: "By the blood and the word of testimony.",
    verseLabel: "Revelation 12:11",
    minXp: 1900,
  },
  {
    id: "faithful-witness",
    name: "Faithful Witness",
    blurb: "Be faithful unto death — crown of life.",
    verseLabel: "Revelation 2:10",
    minXp: 2500,
  },
];

/** Borders unlock by how long you’ve been playing — not by score. */
export const BORDERS: BorderDef[] = [
  {
    id: "linen",
    name: "Linen",
    blurb: "Priestly cloth — a beginning.",
    minDays: 0,
    frameClass: "rank-border-linen",
  },
  {
    id: "clay",
    name: "Clay jar",
    blurb: "Treasure in earthen vessels.",
    minDays: 3,
    frameClass: "rank-border-clay",
  },
  {
    id: "olive",
    name: "Olive branch",
    blurb: "Peace taking root.",
    minDays: 7,
    frameClass: "rank-border-olive",
  },
  {
    id: "cedar",
    name: "Cedar of Lebanon",
    blurb: "Strong timber for the house.",
    minDays: 21,
    frameClass: "rank-border-cedar",
  },
  {
    id: "gold",
    name: "Refined gold",
    blurb: "Faith proven more precious than gold.",
    minDays: 45,
    frameClass: "rank-border-gold",
  },
  {
    id: "scarlet",
    name: "Tabernacle blue",
    blurb: "Scarlet and blue of the sanctuary.",
    minDays: 90,
    frameClass: "rank-border-scarlet",
  },
];

function emptyProfile(): GameProfile {
  return {
    firstPlayedAt: 0,
    totalRuns: 0,
    totalCorrect: 0,
    totalAttempted: 0,
    xp: 0,
    bestRunAccuracy: 0,
    hardClears: 0,
    perfectRuns: 0,
    recentCites: [],
    titleId: TITLES[0].id,
    borderId: BORDERS[0].id,
    runsByGame: {},
    updatedAt: Date.now(),
  };
}

export function loadGameProfile(): GameProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return emptyProfile();
    const parsed = JSON.parse(raw) as Partial<GameProfile>;
    return {
      ...emptyProfile(),
      ...parsed,
      hardClears: Number(parsed.hardClears) || 0,
      perfectRuns: Number(parsed.perfectRuns) || 0,
      recentCites: Array.isArray(parsed.recentCites) ? parsed.recentCites : [],
      runsByGame: parsed.runsByGame ?? {},
    };
  } catch {
    return emptyProfile();
  }
}

function saveGameProfile(state: GameProfile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function titleForXp(xp: number): TitleDef {
  let current = TITLES[0];
  for (const t of TITLES) {
    if (xp >= t.minXp) current = t;
  }
  return current;
}

export function borderForTenure(days: number): BorderDef {
  let current = BORDERS[0];
  for (const b of BORDERS) {
    if (days >= b.minDays) current = b;
  }
  return current;
}

export function tenureDays(profile: GameProfile, now = Date.now()): number {
  if (!profile.firstPlayedAt) return 0;
  return Math.max(0, Math.floor((now - profile.firstPlayedAt) / 86_400_000));
}

export function tenureLabel(days: number): string {
  if (days <= 0) return "First day";
  if (days === 1) return "1 day with the Word";
  return `${days} days with the Word`;
}

export function nextTitle(xp: number): TitleDef | null {
  const current = titleForXp(xp);
  const idx = TITLES.findIndex((t) => t.id === current.id);
  return TITLES[idx + 1] ?? null;
}

export function getRecentCites(): string[] {
  return loadGameProfile().recentCites;
}

function diffMult(d?: RunResult["difficulty"]): number {
  if (d === "hard") return 1.4;
  if (d === "easy") return 0.85;
  return 1;
}

function honorForRun(result: RunResult, accuracy: number, isFirst: boolean): RunHonor {
  if (isFirst) {
    return {
      id: "first-fruits",
      title: "First fruits",
      blurb: "The first of your harvest belongs to the Lord.",
    };
  }
  if (result.total > 0 && accuracy >= 0.95 && result.total >= 8) {
    return {
      id: "faithful-servant",
      title: "Good and faithful",
      blurb: "Well done — you have been faithful over a little.",
    };
  }
  if ((result.bestStreak ?? 0) >= 5) {
    return {
      id: "steadfast",
      title: "Steadfast",
      blurb: "Immovable — abounding in the work.",
    };
  }
  if (accuracy >= 0.8) {
    return {
      id: "approved",
      title: "Approved workman",
      blurb: "Rightly handling the word of truth.",
    };
  }
  if (accuracy >= 0.55) {
    return {
      id: "press-on",
      title: "Press on",
      blurb: "Forgetting what is behind, straining forward.",
    };
  }
  return {
    id: "return",
    title: "Return again",
    blurb: "His mercies are new — open the Word once more.",
  };
}

function xpForRun(result: RunResult, accuracy: number): number {
  const base =
    result.score * 3 +
    Math.round(accuracy * 18) +
    (accuracy >= 0.95 && result.total >= 8 ? 20 : 0) +
    Math.min(12, result.bestStreak ?? 0) * 2;
  return Math.max(4, Math.round(base * diffMult(result.difficulty)));
}

export function recordGameRun(result: RunResult): RewardSnapshot {
  const profile = loadGameProfile();
  const now = Date.now();
  const isFirst = profile.totalRuns === 0 || !profile.firstPlayedAt;
  if (!profile.firstPlayedAt) profile.firstPlayedAt = now;

  const total = Math.max(0, result.total);
  const score = Math.max(0, Math.min(result.score, total || result.score));
  const accuracy = total > 0 ? score / total : score > 0 ? 1 : 0;
  const xpGained = xpForRun({ ...result, score }, accuracy);

  const prevTitle = titleForXp(profile.xp);
  const prevBorder = borderForTenure(tenureDays(profile, now));

  profile.xp += xpGained;
  profile.totalRuns += 1;
  profile.totalCorrect += score;
  profile.totalAttempted += total;
  profile.bestRunAccuracy = Math.max(profile.bestRunAccuracy, accuracy);
  profile.runsByGame[result.gameId] = (profile.runsByGame[result.gameId] ?? 0) + 1;

  if (result.difficulty === "hard" && accuracy >= 0.75) {
    profile.hardClears += 1;
  }
  if (total >= 5 && accuracy >= 1) {
    profile.perfectRuns += 1;
  }

  const cites = result.cites.filter(Boolean);
  profile.recentCites = [...cites, ...profile.recentCites]
    .filter((c, i, arr) => arr.indexOf(c) === i)
    .slice(0, RECENT_CAP);

  const days = tenureDays(profile, now);
  const title = titleForXp(profile.xp);
  const border = borderForTenure(days);
  profile.titleId = title.id;
  profile.borderId = border.id;
  profile.updatedAt = now;
  saveGameProfile(profile);

  return {
    title,
    border,
    runHonor: honorForRun(result, accuracy, isFirst),
    xpGained,
    titleChanged: title.id !== prevTitle.id,
    borderChanged: border.id !== prevBorder.id,
    tenureDays: days,
    tenureLabel: tenureLabel(days),
    xp: profile.xp,
    accuracy,
    score,
    total,
    newMedals: [],
  };
}

export function profileSnapshot(): {
  title: TitleDef;
  border: BorderDef;
  tenureDays: number;
  tenureLabel: string;
  xp: number;
  next: TitleDef | null;
  totalRuns: number;
} {
  const profile = loadGameProfile();
  const days = tenureDays(profile);
  const title = titleForXp(profile.xp);
  const border = borderForTenure(days);
  return {
    title,
    border,
    tenureDays: days,
    tenureLabel: tenureLabel(days),
    xp: profile.xp,
    next: nextTitle(profile.xp),
    totalRuns: profile.totalRuns,
  };
}

/** Fresh random seed each game open / replay. */
export function sessionSeed(salt = 0): number {
  const a = Date.now() & 0xfffffff;
  const b = Math.floor(Math.random() * 0x7fffffff);
  return (a ^ b ^ (salt * 2654435761)) >>> 0;
}

/** Prefer verses not seen recently, then shuffle. */
export function preferFreshVerses<T extends { cite: string }>(
  verses: T[],
  recentCites: string[],
  rand: () => number,
): T[] {
  const recent = new Set(recentCites);
  const fresh: T[] = [];
  const stale: T[] = [];
  for (const v of verses) {
    (recent.has(v.cite) ? stale : fresh).push(v);
  }
  return [...shuffleInPlace([...fresh], rand), ...shuffleInPlace([...stale], rand)];
}

function shuffleInPlace<T>(arr: T[], rand: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
