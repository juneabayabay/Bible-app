import type { Alpine } from "alpinejs";
import {
  buildFillBlankRounds,
  DIFFICULTIES,
  getDifficultyConfig,
  isVerseGameDoneToday,
  loadSavedDifficulty,
  markVerseGameDoneToday,
  saveDifficulty,
  type Difficulty,
  type DifficultyConfig,
  type FillBlankRound,
  type GameVerse,
} from "../lib/verseGame";
import {
  buildMatchRounds,
  buildNextRounds,
  buildSprintRounds,
  buildThemeRounds,
  buildUnscrambleRounds,
  markAnyGameDone,
  THEME_LABELS,
  type MatchRound,
  type NextRound,
  type ThemeId,
  type ThemeRound,
  type UnscrambleRound,
} from "../lib/gamePacks";
import {
  getRecentCites,
  profileSnapshot,
  recordGameRun,
  sessionSeed,
  type GameId,
  type RewardSnapshot,
} from "../lib/gameRewards";
import { markGrow } from "../lib/progress";
import { syncJourneyUnlocks } from "../lib/syncUnlocks";

/** Register play/game Alpine components (lazy-loaded on /play routes). */
export function registerGames(Alpine: Alpine) {
  Alpine.data("verseFillGame", () => ({
    version: "web",
    verses: [] as GameVerse[],
    difficulties: DIFFICULTIES as DifficultyConfig[],
    difficulty: "medium" as Difficulty,
    rounds: [] as FillBlankRound[],
    phase: "choose" as "choose" | "study" | "play" | "done",
    roundIndex: 0,
    activeBlank: 0,
    filled: {} as Record<number, string>,
    feedback: "",
    lastCorrect: false,
    score: 0,
    totalBlanks: 0,
    alreadyDone: false,
    studySecondsLeft: 0,
    firstLetterHint: false,
    reward: null as RewardSnapshot | null,
    _studyTimer: null as ReturnType<typeof setInterval> | null,

    get current(): FillBlankRound {
      return this.rounds[this.roundIndex] ?? {
        id: 0,
        cite: "",
        url: "",
        fullText: "",
        segments: [],
        answers: [],
        choices: [],
      };
    },

    get difficultyLabel() {
      return getDifficultyConfig(this.difficulty).label;
    },

    get studyHint() {
      const cfg = getDifficultyConfig(this.difficulty);
      if (cfg.studySeconds > 0) {
        return `Memorize this verse — it hides after ${cfg.studySeconds}s (or tap ready sooner).`;
      }
      return "Read this verse, then fill the blank.";
    },

    get activeAnswer() {
      return this.current.answers[this.activeBlank] ?? "";
    },

    get roundComplete() {
      return this.current.answers.every((_, i) => Boolean(this.filled[i]));
    },

    get availableChoices() {
      const locked = new Set<string>();
      this.current.answers.forEach((answer, i) => {
        const filled = this.filled[i];
        if (
          filled &&
          filled.toLowerCase() === answer.toLowerCase() &&
          i !== this.activeBlank
        ) {
          locked.add(answer.toLowerCase());
        }
      });
      return this.current.choices.filter((c) => !locked.has(c.toLowerCase()));
    },

    boot() {
      try {
        const el = document.getElementById("verse-game-payload");
        if (el?.textContent) {
          const data = JSON.parse(el.textContent) as {
            version: string;
            verses: GameVerse[];
            difficulties: DifficultyConfig[];
          };
          this.version = data.version;
          this.verses = data.verses ?? [];
          this.difficulties = data.difficulties?.length
            ? data.difficulties
            : DIFFICULTIES;
        }
      } catch {
        this.verses = [];
      }
      this.difficulty = loadSavedDifficulty();
      this.alreadyDone = isVerseGameDoneToday();
      this.phase = "choose";
    },

    selectDifficulty(id: Difficulty) {
      this.difficulty = id;
      saveDifficulty(id);
    },

    clearStudyTimer() {
      if (this._studyTimer) {
        clearInterval(this._studyTimer);
        this._studyTimer = null;
      }
      this.studySecondsLeft = 0;
    },

    begin() {
      if (!this.verses.length) return;
      this.reward = null;
      this.rounds = buildFillBlankRounds(this.verses, this.difficulty, {
        seed: sessionSeed(17),
        avoidCites: getRecentCites(),
      });
      if (!this.rounds.length) {
        this.phase = "choose";
        return;
      }
      this.score = 0;
      this.totalBlanks = this.rounds.reduce((n, r) => n + r.answers.length, 0);
      this.roundIndex = 0;
      const cfg = getDifficultyConfig(this.difficulty);
      this.firstLetterHint = cfg.firstLetterHint;
      this.enterStudy();
    },

    enterStudy() {
      this.clearStudyTimer();
      this.resetRoundState();
      const cfg = getDifficultyConfig(this.difficulty);
      this.phase = "study";
      if (cfg.studySeconds > 0) {
        this.studySecondsLeft = cfg.studySeconds;
        this._studyTimer = setInterval(() => {
          this.studySecondsLeft -= 1;
          if (this.studySecondsLeft <= 0) {
            this.clearStudyTimer();
            this.startPlay();
          }
        }, 1000);
      }
    },

    backToChoose() {
      this.clearStudyTimer();
      this.phase = "choose";
      this.feedback = "";
      this.filled = {};
    },

    startPlay() {
      this.clearStudyTimer();
      this.phase = "play";
      this.resetRoundState();
    },

    resetRoundState() {
      this.activeBlank = 0;
      this.filled = {};
      this.feedback = "";
      this.lastCorrect = false;
    },

    blankDisplay(seg: { type: string; text: string; answer?: string; blankId?: number }) {
      if (seg.type !== "blank") return seg.text;
      const id = seg.blankId ?? 0;
      if (this.filled[id]) return this.filled[id];
      if (this.firstLetterHint && id === this.activeBlank && this.activeAnswer) {
        return `${this.activeAnswer[0]}___`;
      }
      return "____";
    },

    blankClass(seg: { type: string; blankId?: number }) {
      const id = seg.blankId ?? 0;
      if (this.filled[id]) {
        const ok =
          this.filled[id].toLowerCase() ===
          (this.current.answers[id] ?? "").toLowerCase();
        return ok
          ? "border-[var(--color-gold)] text-[var(--color-success)]"
          : "border-red-400/70 text-red-600 dark:text-red-400";
      }
      if (id === this.activeBlank) {
        return "border-[var(--color-gold)] text-[var(--color-ink-subtle)]";
      }
      return "border-[var(--color-line)] text-[var(--color-ink-subtle)]";
    },

    choiceClass(choice: string) {
      const answer = this.activeAnswer;
      if (this.filled[this.activeBlank]) {
        if (choice.toLowerCase() === answer.toLowerCase()) {
          return "border-[var(--color-gold)] bg-[var(--color-highlight)] text-[var(--color-ink)]";
        }
        if (
          choice === this.filled[this.activeBlank] &&
          choice.toLowerCase() !== answer.toLowerCase()
        ) {
          return "border-red-400/60 text-[var(--color-ink-muted)] opacity-70";
        }
      }
      return "border-[var(--color-line)] text-[var(--color-ink)] hover:border-[var(--color-gold)] hover:bg-[var(--color-highlight)]/50";
    },

    pick(choice: string) {
      if (this.filled[this.activeBlank]) return;
      const blank = this.activeBlank;
      const answer = this.current.answers[blank] ?? "";
      const ok = choice.toLowerCase() === answer.toLowerCase();
      this.lastCorrect = ok;
      if (ok) {
        this.filled = { ...this.filled, [blank]: choice };
        this.score += 1;
        this.feedback = "Yes — locked in.";
      } else {
        this.filled = { ...this.filled, [blank]: answer };
        this.feedback = `Not quite — it’s “${answer}.”`;
      }
      if (blank + 1 < this.current.answers.length) {
        this.activeBlank = blank + 1;
      }
    },

    next() {
      if (this.roundIndex + 1 < this.rounds.length) {
        this.roundIndex += 1;
        this.enterStudy();
        return;
      }
      applyRunReward(this, {
        gameId: "fill",
        score: this.score,
        total: this.totalBlanks,
        cites: this.rounds.map((r) => r.cite),
        difficulty: this.difficulty,
      });
      this.alreadyDone = true;
      this.phase = "done";
    },

    replay() {
      this.begin();
    },

    destroy() {
      this.clearStudyTimer();
    },
  }));

  function finishGameGrow() {
    markAnyGameDone();
    markVerseGameDoneToday();
    markGrow();
  }

  function applyRunReward(
    target: { reward: RewardSnapshot | null },
    result: {
      gameId: GameId;
      score: number;
      total: number;
      cites: string[];
      difficulty?: Difficulty;
      bestStreak?: number;
    },
  ) {
    finishGameGrow();
    const reward = recordGameRun(result);
    const unlocked = syncJourneyUnlocks();
    target.reward = {
      ...reward,
      newMedals: unlocked.newlyUnlocked.map((t) => ({
        id: t.id,
        emoji: t.emoji,
        title: t.title,
        description: t.description,
      })),
    };
  }

  Alpine.data("playRankPanel", () => ({
    rank: null as ReturnType<typeof profileSnapshot> | null,
    boot() {
      this.rank = profileSnapshot();
    },
  }));

  Alpine.data("wordRiverGame", () => ({
    phase: "choose" as "choose" | "play" | "done",
    verses: [] as GameVerse[],
    rounds: [] as UnscrambleRound[],
    roundIndex: 0,
    bank: [] as Array<{ word: string; used: boolean }>,
    built: [] as string[],
    locked: false,
    ok: false,
    feedback: "",
    score: 0,
    reward: null as RewardSnapshot | null,

    get current(): UnscrambleRound {
      return this.rounds[this.roundIndex] ?? {
        id: 0,
        cite: "",
        url: "",
        fullText: "",
        answer: [],
        bank: [],
        hard: false,
      };
    },

    boot() {
      try {
        const el = document.getElementById("unscramble-payload");
        if (el?.textContent) {
          const data = JSON.parse(el.textContent) as { verses: GameVerse[] };
          this.verses = data.verses ?? [];
        }
      } catch {
        this.verses = [];
      }
    },

    start(hardMode: boolean) {
      this.reward = null;
      this.rounds = buildUnscrambleRounds(
        this.verses,
        hardMode ? 50 : 40,
        hardMode,
        { seed: sessionSeed(hardMode ? 3 : 2), avoidCites: getRecentCites() },
      );
      if (!this.rounds.length) {
        this.phase = "choose";
        return;
      }
      this.roundIndex = 0;
      this.score = 0;
      this.loadRound();
      this.phase = "play";
    },

    loadRound() {
      this.built = [];
      this.locked = false;
      this.ok = false;
      this.feedback = "";
      this.bank = this.current.bank.map((word) => ({ word, used: false }));
    },

    pushWord(i: number) {
      if (this.locked || this.bank[i]?.used) return;
      this.bank[i].used = true;
      this.built.push(this.bank[i].word);
      this.checkLine();
    },

    popBuilt(i: number) {
      if (this.locked) return;
      const word = this.built[i];
      this.built.splice(i, 1);
      const chip = this.bank.find((c) => c.word === word && c.used);
      if (chip) chip.used = false;
      this.feedback = "";
    },

    checkLine() {
      if (this.built.length !== this.current.answer.length) return;
      const ok =
        this.built.join(" ").toLowerCase() ===
        this.current.answer.join(" ").toLowerCase();
      this.locked = true;
      this.ok = ok;
      if (ok) {
        this.score += 1;
        this.feedback = "Current true — verse rebuilt.";
      } else {
        this.feedback = `Drifted. True line: “${this.current.answer.join(" ")}”`;
        this.built = [...this.current.answer];
      }
    },

    next() {
      if (this.roundIndex + 1 < this.rounds.length) {
        this.roundIndex += 1;
        this.loadRound();
        return;
      }
      applyRunReward(this, {
        gameId: "unscramble",
        score: this.score,
        total: this.rounds.length,
        cites: this.rounds.map((r) => r.cite),
      });
      this.phase = "done";
    },
  }));

  Alpine.data("citeSnapGame", () => ({
    phase: "play" as "play" | "done",
    verses: [] as GameVerse[],
    rounds: [] as MatchRound[],
    roundIndex: 0,
    locked: false,
    ok: false,
    feedback: "",
    score: 0,
    streak: 0,
    bestStreak: 0,
    picked: "",
    reward: null as RewardSnapshot | null,

    get current(): MatchRound {
      return this.rounds[this.roundIndex] ?? {
        id: 0,
        snippet: "",
        cite: "",
        url: "",
        fullText: "",
        choices: [],
      };
    },

    rebuild() {
      this.rounds = buildMatchRounds(this.verses, 50, {
        seed: sessionSeed(5),
        avoidCites: getRecentCites(),
      });
    },

    boot() {
      try {
        const el = document.getElementById("match-payload");
        if (el?.textContent) {
          const data = JSON.parse(el.textContent) as { verses: GameVerse[] };
          this.verses = data.verses ?? [];
        }
      } catch {
        this.verses = [];
      }
      this.rebuild();
    },

    choiceClass(c: string) {
      if (!this.locked) {
        return "border-[var(--color-line)] text-[var(--color-ink)] hover:border-[var(--color-gold)]";
      }
      if (c === this.current.cite) {
        return "border-[var(--color-gold)] bg-[var(--color-highlight)] text-[var(--color-ink)]";
      }
      if (c === this.picked && !this.ok) {
        return "border-red-400/50 text-[var(--color-ink-muted)] opacity-70";
      }
      return "border-[var(--color-line)] text-[var(--color-ink-subtle)] opacity-50";
    },

    pick(c: string) {
      if (this.locked) return;
      this.picked = c;
      this.locked = true;
      this.ok = c === this.current.cite;
      if (this.ok) {
        this.score += 1;
        this.streak += 1;
        this.bestStreak = Math.max(this.bestStreak, this.streak);
        this.feedback = this.streak > 1 ? `Snap · streak ${this.streak}` : "Snap — true cite.";
      } else {
        this.streak = 0;
        this.feedback = `Near miss. True cite: ${this.current.cite}`;
      }
    },

    next() {
      if (this.roundIndex + 1 < this.rounds.length) {
        this.roundIndex += 1;
        this.locked = false;
        this.feedback = "";
        this.picked = "";
        return;
      }
      applyRunReward(this, {
        gameId: "match",
        score: this.score,
        total: this.rounds.length,
        cites: this.rounds.map((r) => r.cite),
        bestStreak: this.bestStreak,
      });
      this.phase = "done";
    },

    restart() {
      this.reward = null;
      this.rebuild();
      this.roundIndex = 0;
      this.score = 0;
      this.streak = 0;
      this.bestStreak = 0;
      this.locked = false;
      this.feedback = "";
      this.picked = "";
      this.phase = "play";
    },
  }));

  Alpine.data("finishLineGame", () => ({
    phase: "play" as "play" | "done",
    verses: [] as GameVerse[],
    rounds: [] as NextRound[],
    roundIndex: 0,
    locked: false,
    ok: false,
    feedback: "",
    score: 0,
    picked: "",
    reward: null as RewardSnapshot | null,

    get current(): NextRound {
      return this.rounds[this.roundIndex] ?? {
        id: 0,
        lead: "",
        cite: "",
        url: "",
        fullText: "",
        answer: "",
        choices: [],
      };
    },

    rebuild() {
      this.rounds = buildNextRounds(this.verses, 50, {
        seed: sessionSeed(7),
        avoidCites: getRecentCites(),
      });
    },

    boot() {
      try {
        const el = document.getElementById("next-payload");
        if (el?.textContent) {
          const data = JSON.parse(el.textContent) as { verses: GameVerse[] };
          this.verses = data.verses ?? [];
        }
      } catch {
        this.verses = [];
      }
      this.rebuild();
    },

    choiceClass(c: string) {
      if (!this.locked) {
        return "border-[var(--color-line)] text-[var(--color-ink)] hover:border-[var(--color-gold)]";
      }
      if (c === this.current.answer) {
        return "border-[var(--color-gold)] bg-[var(--color-highlight)] text-[var(--color-ink)]";
      }
      if (c === this.picked && !this.ok) {
        return "border-red-400/50 opacity-70";
      }
      return "border-[var(--color-line)] opacity-50";
    },

    pick(c: string) {
      if (this.locked) return;
      this.picked = c;
      this.locked = true;
      this.ok = c === this.current.answer;
      if (this.ok) {
        this.score += 1;
        this.feedback = "Echo holds — ending true.";
      } else {
        this.feedback = "That ending drifts. See the gold line.";
      }
    },

    next() {
      if (this.roundIndex + 1 < this.rounds.length) {
        this.roundIndex += 1;
        this.locked = false;
        this.feedback = "";
        this.picked = "";
        return;
      }
      applyRunReward(this, {
        gameId: "next",
        score: this.score,
        total: this.rounds.length,
        cites: this.rounds.map((r) => r.cite),
      });
      this.phase = "done";
    },

    restart() {
      this.reward = null;
      this.rebuild();
      this.roundIndex = 0;
      this.score = 0;
      this.locked = false;
      this.feedback = "";
      this.picked = "";
      this.phase = "play";
    },
  }));

  Alpine.data("heartCompassGame", () => ({
    phase: "play" as "play" | "done" | "empty",
    verses: [] as GameVerse[],
    rounds: [] as ThemeRound[],
    labels: THEME_LABELS as Record<ThemeId, string>,
    roundIndex: 0,
    locked: false,
    ok: false,
    feedback: "",
    score: 0,
    picked: "" as ThemeId | "",
    reward: null as RewardSnapshot | null,

    get current(): ThemeRound {
      return this.rounds[this.roundIndex] ?? {
        id: 0,
        cite: "",
        url: "",
        fullText: "",
        theme: "hope",
        choices: [],
      };
    },

    rebuild() {
      this.rounds = buildThemeRounds(this.verses, 50, {
        seed: sessionSeed(11),
        avoidCites: getRecentCites(),
      });
    },

    boot() {
      try {
        const el = document.getElementById("theme-payload");
        if (el?.textContent) {
          const data = JSON.parse(el.textContent) as {
            verses: GameVerse[];
            labels: Record<ThemeId, string>;
          };
          this.verses = data.verses ?? [];
          if (data.labels) this.labels = data.labels;
        }
      } catch {
        this.verses = [];
      }
      this.rebuild();
      this.phase = this.rounds.length ? "play" : "empty";
    },

    themeClass(t: ThemeId) {
      if (!this.locked) {
        return "border-[var(--color-line)] text-[var(--color-ink)] hover:border-[var(--color-gold)]";
      }
      if (t === this.current.theme) {
        return "border-[var(--color-gold)] bg-[var(--color-highlight)] text-[var(--color-ink)]";
      }
      if (t === this.picked && !this.ok) {
        return "border-red-400/50 opacity-70";
      }
      return "border-[var(--color-line)] opacity-45";
    },

    pick(t: ThemeId) {
      if (this.locked) return;
      this.picked = t;
      this.locked = true;
      this.ok = t === this.current.theme;
      if (this.ok) {
        this.score += 1;
        this.feedback = `True north: ${this.labels[t]}.`;
      } else {
        this.feedback = `Closer to ${this.labels[this.current.theme]}.`;
      }
    },

    next() {
      if (this.roundIndex + 1 < this.rounds.length) {
        this.roundIndex += 1;
        this.locked = false;
        this.feedback = "";
        this.picked = "";
        return;
      }
      applyRunReward(this, {
        gameId: "theme",
        score: this.score,
        total: this.rounds.length,
        cites: this.rounds.map((r) => r.cite),
      });
      this.phase = "done";
    },

    restart() {
      this.reward = null;
      this.rebuild();
      this.roundIndex = 0;
      this.score = 0;
      this.locked = false;
      this.feedback = "";
      this.picked = "";
      this.phase = this.rounds.length ? "play" : "empty";
    },
  }));

  Alpine.data("breathSprintGame", () => ({
    phase: "ready" as "ready" | "play" | "done",
    verses: [] as GameVerse[],
    rounds: [] as FillBlankRound[],
    roundIndex: 0,
    totalTime: 60,
    timeLeft: 60,
    score: 0,
    streak: 0,
    bestStreak: 0,
    filled: "",
    attempted: 0,
    reward: null as RewardSnapshot | null,
    _timer: null as ReturnType<typeof setInterval> | null,

    get current(): FillBlankRound {
      return this.rounds[this.roundIndex] ?? {
        id: 0,
        cite: "",
        url: "",
        fullText: "",
        segments: [],
        answers: [],
        choices: [],
      };
    },

    boot() {
      try {
        const el = document.getElementById("sprint-payload");
        if (el?.textContent) {
          const data = JSON.parse(el.textContent) as {
            verses: GameVerse[];
            seconds: number;
          };
          this.verses = data.verses ?? [];
          this.totalTime = data.seconds ?? 60;
          this.timeLeft = this.totalTime;
        }
      } catch {
        this.verses = [];
      }
    },

    clearTimer() {
      if (this._timer) {
        clearInterval(this._timer);
        this._timer = null;
      }
    },

    start() {
      this.reward = null;
      this.rounds = buildSprintRounds(this.verses, {
        seed: sessionSeed(13),
        avoidCites: getRecentCites(),
      }).map((r, id) => ({ ...r, id }));
      if (!this.rounds.length) return;
      this.clearTimer();
      this.roundIndex = 0;
      this.score = 0;
      this.streak = 0;
      this.bestStreak = 0;
      this.attempted = 0;
      this.filled = "";
      this.timeLeft = this.totalTime;
      this.phase = "play";
      this._timer = setInterval(() => {
        this.timeLeft -= 1;
        if (this.timeLeft <= 0) {
          this.endRun();
        }
      }, 1000);
    },

    pick(c: string) {
      if (this.phase !== "play") return;
      const answer = this.current.answers[0] ?? "";
      const ok = c.toLowerCase() === answer.toLowerCase();
      this.filled = ok ? c : answer;
      this.attempted += 1;
      if (ok) {
        this.score += 1;
        this.streak += 1;
        this.bestStreak = Math.max(this.bestStreak, this.streak);
        if (this.streak > 0 && this.streak % 3 === 0) {
          this.timeLeft = Math.min(this.totalTime, this.timeLeft + 2);
        }
      } else {
        this.streak = 0;
      }
      window.setTimeout(() => this.advance(), ok ? 280 : 520);
    },

    advance() {
      if (this.phase !== "play") return;
      this.filled = "";
      if (this.roundIndex + 1 < this.rounds.length) {
        this.roundIndex += 1;
      } else {
        this.roundIndex = 0;
      }
    },

    endRun() {
      this.clearTimer();
      this.timeLeft = 0;
      applyRunReward(this, {
        gameId: "speed",
        score: this.score,
        total: Math.max(this.attempted, this.score),
        cites: this.rounds.slice(0, Math.max(this.attempted, 1)).map((r) => r.cite),
        bestStreak: this.bestStreak,
      });
      this.phase = "done";
    },

    destroy() {
      this.clearTimer();
    },
  }));

}
