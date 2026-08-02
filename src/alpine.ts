import type { Alpine } from "alpinejs";
import {
  getAnnotation,
  HIGHLIGHT_COLORS,
  loadAnnotations,
  parseVerseKey,
  saveAnnotations,
  upsertAnnotation,
  verseKey,
  type AnnotationMap,
  type HighlightColorId,
} from "./lib/annotations";
import { DEFAULT_VERSION, VERSIONS, languageBadge, type VersionId } from "./lib/versions";
import { loadLastRead, loadStreak, saveLastRead } from "./lib/reading";
import { parseReference, normalizeSpokenReference } from "./lib/parseReference";
import {
  speakBibleChapter,
  speakBibleVerse,
  warmSpeechVoices,
  type SpeakHandle,
} from "./lib/speakBible";
import { micExamplePhrase, speechRecognitionLang } from "./lib/speechLang";
import {
  completeDevotion,
  journeyProgress,
  loadJourney,
  recordAppOpen,
  TROPHIES,
} from "./lib/journey";
import {
  getTodayStatus,
  isChallengeDone,
  loadProgress,
  markChallengeDone,
  markGrow,
  markOpened,
  markPlanDay,
  markQuizDone,
  markRead,
  planCompletedCount,
  saveReflection,
  setActivePlan,
  isQuizDone,
} from "./lib/progress";
import { syncJourneyUnlocks } from "./lib/syncUnlocks";
import { addPrayer, loadPrayers, removePrayer, type PrayerEntry } from "./lib/prayers";
import {
  bindInstallPromptCapture,
  browserMaySupportInstallPrompt,
  clearDeferredInstallPrompt,
  consumeJustInstalledTip,
  detectInstallPlatform,
  dismissInstallPrompt,
  getDeferredInstallPrompt,
  hideInstallForSession,
  isLikelyInAppBrowser,
  markJustInstalled,
  openInChromeAndroid,
  shouldShowInstallBanner,
  waitForDeferredInstallPrompt,
  type InstallPlatform,
} from "./lib/installApp";
import {
  addWallComment,
  checkWallLive,
  createWallRequest,
  isWallLive,
  listWallRequests,
  removeOwnRequest,
  toggleReaction,
  type ReactionType,
  type WallRequest,
} from "./lib/prayerWall";
import { getChallengeForDate } from "./lib/challenges";
import { getPlan, nextPlanDay } from "./lib/plans";
import {
  formatReminderTime,
  isOneSignalConfigured,
  loadReminderPrefs,
  notificationPermission,
  notificationsSupported,
  requestNotificationPermission,
  saveReminderPrefs,
  syncReminderSchedule,
} from "./lib/reminders";
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
} from "./lib/verseGame";
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
} from "./lib/gamePacks";
import {
  getRecentCites,
  profileSnapshot,
  recordGameRun,
  sessionSeed,
  type GameId,
  type RewardSnapshot,
} from "./lib/gameRewards";
import { getDeviceId } from "./lib/deviceId";
import { isFeedbackLive, submitFeedback } from "./lib/feedback";
import {
  chromeSpeechLikelyBroken,
  hasBrowserSpeech,
  hasMicrophone,
  startLocalRecording,
  warmLocalVoice,
  VOICE_ENGINE,
  type LocalVoiceSession,
} from "./lib/localVoice";

type SearchDoc = {
  id: string;
  book: string;
  slug: string;
  chapter: number;
  verse: number;
  text: string;
};

type SearchWorkerOut =
  | { type: "ready" }
  | { type: "error"; message: string }
  | {
      type: "results";
      id: number;
      hits: SearchDoc[];
    };

const THEME_KEY = "bible-theme";
const VERSION_KEY = "bible-version";

type VersionPickerGroup = {
  languageName: string;
  langCode: string;
  versions: Array<{ id: string; shortLabel: string; description: string }>;
};

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((ev: Event) => void) | null;
  onerror: ((ev: Event) => void) | null;
  onend: (() => void) | null;
};

function resolveDark(): boolean {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "dark") return true;
  if (saved === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function versionLabel(id: string) {
  return VERSIONS[id as VersionId]?.shortLabel ?? id.toUpperCase();
}

function titleCaseSlug(slug: string) {
  return slug
    .split("-")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

export default (Alpine: Alpine) => {
  bindInstallPromptCapture();

  Alpine.store("theme", {
    dark: false,

    init() {
      this.dark = document.documentElement.classList.contains("dark");
    },

    toggle() {
      this.dark = !this.dark;
      document.documentElement.classList.toggle("dark", this.dark);
      localStorage.setItem(THEME_KEY, this.dark ? "dark" : "light");
    },

    set(mode: "light" | "dark") {
      this.dark = mode === "dark";
      document.documentElement.classList.toggle("dark", this.dark);
      localStorage.setItem(THEME_KEY, mode);
    },
  });

  // Keep daily reminder scheduled when the user returns to the app
  if (typeof window !== "undefined") {
    window.addEventListener("load", () => {
      const prefs = loadReminderPrefs();
      if (!prefs.enabled) return;
      if (notificationPermission() !== "granted") return;
      void navigator.serviceWorker?.ready.then(() => syncReminderSchedule(prefs));
    });
  }

  window.addEventListener("storage", (e) => {
    if (e.key !== THEME_KEY) return;
    const dark = resolveDark();
    document.documentElement.classList.toggle("dark", dark);
    (Alpine.store("theme") as { dark: boolean }).dark = dark;
  });

  Alpine.data("installAppBanner", () => ({
    open: false,
    showGuide: false,
    showSuccessTip: false,
    platform: "other" as InstallPlatform,
    canPrompt: false,
    inAppBrowser: false,
    maySupportPrompt: false,
    /** After we tried and browser still has no install prompt */
    installBlocked: false,
    installBusy: false,
    installHint: "",

    get title() {
      if (this.showSuccessTip) return "Installed!";
      if (this.platform === "ios") return "Add Bible to Home Screen";
      if (this.inAppBrowser) return "Install Bible — Open Chrome";
      if (this.installBlocked) return "Open Chrome to install";
      return "Install Bible — 1 tap";
    },

    get blurb() {
      if (this.showSuccessTip) {
        return "Look for the Bible icon on your home screen, then open it anytime.";
      }
      if (this.platform === "ios") {
        return "Sa iPhone: Share → Add to Home Screen. Isang beses lang.";
      }
      if (this.inAppBrowser) {
        return "Naka-Facebook / Messenger ka. Buksan muna sa Chrome para 1-tap install.";
      }
      if (this.installBlocked) {
        return this.platform === "android"
          ? "Hindi pwede i-install dito. Buksan sa Chrome, tapos Install — 1 tap."
          : "Use Chrome or Edge, then tap Install — 1 tap.";
      }
      if (this.canPrompt) {
        return "1 tap lang — lalabas sa home screen mo parang app.";
      }
      if (this.platform === "android" && this.maySupportPrompt) {
        return "1 tap lang sa Chrome — diretso sa phone mo.";
      }
      if (this.maySupportPrompt) {
        return "1 tap — install to your device.";
      }
      return "Buksan sa Chrome o Edge para i-install nang madali.";
    },

    /** Show the big primary install / chrome button */
    get showPrimaryInstall() {
      if (this.showSuccessTip) return false;
      if (this.platform === "ios") return true;
      if (this.inAppBrowser) return true;
      if (this.installBlocked) return this.platform === "android";
      if (this.canPrompt || this.maySupportPrompt) return true;
      return this.platform === "android";
    },

    get primaryLabel() {
      if (this.platform === "ios") return "Show steps";
      if (this.installBusy) return "Please wait…";
      if (this.inAppBrowser || this.installBlocked) return "Open in Chrome to Install";
      if (this.canPrompt) return "Install — 1 tap";
      return "Install — 1 tap";
    },

    boot() {
      this.platform = detectInstallPlatform();
      this.inAppBrowser = isLikelyInAppBrowser();
      this.maySupportPrompt = browserMaySupportInstallPrompt();
      this.canPrompt = Boolean(getDeferredInstallPrompt());
      this.installBlocked = !this.inAppBrowser && !this.maySupportPrompt && this.platform !== "ios";

      if (consumeJustInstalledTip()) {
        this.showSuccessTip = true;
        this.open = true;
        window.setTimeout(() => {
          this.showSuccessTip = false;
          this.open = false;
        }, 8000);
        return;
      }

      this.open = shouldShowInstallBanner();

      const onAvailable = () => {
        this.canPrompt = true;
        this.installBlocked = false;
        this.installHint = "";
        if (shouldShowInstallBanner()) this.open = true;
      };
      const onInstalled = () => {
        markJustInstalled();
        this.canPrompt = false;
        this.installBusy = false;
        this.installBlocked = false;
        this.showGuide = false;
        this.showSuccessTip = true;
        this.open = true;
        this.installHint = "";
        window.setTimeout(() => {
          this.showSuccessTip = false;
          this.open = false;
        }, 8000);
      };

      window.addEventListener("bible-install-available", onAvailable);
      window.addEventListener("bible-app-installed", onInstalled);

      if (this.open && !this.showSuccessTip) {
        this.open = false;
        window.setTimeout(() => {
          if (shouldShowInstallBanner()) this.open = true;
        }, 900);
      }
    },

    async runNativeInstall() {
      const promptEvent = getDeferredInstallPrompt();
      if (!promptEvent) return false;
      this.installBusy = true;
      this.installHint = "";
      this.showGuide = false;
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        clearDeferredInstallPrompt();
        this.canPrompt = false;
        if (choice.outcome === "accepted") {
          markJustInstalled();
          dismissInstallPrompt();
          this.showSuccessTip = true;
          this.open = true;
          window.setTimeout(() => {
            this.showSuccessTip = false;
            this.open = false;
          }, 8000);
        } else {
          this.installHint = "Canceled. Tap Install — 1 tap again anytime.";
        }
        return true;
      } catch {
        this.installHint = "Hindi na-open. Subukan sa Chrome.";
        this.installBlocked = true;
        return true;
      } finally {
        this.installBusy = false;
      }
    },

    async primaryAction() {
      if (this.showSuccessTip) {
        this.open = false;
        this.showSuccessTip = false;
        return;
      }

      if (this.platform === "ios") {
        this.showGuide = true;
        this.installHint = "";
        return;
      }

      // In-app or blocked: only open Chrome — never fake install.
      if (this.inAppBrowser || this.installBlocked) {
        if (this.platform === "android") {
          this.installHint = "Opening Chrome…";
          openInChromeAndroid();
        } else {
          this.installHint = "Copy the link and open it in Chrome or Edge.";
          this.showGuide = true;
        }
        return;
      }

      if (await this.runNativeInstall()) return;

      this.installBusy = true;
      this.installHint = "Starting…";
      await waitForDeferredInstallPrompt(this.platform === "android" ? 3200 : 1800);
      this.canPrompt = Boolean(getDeferredInstallPrompt());
      this.installBusy = false;

      if (await this.runNativeInstall()) return;

      // No prompt after wait — stop the fake Install loop.
      this.installBlocked = true;
      this.installHint =
        this.platform === "android"
          ? "Tap “Open in Chrome to Install” below."
          : "Open this site in Chrome or Edge to install.";
      this.showGuide = false;
    },

    openHelp() {
      this.showGuide = true;
    },

    dismissSuccess() {
      this.showSuccessTip = false;
      this.open = false;
    },

    notNow() {
      this.open = false;
      this.showGuide = false;
      this.showSuccessTip = false;
      this.installHint = "";
      hideInstallForSession();
    },

    neverShow() {
      dismissInstallPrompt();
      this.open = false;
      this.showGuide = false;
      this.showSuccessTip = false;
      this.installHint = "";
    },
  }));

  Alpine.data(
    "versionPicker",
    (payload: string | { version: string; groups: VersionPickerGroup[] }) => {
      const data =
        typeof payload === "string"
          ? { version: payload, groups: [] as VersionPickerGroup[] }
          : payload;

      return {
        current: data.version,
        open: false,
        q: "",
        groups: data.groups,

        get shortLabel() {
          return VERSIONS[this.current]?.shortLabel ?? this.current;
        },

        get badge() {
          return languageBadge(VERSIONS[this.current]?.language ?? "en");
        },

        get label() {
          const meta = VERSIONS[this.current];
          return meta ? `${meta.languageName} · ${meta.shortLabel}` : this.current;
        },

        get filtered() {
          const needle = this.q.trim().toLowerCase();
          if (!needle) return this.groups;

          return this.groups
            .map((group) => {
              const langHit =
                group.languageName.toLowerCase().includes(needle) ||
                group.langCode.toLowerCase().includes(needle);
              if (langHit) return group;
              const versions = group.versions.filter(
                (opt) =>
                  opt.shortLabel.toLowerCase().includes(needle) ||
                  opt.description.toLowerCase().includes(needle) ||
                  opt.id.toLowerCase().includes(needle),
              );
              return versions.length ? { ...group, versions } : null;
            })
            .filter((group): group is VersionPickerGroup => group != null);
        },

        init() {
          const path = window.location.pathname.replace(/\/+$/, "") || "/";
          if (path === "/saved") {
            try {
              const saved = localStorage.getItem(VERSION_KEY);
              if (saved && saved in VERSIONS) this.current = saved;
            } catch {
              /* ignore */
            }
          }
        },

        toggle() {
          if (this.open) {
            this.close();
            return;
          }
          this.open = true;
          this.$nextTick(() => {
            const el = this.$refs.langSearch as HTMLInputElement | undefined;
            el?.focus();
            el?.select();
          });
        },

        close() {
          this.open = false;
          this.q = "";
        },

        pickFirst() {
          const first = this.filtered[0]?.versions[0];
          if (first) this.switchTo(first.id);
        },

        switchTo(next: string) {
          this.close();
          localStorage.setItem(VERSION_KEY, next);
          const path = window.location.pathname.replace(/\/+$/, "") || "/";
          const parts = path.split("/").filter(Boolean);

          if (parts.length === 0 || parts[0] === "saved") {
            window.location.href = `/${next}/`;
            return;
          }

          if (parts[0] && parts[0] in VERSIONS) {
            parts[0] = next;
            window.location.href = "/" + parts.join("/");
            return;
          }

          window.location.href = `/${next}/`;
        },
      };
    },
  );

  Alpine.data("copyVerse", (text: string, label: string) => ({
    copied: false,

    async copy() {
      const line = `"${text}" — ${label}`;
      try {
        await navigator.clipboard.writeText(line);
        this.copied = true;
        setTimeout(() => {
          this.copied = false;
        }, 1600);
      } catch {
        this.copied = false;
      }
    },
  }));

  Alpine.data("givePage", () => ({
    copiedId: "" as string,
    _copyTimer: null as ReturnType<typeof setTimeout> | null,

    async copyNumber(number: string, id: string) {
      try {
        await navigator.clipboard.writeText(number);
        this.copiedId = id;
        if (this._copyTimer) clearTimeout(this._copyTimer);
        this._copyTimer = setTimeout(() => {
          this.copiedId = "";
        }, 1800);
      } catch {
        this.copiedId = "";
      }
    },
  }));

  Alpine.data("homeDashboard", (version: string) => ({
    version,
    continueUrl: "",
    continueLabel: "",
    savedCount: 0,
    streak: 0,
    welcome: "Welcome. God’s Word is waiting for you.",

    init() {
      const journey = recordAppOpen();
      markOpened();
      const last = loadLastRead();
      const progress = loadProgress();
      if (last) {
        this.continueUrl = `/${last.version}/chapter/${last.slug}/${last.chapter}`;
        this.continueLabel = `${last.book} ${last.chapter}`;
        this.welcome = "Welcome back. Continue today when you’re ready.";
      } else if (progress.activePlanId) {
        const plan = getPlan(progress.activePlanId);
        if (plan) {
          const next = nextPlanDay(plan, progress.planDaysDone);
          if (next) {
            this.continueUrl = `/${version}/chapter/${next.slug}/${next.chapter}`;
            this.continueLabel = `Plan · ${next.label}`;
            this.welcome = "Welcome. Your reading plan is ready.";
          }
        }
      }
      const map = loadAnnotations();
      this.savedCount = Object.keys(map).length;
      this.streak = journey.streak || loadStreak().count;
    },
  }));

  Alpine.data("todayPanel", (version: string, challengeId: string) => ({
    version,
    challengeId,
    opened: false,
    read: false,
    grow: false,
    challengeDone: false,
    doneCount: 0,
    total: 4,
    complete: false,
    continueUrl: "",
    planUrl: "",
    booksUrl: `/${version}/#books`,
    readNote: "Open any chapter to check this off.",
    reflection: "",

    refresh() {
      recordAppOpen();
      markOpened();
      const status = getTodayStatus();
      this.opened = status.opened;
      this.read = status.read;
      this.grow = status.grow;
      this.challengeDone = status.challenge || isChallengeDone(this.challengeId);
      this.doneCount = status.doneCount;
      this.total = status.total;
      this.complete = status.complete;

      const last = loadLastRead();
      if (last) {
        this.continueUrl = `/${last.version}/chapter/${last.slug}/${last.chapter}`;
        this.readNote = status.read
          ? `Read today · last open ${last.book} ${last.chapter}`
          : `Continue ${last.book} ${last.chapter}`;
      }

      const progress = loadProgress();
      if (progress.activePlanId) {
        this.planUrl = `/${version}/plans/${progress.activePlanId}`;
        const plan = getPlan(progress.activePlanId);
        if (plan) {
          const next = nextPlanDay(plan, progress.planDaysDone);
          if (next && !this.continueUrl) {
            this.continueUrl = `/${version}/chapter/${next.slug}/${next.chapter}`;
            this.readNote = `Next plan day: ${next.label}`;
          }
        }
      }

      this.reflection = progress.reflections[status.date] || "";
    },

    completeChallenge() {
      markChallengeDone(this.challengeId);
      syncJourneyUnlocks();
      this.refresh();
    },

    saveReflectionText() {
      if (!this.reflection.trim()) return;
      saveReflection(this.reflection);
      markChallengeDone(this.challengeId);
      syncJourneyUnlocks();
      this.refresh();
    },
  }));

  Alpine.data("plansPanel", () => ({
    activeLabel: "",
    activeProgress: "",

    refresh() {
      const progress = loadProgress();
      if (!progress.activePlanId) {
        this.activeLabel = "";
        this.activeProgress = "";
        return;
      }
      const plan = getPlan(progress.activePlanId);
      if (!plan) return;
      const done = planCompletedCount(plan.id);
      this.activeLabel = plan.title;
      this.activeProgress = `${done} / ${plan.days.length} days`;
    },
  }));

  Alpine.data("planDetail", (version: string, planId: string, totalDays: number) => ({
    version,
    planId,
    totalDays,
    isActive: false,
    doneCount: 0,
    doneSet: [] as number[],
    nextUrl: "",
    nextLabel: "",

    refresh() {
      const progress = loadProgress();
      this.isActive = progress.activePlanId === this.planId;
      this.doneCount = planCompletedCount(this.planId);
      this.doneSet = progress.planDaysDone
        .filter((k) => k.startsWith(`${this.planId}:`))
        .map((k) => Number(k.split(":")[1]))
        .filter((n) => Number.isFinite(n));

      const plan = getPlan(this.planId);
      if (!plan) return;
      const next = nextPlanDay(plan, progress.planDaysDone);
      if (next) {
        this.nextUrl = `/${this.version}/chapter/${next.slug}/${next.chapter}`;
        this.nextLabel = next.label;
      } else {
        this.nextUrl = "";
        this.nextLabel = "";
      }
    },

    startPlan() {
      setActivePlan(this.planId);
      this.refresh();
    },

    markDay(dayNumber: number) {
      setActivePlan(this.planId);
      markPlanDay(this.planId, dayNumber);
      this.refresh();
    },
  }));

  Alpine.data("chapterQuiz", (slug: string, chapter: number) => ({
    slug,
    chapter,
    open: false,
    revealed: {} as Record<number, boolean>,
    done: false,

    init() {
      this.done = isQuizDone(this.slug, this.chapter);
    },

    toggle() {
      this.open = !this.open;
    },

    reveal(i: number) {
      this.revealed = { ...this.revealed, [i]: true };
    },

    finish() {
      markQuizDone(this.slug, this.chapter);
      markGrow();
      syncJourneyUnlocks();
      this.done = true;
    },
  }));

  Alpine.data("journeyPanel", () => ({
    streak: 0,
    levelName: "Seed",
    levelBlurb: "",
    progress: 0,
    nextLevelNote: "",
    streakNote: "Open today to begin.",
    trophyCount: 0,
    trophyTotal: TROPHIES.length,
    trophies: [] as string[],
    devotionDone: 0,

    refresh() {
      const state = recordAppOpen();
      markOpened();
      const unlocked = syncJourneyUnlocks();
      const prog = journeyProgress(state.streak);

      this.streak = state.streak;
      this.levelName = prog.current.name;
      this.levelBlurb = prog.current.blurb;
      this.progress = prog.ratio;
      this.trophies = unlocked.trophies;
      this.trophyCount = this.trophies.length;
      this.devotionDone = state.completedDevotions.length;
      this.streakNote =
        state.streak <= 0 ? "Open today to begin." : "Keep coming back each day.";
      this.nextLevelNote = prog.next
        ? `${prog.remaining} more day${prog.remaining === 1 ? "" : "s"} to ${prog.next.name}`
        : "Highest level — stay faithful";
    },
  }));

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

  Alpine.data("reminderSettings", () => ({
    enabled: false,
    timeValue: "07:00",
    busy: false,
    status: "",
    error: "",
    supportNote: "",
    _statusTimer: null as ReturnType<typeof setTimeout> | null,

    init() {
      const prefs = loadReminderPrefs();
      this.enabled = prefs.enabled;
      this.timeValue = `${String(prefs.hour).padStart(2, "0")}:${String(prefs.minute).padStart(2, "0")}`;
      this.supportNote = this.buildSupportNote();
      if (prefs.enabled) {
        void this.resync(false);
      }
    },

    buildSupportNote() {
      if (!notificationsSupported()) {
        return "Notifications are not available in this browser.";
      }
      const onesignal = isOneSignalConfigured()
        ? " OneSignal is connected for broader push support."
        : "";
      return `Works best on Chrome, Edge, or an installed app (PWA). Open the app occasionally so the next reminder can be scheduled.${onesignal}`;
    },

    flash(message: string) {
      this.status = message;
      if (this._statusTimer) clearTimeout(this._statusTimer);
      this._statusTimer = setTimeout(() => {
        this.status = "";
      }, 3200);
    },

    parseTime(): { hour: number; minute: number } {
      const [h, m] = (this.timeValue || "07:00").split(":").map((x) => Number(x));
      return {
        hour: Number.isFinite(h) ? h : 7,
        minute: Number.isFinite(m) ? m : 0,
      };
    },

    async toggle() {
      this.error = "";
      if (this.enabled) {
        await this.enable();
      } else {
        await this.disable();
      }
    },

    async enable() {
      this.busy = true;
      this.error = "";
      try {
        if (!notificationsSupported()) {
          this.enabled = false;
          this.error = "Notifications are not supported here.";
          return;
        }
        const permission = await requestNotificationPermission();
        if (permission !== "granted") {
          this.enabled = false;
          this.error =
            permission === "denied"
              ? "Notifications are blocked. Allow them in browser settings to enable reminders."
              : "Permission is needed to send a daily reminder.";
          return;
        }
        const { hour, minute } = this.parseTime();
        const prefs = { enabled: true, hour, minute };
        saveReminderPrefs(prefs);
        const result = await syncReminderSchedule(prefs);
        await this.optInOneSignal();
        if (!result.ok) {
          this.error = result.reason;
          return;
        }
        const when = formatReminderTime(hour, minute);
        if (result.mode === "scheduled") {
          this.flash(`Reminder set for ${when}.`);
        } else {
          this.flash(
            `Reminder saved for ${when}. We’ll keep it scheduled when you open the app.`,
          );
        }
      } finally {
        this.busy = false;
        this.supportNote = this.buildSupportNote();
      }
    },

    async disable() {
      this.busy = true;
      this.error = "";
      try {
        const { hour, minute } = this.parseTime();
        const prefs = { enabled: false, hour, minute };
        saveReminderPrefs(prefs);
        await syncReminderSchedule(prefs);
        await this.optOutOneSignal();
        this.flash("Reminders turned off.");
      } finally {
        this.busy = false;
      }
    },

    async saveTime() {
      if (!this.enabled) return;
      this.busy = true;
      this.error = "";
      try {
        const { hour, minute } = this.parseTime();
        const prefs = { enabled: true, hour, minute };
        saveReminderPrefs(prefs);
        const result = await syncReminderSchedule(prefs);
        if (!result.ok) {
          this.error = result.reason;
          return;
        }
        this.flash(`Updated — next reminder around ${formatReminderTime(hour, minute)}.`);
      } finally {
        this.busy = false;
      }
    },

    async resync(showStatus: boolean) {
      const prefs = loadReminderPrefs();
      if (!prefs.enabled) return;
      if (notificationPermission() !== "granted") return;
      const result = await syncReminderSchedule(prefs);
      if (showStatus && result.ok) {
        this.flash(`Next reminder around ${formatReminderTime(prefs.hour, prefs.minute)}.`);
      }
    },

    async optInOneSignal() {
      const w = window as Window & {
        OneSignal?: { User: { PushSubscription: { optIn: () => Promise<void> } } };
      };
      try {
        if (w.OneSignal?.User?.PushSubscription) {
          await w.OneSignal.User.PushSubscription.optIn();
        }
      } catch {
        /* optional */
      }
    },

    async optOutOneSignal() {
      const w = window as Window & {
        OneSignal?: { User: { PushSubscription: { optOut: () => Promise<void> } } };
      };
      try {
        if (w.OneSignal?.User?.PushSubscription) {
          await w.OneSignal.User.PushSubscription.optOut();
        }
      } catch {
        /* optional */
      }
    },
  }));

  Alpine.data("devotionTheme", (theme: string, entryIds: string[] = []) => ({
    theme,
    entryIds,
    completed: [] as string[],
    doneCount: 0,

    init() {
      recordAppOpen();
      markOpened();
      this.sync();
    },

    sync() {
      const state = loadJourney();
      const prefix = `${this.theme}:`;
      this.completed = state.completedDevotions
        .filter((k) => k.startsWith(prefix))
        .map((k) => k.slice(prefix.length));
      this.doneCount = this.completed.length;
    },

    markDone(entryId: string) {
      completeDevotion(this.theme, entryId);
      markGrow();
      const challenge = getChallengeForDate();
      if (challenge.id === "one-devotion") {
        markChallengeDone(challenge.id);
      }
      syncJourneyUnlocks();
      this.sync();
    },
  }));

  Alpine.data("chapterReader", (config: {
    version: string;
    bookSlug: string;
    chapter: number;
    bookName?: string;
    versionLabel?: string;
    compareVersion?: string | null;
    compareLabel?: string | null;
    compareVerses?: Record<string, string> | null;
  }) => ({
      version: config.version,
      bookSlug: config.bookSlug,
      chapter: config.chapter,
      bookName: config.bookName || "",
      versionLabel: config.versionLabel || "",
      compareVersion: config.compareVersion || null,
      compareLabel: config.compareLabel || null,
      compareVerses: config.compareVerses || null,
      showCompare: false,
      actionStatus: "" as string,
      annotations: {} as AnnotationMap,
      openNote: null as number | null,
      activeMenu: null as number | null,
      menuPanel: "actions" as "actions" | "colors",
      highlightColors: HIGHLIGHT_COLORS,
      flashVerse: null as number | null,
      showTip: false,
      fontScale: 1,
      progress: 0,
      _onScroll: null as null | (() => void),
      _onKeydown: null as null | ((e: KeyboardEvent) => void),
      _pressTimer: null as ReturnType<typeof setTimeout> | null,
      _pressVerse: null as number | null,
      _pressX: 0,
      _pressY: 0,
      _activePointerId: null as number | null,
      _ignoreOutsideUntil: 0,
      _statusTimer: null as ReturnType<typeof setTimeout> | null,
      speaking: false,
      speakingVerse: null as number | null,
      _speakHandle: null as SpeakHandle | null,

      init() {
        const lang = VERSIONS[this.version]?.language || "en";
        warmSpeechVoices(lang);
        this.annotations = loadAnnotations();
        try {
          this.showTip = localStorage.getItem("bible-tip-press-seen") !== "1";
        } catch {
          this.showTip = true;
        }
        try {
          const saved = Number(localStorage.getItem("bible-font-scale"));
          if (saved >= 0.9 && saved <= 1.35) this.fontScale = saved;
        } catch {
          /* ignore */
        }
        try {
          this.showCompare = localStorage.getItem("bible-show-compare") === "1";
        } catch {
          /* ignore */
        }
        saveLastRead({
          version: this.version,
          slug: this.bookSlug,
          book: this.bookName || titleCaseSlug(this.bookSlug),
          chapter: this.chapter,
        });
        markRead(this.version, this.bookSlug, this.chapter);
        markOpened();
        const challenge = getChallengeForDate();
        if (challenge.id === "read-chapter" || challenge.id === "todays-verse") {
          // Reading counts toward challenge; user can still mark explicitly on Today
        }
        const progress = loadProgress();
        if (progress.activePlanId) {
          const plan = getPlan(progress.activePlanId);
          const match = plan?.days.find(
            (d) => d.slug === this.bookSlug && d.chapter === this.chapter,
          );
          if (match) markPlanDay(progress.activePlanId, match.day);
        }
        this._onScroll = () => {
          const doc = document.documentElement;
          const max = doc.scrollHeight - window.innerHeight;
          this.progress =
            max > 0 ? Math.min(100, Math.round((window.scrollY / max) * 100)) : 0;
        };
        window.addEventListener("scroll", this._onScroll, { passive: true });
        this._onScroll();
        this._onKeydown = (e: KeyboardEvent) => {
          if (e.key !== "Escape") return;
          if (this.activeMenu != null) {
            this.closeMenu();
            e.preventDefault();
          } else if (this.openNote != null) {
            this.openNote = null;
            e.preventDefault();
          }
        };
        window.addEventListener("keydown", this._onKeydown);
        this.$nextTick(() => this.scrollToHash());
      },

      destroy() {
        this.stopSpeaking();
        this.clearPress();
        if (this._statusTimer) clearTimeout(this._statusTimer);
        if (this._onScroll) {
          window.removeEventListener("scroll", this._onScroll);
        }
        if (this._onKeydown) {
          window.removeEventListener("keydown", this._onKeydown);
        }
      },

      hasCompare() {
        return Boolean(this.compareVerses && Object.keys(this.compareVerses).length);
      },

      compareText(verse: number) {
        return this.compareVerses?.[String(verse)] || "";
      },

      toggleCompare() {
        this.showCompare = !this.showCompare;
        try {
          localStorage.setItem("bible-show-compare", this.showCompare ? "1" : "0");
        } catch {
          /* ignore */
        }
      },

      bump(delta: number) {
        this.fontScale = Math.min(
          1.35,
          Math.max(0.9, Number((this.fontScale + delta).toFixed(2))),
        );
        try {
          localStorage.setItem("bible-font-scale", String(this.fontScale));
        } catch {
          /* ignore */
        }
      },

      dismissTip() {
        this.showTip = false;
        try {
          localStorage.setItem("bible-tip-press-seen", "1");
        } catch {
          /* ignore */
        }
      },

      flashStatus(message: string) {
        this.actionStatus = message;
        if (this._statusTimer) clearTimeout(this._statusTimer);
        this._statusTimer = setTimeout(() => {
          this.actionStatus = "";
        }, 2200);
      },

      scrollToHash() {
        const match = window.location.hash.match(/^#v(\d+)$/i);
        if (!match) return;
        const n = Number(match[1]);
        const el = document.getElementById(`v${n}`);
        if (!el) return;
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        this.flashVerse = n;
        window.setTimeout(() => {
          if (this.flashVerse === n) this.flashVerse = null;
        }, 2200);
      },

      key(verse: number) {
        return verseKey(this.version, this.bookSlug, this.chapter, verse);
      },

      isHighlighted(verse: number) {
        return Boolean(this.highlightColor(verse));
      },

      highlightColor(verse: number): HighlightColorId | null {
        return getAnnotation(this.annotations, this.key(verse)).highlightColor;
      },

      noteText(verse: number) {
        return getAnnotation(this.annotations, this.key(verse)).note;
      },

      clearPress() {
        if (this._pressTimer) {
          clearTimeout(this._pressTimer);
          this._pressTimer = null;
        }
        this._pressVerse = null;
      },

      onPressStart(verse: number, event: PointerEvent) {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        if (this._activePointerId != null) return;
        // Don't steal the gesture from real controls inside the verse row
        const target = event.target as HTMLElement | null;
        if (target?.closest("button, a, textarea, input, [role='menu']")) return;

        this.clearPress();
        this._activePointerId = event.pointerId;
        this._pressVerse = verse;
        this._pressX = event.clientX;
        this._pressY = event.clientY;

        this._pressTimer = setTimeout(() => {
          if (this._pressVerse === verse) {
            this.openMenu(verse);
            try {
              navigator.vibrate?.(12);
            } catch {
              /* ignore */
            }
          }
        }, 450);
      },

      onPressMove(event: PointerEvent) {
        if (this._activePointerId !== event.pointerId) return;
        if (!this._pressTimer) return;
        const dx = event.clientX - this._pressX;
        const dy = event.clientY - this._pressY;
        // Cancel before ~10px so scrolling stays smooth
        if (dx * dx + dy * dy > 100) {
          this._activePointerId = null;
          this.clearPress();
        }
      },

      onPressEnd(event: PointerEvent) {
        if (
          this._activePointerId != null &&
          event.pointerId !== this._activePointerId
        ) {
          return;
        }
        this._activePointerId = null;
        this.clearPress();
      },

      openMenu(verse: number, panel: "actions" | "colors" = "actions") {
        this.activeMenu = verse;
        this.menuPanel = panel;
        // Suppress the release/synthetic click that would close via click.outside
        this._ignoreOutsideUntil = Date.now() + 550;
        if (this.showTip) this.dismissTip();
      },

      closeMenu() {
        this.activeMenu = null;
        this.menuPanel = "actions";
      },

      closeMenuOutside() {
        if (Date.now() < this._ignoreOutsideUntil) return;
        this.closeMenu();
      },

      onContextMenu(verse: number, event: MouseEvent) {
        event.preventDefault();
        this.openMenu(verse);
      },

      showColors(verse: number) {
        this.openMenu(verse, "colors");
      },

      setHighlight(verse: number, color: HighlightColorId | null) {
        const current = this.highlightColor(verse);
        const next =
          color === null ? null : current === color ? null : color;
        this.annotations = upsertAnnotation(this.annotations, this.key(verse), {
          highlightColor: next,
        });
        saveAnnotations(this.annotations);
        if (next) {
          this.flashStatus(
            `Highlighted · ${next.charAt(0).toUpperCase()}${next.slice(1)}`,
          );
        } else {
          this.flashStatus("Highlight cleared");
        }
        this.closeMenu();
      },

      setNote(verse: number, note: string) {
        this.annotations = upsertAnnotation(this.annotations, this.key(verse), {
          note,
        });
        saveAnnotations(this.annotations);
      },

      openNotePanel(verse: number) {
        this.closeMenu();
        this.openNote = verse;
      },

      closeNote() {
        this.openNote = null;
      },

      toggleNote(verse: number) {
        this.openNote = this.openNote === verse ? null : verse;
      },

      verseUrl(verse: number) {
        return `${window.location.origin}${window.location.pathname}#v${verse}`;
      },

      async copyVerse(verse: number, text: string) {
        const label = `${this.bookName || titleCaseSlug(this.bookSlug)} ${this.chapter}:${verse}`;
        const line = `"${text}" — ${label}`;
        try {
          await navigator.clipboard.writeText(line);
          this.flashStatus("Copied verse");
        } catch {
          this.flashStatus("Couldn’t copy");
        }
        this.closeMenu();
      },

      async copyVerseLink(verse: number) {
        try {
          await navigator.clipboard.writeText(this.verseUrl(verse));
          this.flashStatus("Copied link");
        } catch {
          this.flashStatus("Couldn’t copy link");
        }
        this.closeMenu();
      },

      canSpeak() {
        return typeof window !== "undefined" && "speechSynthesis" in window;
      },

      stopSpeaking() {
        try {
          this._speakHandle?.cancel();
        } catch {
          /* ignore */
        }
        this._speakHandle = null;
        try {
          window.speechSynthesis?.cancel();
        } catch {
          /* ignore */
        }
        this.speaking = false;
        this.speakingVerse = null;
      },

      speakVerse(verse: number, text: string) {
        if (!this.canSpeak()) {
          this.flashStatus("Listening isn’t supported here");
          this.closeMenu();
          return;
        }
        this.stopSpeaking();
        const bookName = this.bookName || titleCaseSlug(this.bookSlug);
        this.speaking = true;
        this.speakingVerse = verse;
        this.closeMenu();
        this.flashStatus("Listening…");
        this._speakHandle = speakBibleVerse({
          bookName,
          chapter: this.chapter,
          verse,
          text,
          language: VERSIONS[this.version]?.language || "en",
          onDone: () => {
            this.speaking = false;
            this.speakingVerse = null;
            this._speakHandle = null;
          },
        });
      },

      speakChapter(texts: Array<{ number: number; text: string }>) {
        if (!this.canSpeak()) {
          this.flashStatus("Listening isn’t supported here");
          return;
        }
        this.stopSpeaking();
        if (!texts.length) return;
        this.speaking = true;
        this.speakingVerse = null;
        this.flashStatus("Listening to chapter…");
        const bookName = this.bookName || titleCaseSlug(this.bookSlug);
        this._speakHandle = speakBibleChapter({
          bookName,
          chapter: this.chapter,
          verses: texts,
          language: VERSIONS[this.version]?.language || "en",
          onVerse: (n) => {
            this.speakingVerse = n;
          },
          onDone: () => {
            this.speaking = false;
            this.speakingVerse = null;
            this._speakHandle = null;
            this.flashStatus("Finished listening");
          },
        });
      },
    }),
  );

  Alpine.data("savedList", () => ({
    items: [] as Array<{
      key: string;
      version: string;
      reference: string;
      url: string;
      highlighted: boolean;
      highlightColor: HighlightColorId | null;
      note: string;
    }>,

    init() {
      this.refresh();
    },

    refresh() {
      const map = loadAnnotations();
      this.items = Object.entries(map)
        .map(([key, value]) => {
          const parsed = parseVerseKey(key);
          if (!parsed) return null;
          const bookLabel = titleCaseSlug(parsed.slug);
          return {
            key,
            version: versionLabel(parsed.version),
            reference: `${bookLabel} ${parsed.chapter}:${parsed.verse}`,
            url: `/${parsed.version}/chapter/${parsed.slug}/${parsed.chapter}#v${parsed.verse}`,
            highlighted: Boolean(value.highlightColor),
            highlightColor: value.highlightColor,
            note: value.note,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
        .sort((a, b) =>
          `${a.version} ${a.reference}`.localeCompare(`${b.version} ${b.reference}`),
        );
    },

    remove(key: string) {
      const map = loadAnnotations();
      delete map[key];
      saveAnnotations(map);
      this.refresh();
    },
  }));

  Alpine.data("prayerHub", () => ({
    tab: "wall" as "wall" | "journal",
    wallLive: false,
    wallLiveDetail: "" as string,
    wallItems: [] as WallRequest[],
    wallName: "",
    wallBody: "",
    wallStatus: "" as string,
    wallLoading: false,
    wallBusy: false,
    wallReactBusy: false,
    wallError: "" as string,
    deviceId: "",
    items: [] as PrayerEntry[],
    forWhom: "",
    note: "",
    status: "" as string,
    _statusTimer: null as ReturnType<typeof setTimeout> | null,
    _wallStatusTimer: null as ReturnType<typeof setTimeout> | null,
    _wallPoll: null as ReturnType<typeof setInterval> | null,

    setTab(next: "wall" | "journal") {
      this.tab = next;
      try {
        const url = new URL(window.location.href);
        url.hash = next === "journal" ? "journal" : "wall";
        history.replaceState(null, "", url);
      } catch {
        /* ignore */
      }
    },

    async init() {
      const hash = window.location.hash.replace(/^#/, "").toLowerCase();
      if (hash === "journal") this.tab = "journal";
      else if (hash === "wall") this.tab = "wall";
      // Optimistic: env present → show live until probe says otherwise (avoids flicker).
      this.wallLive = isWallLive();
      this.deviceId = getDeviceId();
      this.items = loadPrayers();
      await this.verifyWall();
      await this.refreshWall();
      this.startWallPoll();
    },

    destroy() {
      if (this._wallPoll) {
        clearInterval(this._wallPoll);
        this._wallPoll = null;
      }
      if (this._statusTimer) clearTimeout(this._statusTimer);
      if (this._wallStatusTimer) clearTimeout(this._wallStatusTimer);
    },

    async verifyWall() {
      const check = await checkWallLive();
      this.wallLive = check.live;
      this.wallLiveDetail = check.detail ?? "";
      if (!check.live && isWallLive()) {
        // Configured in env but DB unreachable — do not pretend it is shared.
        this.wallError =
          check.detail ||
          "Prayer wall couldn’t connect. Please try again in a moment.";
      }
    },

    startWallPoll() {
      if (this._wallPoll) clearInterval(this._wallPoll);
      if (!this.wallLive) return;
      this._wallPoll = setInterval(() => {
        if (this.tab === "wall" && !this.wallBusy && document.visibilityState === "visible") {
          void this.refreshWall(true);
        }
      }, 12_000);
    },

    flash(message: string) {
      this.status = message;
      if (this._statusTimer) clearTimeout(this._statusTimer);
      this._statusTimer = setTimeout(() => {
        this.status = "";
      }, 2200);
    },

    flashWall(message: string) {
      this.wallStatus = message;
      if (this._wallStatusTimer) clearTimeout(this._wallStatusTimer);
      this._wallStatusTimer = setTimeout(() => {
        this.wallStatus = "";
      }, 2200);
    },

    formatDate(iso: string) {
      try {
        return new Date(iso).toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        });
      } catch {
        return iso;
      }
    },

    isMine(item: WallRequest) {
      return item.deviceId === this.deviceId;
    },

    hasReaction(item: WallRequest, type: ReactionType) {
      return item.myReactions.includes(type);
    },

    mergeWallUi(next: WallRequest[]) {
      const prev = new Map(this.wallItems.map((item) => [item.id, item]));
      return next.map((item) => {
        const old = prev.get(item.id);
        return {
          ...item,
          commentsOpen: old?.commentsOpen ?? false,
          commentDraft: old?.commentDraft ?? "",
          commentName: old?.commentName ?? "",
        };
      });
    },

    async refreshWall(quiet = false) {
      if (!quiet) this.wallLoading = true;
      if (!quiet) this.wallError = "";
      try {
        this.wallItems = this.mergeWallUi(await listWallRequests());
      } catch (err) {
        this.wallError =
          err instanceof Error ? err.message : "Could not load the prayer wall.";
        if (!quiet) this.wallItems = [];
      } finally {
        if (!quiet) this.wallLoading = false;
      }
    },

    async submitRequest() {
      if (!this.wallBody.trim() || this.wallBusy) return;
      this.wallBusy = true;
      this.wallError = "";
      try {
        if (!this.wallLive) await this.verifyWall();
        this.wallItems = this.mergeWallUi(
          await createWallRequest(this.wallName, this.wallBody),
        );
        this.wallBody = "";
        this.wallBody = "";
        if (isWallLive()) {
          this.wallLive = true;
          this.wallLiveDetail = "";
          this.startWallPoll();
          this.flashWall("Shared with everyone");
        } else {
          this.flashWall("Saved on this device only");
        }
      } catch (err) {
        this.wallError =
          err instanceof Error ? err.message : "Could not share your request.";
      } finally {
        this.wallBusy = false;
      }
    },

    async react(requestId: string, type: ReactionType) {
      if (this.wallReactBusy) return;
      this.wallReactBusy = true;
      try {
        this.wallItems = this.mergeWallUi(await toggleReaction(requestId, type));
      } catch (err) {
        this.wallError =
          err instanceof Error ? err.message : "Could not save reaction.";
      } finally {
        this.wallReactBusy = false;
      }
    },

    async submitComment(item: WallRequest) {
      const draft = (item.commentDraft ?? "").trim();
      if (!draft) return;
      try {
        const openId = item.id;
        this.wallItems = this.mergeWallUi(
          await addWallComment(item.id, item.commentName ?? "", draft),
        );
        const next = this.wallItems.find((r) => r.id === openId);
        if (next) next.commentsOpen = true;
      } catch (err) {
        this.wallError =
          err instanceof Error ? err.message : "Could not post comment.";
      }
    },

    async removeRequest(id: string) {
      try {
        this.wallItems = this.mergeWallUi(await removeOwnRequest(id));
      } catch (err) {
        this.wallError =
          err instanceof Error ? err.message : "Could not remove request.";
      }
    },

    addJournal() {
      if (!this.forWhom.trim()) return;
      this.items = addPrayer(this.forWhom, this.note);
      this.forWhom = "";
      this.note = "";
      this.flash("Saved");
    },

    removeJournal(id: string) {
      this.items = removePrayer(id);
    },

    exportList() {
      if (!this.items.length) {
        this.flash("Nothing to export");
        return;
      }
      const stamp = new Date().toISOString().slice(0, 10);
      const lines = this.items.map((item) => {
        const when = this.formatDate(item.createdAt);
        const note = item.note.trim() ? `\n${item.note.trim()}` : "";
        return `${item.forWhom}\n${when}${note}`;
      });
      const blob = new Blob(
        [`Prayer journal · ${stamp}\n\n${lines.join("\n\n---\n\n")}\n`],
        { type: "text/plain;charset=utf-8" },
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `prayer-journal-${stamp}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      this.flash("Exported");
    },
  }));

  Alpine.data("feedbackForm", () => ({
    live: false,
    name: "",
    message: "",
    busy: false,
    status: "",
    error: "",
    _timer: null as ReturnType<typeof setTimeout> | null,

    boot() {
      this.live = isFeedbackLive();
    },

    destroy() {
      if (this._timer) clearTimeout(this._timer);
    },

    async submit() {
      if (this.busy) return;
      this.busy = true;
      this.error = "";
      this.status = "";
      try {
        const result = await submitFeedback(this.name, this.message, getDeviceId());
        this.message = "";
        this.status = result.remote
          ? "Thank you — feedback sent."
          : "Thank you — saved on this device.";
        if (this._timer) clearTimeout(this._timer);
        this._timer = setTimeout(() => {
          this.status = "";
        }, 2800);
      } catch (err) {
        this.error = err instanceof Error ? err.message : "Could not send feedback.";
      } finally {
        this.busy = false;
      }
    },
  }));

  Alpine.data("bibleSearch", (version: string = DEFAULT_VERSION) => ({
    version,
    q: "",
    results: [] as Array<{
      id: string;
      label: string;
      snippet: string;
      url: string;
    }>,
    ready: false,
    loading: false,
    error: "",
    listening: false,
    voiceSupported: false,
    voiceHint: "",
    _voiceSeq: 0,
    _localSession: null as LocalVoiceSession | null,
    _localBusy: false,
    loadPromise: null as Promise<void> | null,
    worker: null as Worker | null,
    searchSeq: 0,
    pendingSearches: {} as Record<
      number,
      { resolve: (hits: SearchDoc[]) => void; reject: (err: Error) => void }
    >,
    _recognition: null as null | {
      lang: string;
      continuous: boolean;
      interimResults: boolean;
      start: () => void;
      stop: () => void;
      abort: () => void;
      onresult: ((ev: Event) => void) | null;
      onerror: ((ev: Event) => void) | null;
      onend: (() => void) | null;
    },

    init() {
      const path = window.location.pathname.replace(/\/+$/, "") || "/";
      if (path === "/saved") {
        try {
          const saved = localStorage.getItem(VERSION_KEY);
          if (saved && saved in VERSIONS) this.version = saved;
        } catch {
          /* ignore */
        }
      }
      const hasSpeech = hasBrowserSpeech();
      const hasMic = hasMicrophone();
      this.voiceSupported = hasSpeech || hasMic;
      // Prefetch Whisper when browser speech won’t work (preview shells).
      // Installed PWAs on Chrome use fast SpeechRecognition and skip this.
      if (chromeSpeechLikelyBroken() && hasMic) warmLocalVoice();
    },

    getSpeechRecognition() {
      if (typeof window === "undefined") return null;
      const w = window as unknown as {
        SpeechRecognition?: new () => SpeechRecognitionLike;
        webkitSpeechRecognition?: new () => SpeechRecognitionLike;
      };
      return w.SpeechRecognition || w.webkitSpeechRecognition || null;
    },

    destroy() {
      this.stopVoice(true);
      if (this.worker) {
        this.worker.terminate();
        this.worker = null;
      }
    },

    stopVoice(abort = false) {
      const rec = this._recognition;
      this._recognition = null;
      this.listening = false;
      if (this._localSession) {
        this._localSession.cancel();
        this._localSession = null;
      }
      if (!rec) return;
      try {
        rec.onresult = null;
        rec.onerror = null;
        rec.onend = null;
        if (abort) rec.abort();
        else rec.stop();
      } catch {
        /* ignore */
      }
    },

    toggleVoice() {
      if (this._localBusy) return;
      if (this.listening && this._localSession) {
        void this.finishLocalVoice();
        return;
      }
      if (this.listening) {
        this.stopVoice(true);
        this.voiceHint = "Stopped.";
        return;
      }
      void this.startVoice();
    },

    async startVoice() {
      if (typeof window !== "undefined" && !window.isSecureContext) {
        this.voiceHint =
          "Mic needs a secure page (https or localhost). Open the site over https.";
        return;
      }

      // Cursor / VS Code preview can’t use Google speech — use on-device Whisper.
      if (chromeSpeechLikelyBroken() || !this.getSpeechRecognition()) {
        await this.startLocalVoice();
        return;
      }

      this.stopVoice(true);
      this.error = "";
      const seq = ++this._voiceSeq;
      const langCode = VERSIONS[this.version]?.language || "en";
      const example = micExamplePhrase(langCode);
      this.voiceHint = `Listening… say a verse, like “${example}” (${VOICE_ENGINE})`;

      const SR = this.getSpeechRecognition()!;
      const recognition = new SR();
      recognition.lang = speechRecognitionLang(langCode);
      recognition.continuous = false;
      // Interim results → jump as soon as we hear a valid reference (faster).
      recognition.interimResults = true;
      recognition.maxAlternatives = 5;

      let handled = false;
      const collectTranscripts = (ev: Event) => {
        const e = ev as unknown as {
          results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal?: boolean }>;
        };
        const transcripts: string[] = [];
        for (let i = 0; i < e.results.length; i++) {
          const alt = e.results[i];
          for (let j = 0; j < alt.length; j++) {
            const t = alt[j]?.transcript?.trim();
            if (t && !transcripts.includes(t)) transcripts.push(t);
          }
        }
        return transcripts;
      };

      const tryOpenFromSpeech = (transcripts: string[]) => {
        if (handled || !transcripts.length) return false;
        for (const raw of transcripts) {
          const cleaned = normalizeSpokenReference(raw) || raw;
          const refHits = this.referenceResult(cleaned);
          if (refHits?.[0]?.url) {
            handled = true;
            this.q = cleaned;
            this.results = refHits;
            this.voiceHint = `Opening ${refHits[0].label}…`;
            try {
              recognition.stop();
            } catch {
              /* ignore */
            }
            window.location.assign(refHits[0].url);
            return true;
          }
        }
        return false;
      };

      recognition.onresult = (ev: Event) => {
        if (seq !== this._voiceSeq || handled) return;
        const transcripts = collectTranscripts(ev);
        if (tryOpenFromSpeech(transcripts)) return;

        const e = ev as unknown as {
          results: ArrayLike<{ isFinal?: boolean }>;
        };
        const last = e.results[e.results.length - 1];
        if (last?.isFinal) {
          if (!transcripts.length) {
            this.voiceHint = "Didn’t catch that. Tap the mic and speak again.";
            return;
          }
          handled = true;
          void this.applyVoiceTranscript(transcripts);
        } else if (transcripts[0]) {
          this.voiceHint = `Hearing: “${transcripts[0]}”…`;
        }
      };

      recognition.onerror = (ev: Event) => {
        if (seq !== this._voiceSeq) return;
        if (this._recognition !== recognition) return;
        const code = (ev as unknown as { error?: string }).error || "";
        this._recognition = null;
        this.listening = false;
        if (code === "aborted" || handled) return;
        if (code === "no-speech") {
          this.voiceHint = "No speech heard. Tap the mic and speak clearly.";
          return;
        }
        if (code === "not-allowed" || code === "service-not-allowed") {
          this.voiceHint = "Allow microphone access for this site, then tap the mic again.";
          return;
        }
        // Preview / Chromium shells often report “network” — fall back to local Whisper.
        if (code === "network") {
          void this.startLocalVoice();
          return;
        }
        this.voiceHint = `Mic error (${code || "unknown"}). You can still type the verse.`;
      };

      recognition.onend = () => {
        if (seq !== this._voiceSeq) return;
        if (this._recognition !== recognition) return;
        this._recognition = null;
        this.listening = false;
      };

      this._recognition = recognition;
      this.listening = true;

      window.setTimeout(() => {
        if (seq !== this._voiceSeq || this._recognition !== recognition) return;
        try {
          recognition.start();
        } catch {
          this.listening = false;
          this._recognition = null;
          void this.startLocalVoice();
        }
      }, 40);
    },

    async startLocalVoice() {
      if (this._localBusy) return;
      this.stopVoice(true);
      this.error = "";
      const seq = ++this._voiceSeq;
      this.voiceHint = `Starting voice ${VOICE_ENGINE}… first time may download a small model`;
      warmLocalVoice();

      try {
        let session!: LocalVoiceSession;
        session = await startLocalRecording(
          () => {
            if (seq !== this._voiceSeq) return;
            this.listening = true;
            const example = micExamplePhrase(VERSIONS[this.version]?.language || "en");
            this.voiceHint = `Listening… say the verse (e.g. “${example}”).`;
          },
          4500,
          () => {
            if (seq !== this._voiceSeq) return;
            if (this._localSession === session) void this.finishLocalVoice();
          },
          VERSIONS[this.version]?.language || "en",
        );
        if (seq !== this._voiceSeq) {
          session.cancel();
          return;
        }
        this._localSession = session;
        this.listening = true;
      } catch (err) {
        this.listening = false;
        this._localSession = null;
        const msg = err instanceof Error ? err.message : "";
        if (/Permission|NotAllowed|denied/i.test(msg)) {
          this.voiceHint = "Allow microphone access, then tap the mic again.";
        } else if (/session|MatMul|scale|onnx|multilingual|English-only/i.test(msg)) {
          this.voiceHint =
            "Voice engine failed to load. Open this page in Chrome for instant mic search.";
        } else {
          this.voiceHint = msg || "Could not start the mic. Try again in Chrome.";
        }
      }
    },

    async finishLocalVoice() {
      const session = this._localSession;
      if (!session || this._localBusy) return;
      this._localBusy = true;
      this._localSession = null;
      this.listening = false;
      this.voiceHint = "Opening verse…";
      try {
        const text = await session.stop();
        if (!text) {
          this.voiceHint = "Didn’t catch that. Tap the mic and speak again.";
          return;
        }
        await this.applyVoiceTranscript([text]);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        if (/session|MatMul|scale|onnx|multilingual|English-only/i.test(msg)) {
          this.voiceHint =
            "Voice engine failed. Open the app in Chrome (or reinstall the PWA) for mic search.";
        } else {
          this.voiceHint = msg || "Could not understand. Try again.";
        }
      } finally {
        this._localBusy = false;
      }
    },

    async applyVoiceTranscript(transcripts: string[]) {
      const tried = transcripts.map((t) => t.trim()).filter(Boolean);
      this.voiceHint = `Heard: “${tried[0]}” — opening…`;

      for (const raw of tried) {
        const cleaned = normalizeSpokenReference(raw) || raw;
        this.q = cleaned;
        const refHits = this.referenceResult(cleaned);
        if (refHits?.[0]?.url) {
          this.results = refHits;
          this.voiceHint = `Opening ${refHits[0].label}…`;
          window.location.assign(refHits[0].url);
          return;
        }
      }

      this.q = normalizeSpokenReference(tried[0]) || tried[0];
      await this.search();
      const first = this.results[0];
      if (first?.url) {
        this.voiceHint = `Opening ${first.label}…`;
        window.location.assign(first.url);
        return;
      }

      this.voiceHint = `Heard “${tried[0]}” — no verse found. Try “${micExamplePhrase(VERSIONS[this.version]?.language || "en")}”.`;
    },

    referenceResult(query: string) {
      const ref = parseReference(query);
      if (!ref) return null;

      const bookName = titleCaseSlug(ref.slug);
      const hash = ref.verse ? `#v${ref.verse}` : "";
      const url = `/${this.version}/chapter/${ref.slug}/${ref.chapter}${hash}`;

      if (ref.verse) {
        return [
          {
            id: `ref-${ref.slug}-${ref.chapter}-${ref.verse}`,
            label: `${bookName} ${ref.chapter}:${ref.verse}`,
            snippet: "Go to this verse",
            url,
          },
        ];
      }

      return [
        {
          id: `ref-${ref.slug}-${ref.chapter}`,
          label: `${bookName} ${ref.chapter}`,
          snippet: "Open this chapter",
          url,
        },
      ];
    },

    ensureLoaded() {
      if (this.ready || this.loadPromise) return this.loadPromise;
      this.loading = true;
      this.error = "";
      this.loadPromise = (async () => {
        try {
          const worker = new Worker(
            new URL("./lib/searchWorker.ts", import.meta.url),
            { type: "module" },
          );
          this.worker = worker;

          worker.addEventListener("message", (event: MessageEvent<SearchWorkerOut>) => {
            const msg = event.data;
            if (msg.type === "results") {
              const pending = this.pendingSearches[msg.id];
              if (pending) {
                delete this.pendingSearches[msg.id];
                pending.resolve(msg.hits);
              }
            } else if (msg.type === "error") {
              this.error = msg.message;
              for (const pending of Object.values(this.pendingSearches)) {
                pending.reject(new Error(msg.message));
              }
              this.pendingSearches = {};
            }
          });

          await new Promise<void>((resolve, reject) => {
            const onReady = (event: MessageEvent<SearchWorkerOut>) => {
              if (event.data.type === "ready") {
                worker.removeEventListener("message", onReady);
                resolve();
              } else if (event.data.type === "error") {
                worker.removeEventListener("message", onReady);
                reject(new Error(event.data.message));
              }
            };
            worker.addEventListener("message", onReady);
            worker.addEventListener(
              "error",
              () => reject(new Error("Search worker failed to start")),
              { once: true },
            );
            worker.postMessage({ type: "init", version: this.version });
          });

          this.ready = true;
        } catch (e) {
          this.error = e instanceof Error ? e.message : "Search failed to load";
          this.loadPromise = null;
          this.worker?.terminate();
          this.worker = null;
        } finally {
          this.loading = false;
        }
      })();
      return this.loadPromise;
    },

    queryWorker(query: string) {
      return new Promise<SearchDoc[]>((resolve, reject) => {
        if (!this.worker) {
          reject(new Error("Search is not ready"));
          return;
        }
        const id = ++this.searchSeq;
        this.pendingSearches[id] = { resolve, reject };
        this.worker.postMessage({ type: "search", id, query });
      });
    },

    onFocus() {
      // Warm full-text search in the background; reference jumps stay instant
      if (!this.ready && !this.loadPromise) {
        const warm = () => {
          void this.ensureLoaded();
        };
        if ("requestIdleCallback" in window) {
          (
            window as Window & {
              requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => void;
            }
          ).requestIdleCallback(warm, { timeout: 2000 });
        } else {
          window.setTimeout(warm, 400);
        }
      }
      if (this.q.trim().length >= 2) void this.search();
    },

    async goFirst() {
      await this.search();
      const first = this.results[0];
      if (first?.url) window.location.href = first.url;
    },

    async search() {
      const query = this.q.trim();
      if (query.length < 2) {
        this.results = [];
        return;
      }

      const refHits = this.referenceResult(query);
      if (refHits) {
        this.results = refHits;
        return;
      }

      await this.ensureLoaded();
      if (!this.worker) {
        this.results = [];
        return;
      }

      try {
        const hits = await this.queryWorker(query);
        if (this.q.trim() !== query) return;
        this.results = hits.map((doc) => ({
          id: doc.id,
          label: `${doc.book} ${doc.chapter}:${doc.verse}`,
          snippet: doc.text.slice(0, 120) + (doc.text.length > 120 ? "…" : ""),
          url: `/${this.version}/chapter/${doc.slug}/${doc.chapter}#v${doc.verse}`,
        }));
      } catch {
        if (this.q.trim() === query) this.results = [];
      }
    },
  }));

  Alpine.data("supportPage", () => ({
    copied: "" as "" | "gcash" | "gotyme",
    _copyTimer: null as ReturnType<typeof setTimeout> | null,

    init() {
      /* ready for copy actions */
    },

    async copyNumber(value: string, which: "gcash" | "gotyme") {
      const text = value.trim();
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        try {
          const el = document.createElement("textarea");
          el.value = text;
          el.setAttribute("readonly", "");
          el.style.position = "fixed";
          el.style.left = "-9999px";
          document.body.appendChild(el);
          el.select();
          document.execCommand("copy");
          document.body.removeChild(el);
        } catch {
          return;
        }
      }
      this.copied = which;
      if (this._copyTimer) clearTimeout(this._copyTimer);
      this._copyTimer = setTimeout(() => {
        this.copied = "";
      }, 2000);
    },
  }));
};
