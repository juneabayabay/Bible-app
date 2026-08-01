import { dayOfYearIndex } from "./dailyVerse";
import type { GameVerse } from "./verseGame";
import { buildFillBlankRounds, type FillBlankRound } from "./verseGame";

export type ThemeId = "hope" | "peace" | "love" | "faith" | "courage";

export const THEME_LABELS: Record<ThemeId, string> = {
  hope: "Hope",
  peace: "Peace",
  love: "Love",
  faith: "Faith",
  courage: "Courage",
};

/** Curated themes for pool refs (slug-chapter-verse). */
export const THEME_BY_REF: Record<string, ThemeId> = {
  "john-3-16": "love",
  "romans-5-8": "love",
  "1-corinthians-13-4": "love",
  "1-john-4-8": "love",
  "1-corinthians-16-14": "love",
  "philippians-4-6": "peace",
  "philippians-4-7": "peace",
  "john-14-27": "peace",
  "isaiah-26-3": "peace",
  "matthew-11-28": "peace",
  "psalms-46-1": "peace",
  "romans-8-28": "hope",
  "jeremiah-29-11": "hope",
  "isaiah-40-31": "hope",
  "romans-15-13": "hope",
  "lamentations-3-22": "hope",
  "hebrews-11-1": "faith",
  "proverbs-3-5": "faith",
  "2-corinthians-5-17": "faith",
  "ephesians-2-8": "faith",
  "joshua-1-9": "courage",
  "deuteronomy-31-6": "courage",
  "2-timothy-1-7": "courage",
  "isaiah-41-10": "courage",
  "psalms-23-1": "peace",
  "psalms-119-105": "faith",
  "proverbs-16-3": "faith",
  "matthew-5-16": "courage",
  "matthew-6-33": "faith",
  "john-14-6": "faith",
  "philippians-4-13": "courage",
  "romans-12-2": "faith",
  "galatians-5-22": "love",
  "ephesians-3-20": "hope",
  "colossians-3-23": "faith",
  "1-thessalonians-5-16": "hope",
  "hebrews-13-8": "faith",
  "james-1-5": "faith",
  "1-peter-5-7": "peace",
  "1-john-1-9": "faith",
  "psalms-34-8": "hope",
  "psalms-37-4": "hope",
  "psalms-91-1": "peace",
  "proverbs-18-10": "courage",
  "matthew-28-19": "courage",
  "mark-10-27": "faith",
  "luke-1-37": "hope",
  "john-8-32": "faith",
  "john-16-33": "peace",
  "romans-8-38": "love",
  "philippians-1-6": "hope",
  "2-timothy-3-16": "faith",
  "genesis-1-1": "faith",
  "exodus-14-14": "peace",
  "micah-6-8": "love",
  "luke-6-31": "love",
  "acts-1-8": "courage",
  "james-1-17": "hope",
  "revelation-21-4": "hope",
};

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], rand: () => number): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function seedFor(name: string, date = new Date()) {
  return dayOfYearIndex(date) * 7919 + name.length * 31;
}

function wordsFrom(text: string): string[] {
  return (text.match(/[A-Za-z']+/g) ?? []).map((w) => w.replace(/^'+|'+$/g, "")).filter(Boolean);
}

export function refKeyFromUrl(url: string): string {
  // /web/chapter/romans/5#v8
  const m = url.match(/\/chapter\/([^/]+)\/(\d+)(?:#v(\d+))?/i);
  if (!m) return "";
  return `${m[1].toLowerCase()}-${m[2]}-${m[3] ?? "1"}`;
}

/* ——— Unscramble ——— */
export type UnscrambleRound = {
  id: number;
  cite: string;
  url: string;
  fullText: string;
  /** Correct word order */
  answer: string[];
  /** Shuffled bank (may lowercase on hard) */
  bank: string[];
  hard: boolean;
};

export function buildUnscrambleRounds(
  verses: GameVerse[],
  count = 40,
  hard = false,
  date = new Date(),
): UnscrambleRound[] {
  const rand = mulberry32(seedFor("unscramble", date));
  const picked = verses.filter((v) => {
    const n = wordsFrom(v.text).length;
    return n >= 5 && n <= (hard ? 14 : 10);
  });
  return shuffle(picked, rand)
    .slice(0, count)
    .map((v, id) => {
      let answer = wordsFrom(v.text);
      if (hard) answer = answer.map((w) => w.toLowerCase());
      let bank = shuffle(answer, rand);
      // Ensure not already solved
      let guard = 0;
      while (bank.join(" ") === answer.join(" ") && guard++ < 8) {
        bank = shuffle(answer, rand);
      }
      return {
        id,
        cite: v.cite,
        url: v.url,
        fullText: v.text,
        answer,
        bank,
        hard,
      };
    });
}

/* ——— Reference match ——— */
export type MatchRound = {
  id: number;
  snippet: string;
  cite: string;
  url: string;
  fullText: string;
  choices: string[];
};

export function buildMatchRounds(
  verses: GameVerse[],
  count = 40,
  date = new Date(),
): MatchRound[] {
  const rand = mulberry32(seedFor("match", date));
  const pool = shuffle(verses, rand).slice(0, Math.max(count, 6));
  const allCites = pool.map((v) => v.cite);

  return pool.slice(0, count).map((v, id) => {
    const words = wordsFrom(v.text);
    const mid = Math.max(4, Math.floor(words.length * 0.55));
    const snippet = words.slice(0, mid).join(" ") + "…";

    // Near-misses: same book if possible
    const book = v.cite.replace(/\s+\d+:\d+$/, "");
    const sameBook = allCites.filter((c) => c !== v.cite && c.startsWith(book));
    const others = allCites.filter((c) => c !== v.cite);
    const distractors = shuffle(
      [...sameBook, ...others.filter((c) => !sameBook.includes(c))],
      rand,
    ).slice(0, 3);

    while (distractors.length < 3 && others.length) {
      const extra = others[distractors.length % others.length];
      if (!distractors.includes(extra) && extra !== v.cite) distractors.push(extra);
      else break;
    }

    return {
      id,
      snippet,
      cite: v.cite,
      url: v.url,
      fullText: v.text,
      choices: shuffle([v.cite, ...distractors], rand).slice(0, 4),
    };
  });
}

/* ——— What comes next ——— */
export type NextRound = {
  id: number;
  lead: string;
  cite: string;
  url: string;
  fullText: string;
  answer: string;
  choices: string[];
};

export function buildNextRounds(
  verses: GameVerse[],
  count = 40,
  date = new Date(),
): NextRound[] {
  const rand = mulberry32(seedFor("next", date));
  const eligible = verses.filter((v) => wordsFrom(v.text).length >= 8);
  const picked = shuffle(eligible, rand).slice(0, count);

  return picked.map((v, id) => {
    const words = wordsFrom(v.text);
    const cut = Math.floor(words.length / 2);
    const lead = words.slice(0, cut).join(" ") + "…";
    const answer = words.slice(cut).join(" ");

    const distractors: string[] = [];
    for (const other of shuffle(eligible.filter((x) => x.cite !== v.cite), rand)) {
      const ow = wordsFrom(other.text);
      if (ow.length < 6) continue;
      const oc = Math.floor(ow.length / 2);
      const ending = ow.slice(oc).join(" ");
      if (ending.toLowerCase() === answer.toLowerCase()) continue;
      distractors.push(ending);
      if (distractors.length >= 3) break;
    }

    while (distractors.length < 3) {
      distractors.push(shuffle(words.slice(cut), rand).join(" "));
    }

    return {
      id,
      lead,
      cite: v.cite,
      url: v.url,
      fullText: v.text,
      answer,
      choices: shuffle([answer, ...distractors.slice(0, 3)], rand),
    };
  });
}

/* ——— Theme sort ——— */
export type ThemeRound = {
  id: number;
  cite: string;
  url: string;
  fullText: string;
  theme: ThemeId;
  choices: ThemeId[];
};

export function buildThemeRounds(
  verses: GameVerse[],
  count = 40,
  date = new Date(),
): ThemeRound[] {
  const rand = mulberry32(seedFor("theme", date));
  const tagged = verses
    .map((v) => {
      const key = refKeyFromUrl(v.url);
      const theme = THEME_BY_REF[key];
      return theme ? { v, theme } : null;
    })
    .filter(Boolean) as Array<{ v: GameVerse; theme: ThemeId }>;

  const allThemes = Object.keys(THEME_LABELS) as ThemeId[];
  return shuffle(tagged, rand)
    .slice(0, count)
    .map(({ v, theme }, id) => {
      const others = shuffle(
        allThemes.filter((t) => t !== theme),
        rand,
      ).slice(0, 3);
      return {
        id,
        cite: v.cite,
        url: v.url,
        fullText: v.text,
        theme,
        choices: shuffle([theme, ...others], rand),
      };
    });
}

/* ——— Sprint (timed fill) ——— */
export function buildSprintRounds(
  verses: GameVerse[],
  date = new Date(),
): FillBlankRound[] {
  // Many single-blank rounds; timer stops the run
  return buildFillBlankRounds(verses, "medium", date).concat(
    buildFillBlankRounds(verses.slice().reverse(), "hard", date),
  );
}

export function markAnyGameDone() {
  try {
    const day = new Date().toISOString().slice(0, 10);
    localStorage.setItem("bible-verse-game-done", day);
  } catch {
    /* ignore */
  }
}
