import { dayOfYearIndex } from "./dailyVerse";

export type Difficulty = "easy" | "medium" | "hard";

export type VerseToken = {
  raw: string;
  word: string;
  isWord: boolean;
};

export type FillBlankRound = {
  id: number;
  segments: Array<{ type: "text" | "blank"; text: string; answer?: string; blankId?: number }>;
  /** One or more answers in blank order */
  answers: string[];
  choices: string[];
};

export type DifficultyConfig = {
  id: Difficulty;
  label: string;
  blurb: string;
  rounds: number;
  blanksPerRound: number;
  choiceCount: number;
  minWordLen: number;
  /** Show first letter under blank before answering */
  firstLetterHint: boolean;
  /** Study peek seconds; 0 = stay visible until ready */
  studySeconds: number;
};

export const DIFFICULTIES: DifficultyConfig[] = [
  {
    id: "easy",
    label: "Easy",
    blurb: "1 blank · 3 choices · first-letter hint",
    rounds: 3,
    blanksPerRound: 1,
    choiceCount: 3,
    minWordLen: 4,
    firstLetterHint: true,
    studySeconds: 0,
  },
  {
    id: "medium",
    label: "Medium",
    blurb: "1 blank · 4 close choices · no hint",
    rounds: 4,
    blanksPerRound: 1,
    choiceCount: 4,
    minWordLen: 4,
    firstLetterHint: false,
    studySeconds: 0,
  },
  {
    id: "hard",
    label: "Hard",
    blurb: "2 blanks · 5 tricky choices · brief study",
    rounds: 5,
    blanksPerRound: 2,
    choiceCount: 5,
    minWordLen: 3,
    firstLetterHint: false,
    studySeconds: 8,
  },
];

export function getDifficultyConfig(id: Difficulty): DifficultyConfig {
  return DIFFICULTIES.find((d) => d.id === id) ?? DIFFICULTIES[1];
}

const STOP = new Set(
  [
    "a", "an", "the", "and", "or", "of", "to", "in", "on", "for", "is", "are", "be",
    "by", "as", "at", "it", "he", "she", "his", "her", "him", "with", "from", "that",
    "this", "was", "were", "not", "but", "if", "so", "do", "does", "did", "will",
    "shall", "unto", "ye", "thou", "thy", "thee", "them", "they", "we", "us", "our",
    "you", "your", "my", "me", "i", "am", "been", "have", "has", "had", "who", "whom",
    "which", "what", "when", "where", "how", "all", "any", "no", "nor", "into", "upon",
    "also", "than", "then", "there", "their",
  ].map((w) => w.toLowerCase()),
);

const EXTRA_DISTRACTORS = [
  "faith", "grace", "peace", "hope", "love", "truth", "light", "spirit", "mercy",
  "strength", "heart", "life", "word", "heaven", "earth", "kingdom", "blessed",
  "trust", "pray", "fear", "glory", "power", "righteous", "eternal", "shepherd",
  "salvation", "covenant", "promise", "refuge", "fortress", "wisdom", "patience",
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

function blankableIndexes(tokens: VerseToken[], minWordLen: number): number[] {
  const out: number[] = [];
  tokens.forEach((t, i) => {
    if (!t.isWord) return;
    const w = t.word.toLowerCase();
    if (w.length < minWordLen) return;
    if (STOP.has(w)) return;
    out.push(i);
  });
  return out;
}

function buildTrickyChoices(
  answers: string[],
  pool: string[],
  rand: () => number,
  count: number,
): string[] {
  const answerKeys = new Set(answers.map((a) => a.toLowerCase()));
  const primary = answers[0] ?? "";
  const candidates = [...new Set(pool.filter((w) => !answerKeys.has(w.toLowerCase())))];

  const scored = candidates.map((w) => {
    let score = 0;
    if (Math.abs(w.length - primary.length) <= 2) score += 3;
    if (w[0]?.toLowerCase() === primary[0]?.toLowerCase()) score += 4;
    if (w.slice(-2).toLowerCase() === primary.slice(-2).toLowerCase()) score += 2;
    if (w.length >= 5) score += 1;
    return { w, score };
  });

  scored.sort((a, b) => b.score - a.score || a.w.localeCompare(b.w));
  const top = scored.slice(0, Math.max(count * 2, 8)).map((s) => s.w);
  const distractors = shuffle(top, rand).slice(0, Math.max(0, count - answers.length));

  while (distractors.length < count - answers.length) {
    const extra = EXTRA_DISTRACTORS[Math.floor(rand() * EXTRA_DISTRACTORS.length)];
    if (
      !answerKeys.has(extra.toLowerCase()) &&
      !distractors.some((d) => d.toLowerCase() === extra.toLowerCase())
    ) {
      distractors.push(extra);
    } else if (distractors.length + answers.length >= count) {
      break;
    }
  }

  return shuffle([...answers, ...distractors], rand).slice(0, count);
}

function makeRound(
  tokens: VerseToken[],
  blankIndexes: number[],
  id: number,
  rand: () => number,
  wordPool: string[],
  choiceCount: number,
): FillBlankRound {
  const blankSet = new Set(blankIndexes);
  const answers = blankIndexes.map((i) => tokens[i].word);
  let blankId = 0;
  const segments = tokens.map((t, i) => {
    if (blankSet.has(i)) {
      const answer = t.word;
      const currentBlank = blankId++;
      return {
        type: "blank" as const,
        text: "____",
        answer,
        blankId: currentBlank,
      };
    }
    return { type: "text" as const, text: t.raw };
  });

  return {
    id,
    segments,
    answers,
    choices: buildTrickyChoices(answers, wordPool, rand, choiceCount),
  };
}

/**
 * Build fill-the-blank rounds for a difficulty.
 * Seeded by day + difficulty so the same day feels consistent.
 */
export function buildFillBlankRounds(
  verseText: string,
  difficulty: Difficulty = "medium",
  date = new Date(),
): FillBlankRound[] {
  const cfg = getDifficultyConfig(difficulty);
  const tokens = tokenize(verseText.trim());
  const candidates = blankableIndexes(tokens, cfg.minWordLen);
  const seed =
    dayOfYearIndex(date) * 9973 +
    verseText.length * 13 +
    difficulty.charCodeAt(0) * 101;
  const rand = mulberry32(seed);

  const wordPool = [
    ...tokens.filter((t) => t.isWord && t.word.length >= 3).map((t) => t.word),
    ...EXTRA_DISTRACTORS,
  ];

  if (!candidates.length) {
    let best = -1;
    let bestLen = 0;
    tokens.forEach((t, i) => {
      if (t.isWord && t.word.length > bestLen) {
        best = i;
        bestLen = t.word.length;
      }
    });
    if (best < 0) return [];
    return [makeRound(tokens, [best], 0, rand, wordPool, cfg.choiceCount)];
  }

  const needed = cfg.rounds * cfg.blanksPerRound;
  let poolIdx = shuffle(candidates, rand);
  // Prefer longer / more distinctive words on hard
  if (difficulty === "hard") {
    poolIdx = [...poolIdx].sort(
      (a, b) => tokens[b].word.length - tokens[a].word.length,
    );
    poolIdx = shuffle(poolIdx.slice(0, Math.min(poolIdx.length, needed + 4)), rand);
  }

  const rounds: FillBlankRound[] = [];
  let cursor = 0;
  for (let r = 0; r < cfg.rounds; r++) {
    const blanks: number[] = [];
    for (let b = 0; b < cfg.blanksPerRound; b++) {
      if (cursor >= poolIdx.length) {
        // reuse shuffled leftovers
        poolIdx = shuffle(candidates, rand);
        cursor = 0;
      }
      const next = poolIdx[cursor++];
      if (!blanks.includes(next)) blanks.push(next);
    }
    if (!blanks.length) break;
    // Keep blank order as they appear in the verse
    blanks.sort((a, b) => a - b);
    rounds.push(makeRound(tokens, blanks, r, rand, wordPool, cfg.choiceCount));
  }

  return rounds;
}

const DONE_KEY = "bible-verse-game-done";
const DIFF_KEY = "bible-verse-game-difficulty";

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

export function loadSavedDifficulty(): Difficulty {
  try {
    const raw = localStorage.getItem(DIFF_KEY);
    if (raw === "easy" || raw === "medium" || raw === "hard") return raw;
  } catch {
    /* ignore */
  }
  return "medium";
}

export function saveDifficulty(difficulty: Difficulty) {
  try {
    localStorage.setItem(DIFF_KEY, difficulty);
  } catch {
    /* ignore */
  }
}
