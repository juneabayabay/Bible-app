import { dayOfYearIndex } from "./dailyVerse";

export type VerseToken = {
  raw: string;
  word: string;
  isWord: boolean;
};

export type FillBlankRound = {
  id: number;
  /** Display segments; blank has empty display until answered */
  segments: Array<{ type: "text" | "blank"; text: string; answer?: string }>;
  choices: string[];
  answer: string;
};

const STOP = new Set(
  [
    "a",
    "an",
    "the",
    "and",
    "or",
    "of",
    "to",
    "in",
    "on",
    "for",
    "is",
    "are",
    "be",
    "by",
    "as",
    "at",
    "it",
    "he",
    "she",
    "his",
    "her",
    "him",
    "with",
    "from",
    "that",
    "this",
    "was",
    "were",
    "not",
    "but",
    "if",
    "so",
    "do",
    "does",
    "did",
    "will",
    "shall",
    "unto",
    "ye",
    "thou",
    "thy",
    "thee",
    "them",
    "they",
    "we",
    "us",
    "our",
    "you",
    "your",
    "my",
    "me",
    "i",
    "am",
    "been",
    "have",
    "has",
    "had",
    "who",
    "whom",
    "which",
    "what",
    "when",
    "where",
    "how",
    "all",
    "any",
    "no",
    "nor",
    "into",
    "upon",
    "also",
    "than",
    "then",
    "there",
    "their",
  ].map((w) => w.toLowerCase()),
);

const EXTRA_DISTRACTORS = [
  "faith",
  "grace",
  "peace",
  "hope",
  "love",
  "truth",
  "light",
  "spirit",
  "mercy",
  "strength",
  "heart",
  "life",
  "word",
  "heaven",
  "earth",
  "kingdom",
  "blessed",
  "trust",
  "pray",
  "fear",
];

function tokenize(text: string): VerseToken[] {
  const parts = text.match(/[A-Za-z']+|[^A-Za-z']+/g) ?? [text];
  return parts.map((raw) => {
    const isWord = /^[A-Za-z']+$/.test(raw);
    return {
      raw,
      word: isWord ? raw.replace(/^'+|'+$/g, "") : "",
      isWord,
    };
  });
}

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

function blankableIndexes(tokens: VerseToken[]): number[] {
  const out: number[] = [];
  tokens.forEach((t, i) => {
    if (!t.isWord) return;
    const w = t.word.toLowerCase();
    if (w.length < 4) return;
    if (STOP.has(w)) return;
    out.push(i);
  });
  return out;
}

function buildChoices(
  answer: string,
  pool: string[],
  rand: () => number,
  count = 4,
): string[] {
  const answerKey = answer.toLowerCase();
  const distractors = shuffle(
    [...new Set(pool.filter((w) => w.toLowerCase() !== answerKey))],
    rand,
  ).slice(0, count - 1);
  while (distractors.length < count - 1) {
    const extra = EXTRA_DISTRACTORS[Math.floor(rand() * EXTRA_DISTRACTORS.length)];
    if (
      extra.toLowerCase() !== answerKey &&
      !distractors.some((d) => d.toLowerCase() === extra.toLowerCase())
    ) {
      distractors.push(extra);
    } else if (distractors.length >= EXTRA_DISTRACTORS.length) {
      break;
    }
  }
  return shuffle([answer, ...distractors], rand);
}

function makeRound(
  tokens: VerseToken[],
  blankIndex: number,
  id: number,
  rand: () => number,
  wordPool: string[],
): FillBlankRound {
  const answer = tokens[blankIndex].word;
  const segments = tokens.map((t, i) => {
    if (i === blankIndex) {
      return { type: "blank" as const, text: "____", answer };
    }
    return { type: "text" as const, text: t.raw };
  });
  return {
    id,
    segments,
    choices: buildChoices(answer, wordPool, rand),
    answer,
  };
}

/**
 * Build 1–3 fill-the-blank rounds from a verse.
 * Seeded by day so the same day feels consistent.
 */
export function buildFillBlankRounds(
  verseText: string,
  date = new Date(),
  maxRounds = 3,
): FillBlankRound[] {
  const tokens = tokenize(verseText.trim());
  const candidates = blankableIndexes(tokens);
  const rand = mulberry32(dayOfYearIndex(date) * 9973 + verseText.length * 13);

  if (!candidates.length) {
    // Fallback: blank the longest word
    let best = -1;
    let bestLen = 0;
    tokens.forEach((t, i) => {
      if (t.isWord && t.word.length > bestLen) {
        best = i;
        bestLen = t.word.length;
      }
    });
    if (best < 0) return [];
    const pool = tokens.filter((t) => t.isWord).map((t) => t.word);
    return [makeRound(tokens, best, 0, rand, [...pool, ...EXTRA_DISTRACTORS])];
  }

  const picked = shuffle(candidates, rand).slice(0, Math.min(maxRounds, candidates.length));
  const wordPool = [
    ...tokens.filter((t) => t.isWord && t.word.length >= 3).map((t) => t.word),
    ...EXTRA_DISTRACTORS,
  ];

  return picked.map((idx, i) => makeRound(tokens, idx, i, rand, wordPool));
}

const DONE_KEY = "bible-verse-game-done";

export function isVerseGameDoneToday(date = new Date()): boolean {
  try {
    const raw = localStorage.getItem(DONE_KEY);
    if (!raw) return false;
    const day = new Date(date).toISOString().slice(0, 10);
    return raw === day;
  } catch {
    return false;
  }
}

export function markVerseGameDoneToday(date = new Date()) {
  try {
    localStorage.setItem(DONE_KEY, new Date(date).toISOString().slice(0, 10));
  } catch {
    /* ignore */
  }
}
