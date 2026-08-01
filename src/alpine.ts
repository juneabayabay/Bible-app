import type { Alpine } from "alpinejs";
import lunr from "lunr";
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
import { parseReference } from "./lib/parseReference";
import {
  completeDevotion,
  journeyProgress,
  loadJourney,
  recordAppOpen,
  TROPHIES,
} from "./lib/journey";
import {
  getTodayStatus,
  getWeekStats,
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
import { addPrayer, loadPrayers, removePrayer, type PrayerEntry } from "./lib/prayers";
import { getDeviceId } from "./lib/deviceId";
import {
  addWallComment,
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

type SearchDoc = {
  id: string;
  book: string;
  slug: string;
  chapter: number;
  verse: number;
  text: string;
  version?: string;
};

const THEME_KEY = "bible-theme";
const VERSION_KEY = "bible-version";

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

  window.addEventListener("storage", (e) => {
    if (e.key !== THEME_KEY) return;
    const dark = resolveDark();
    document.documentElement.classList.toggle("dark", dark);
    (Alpine.store("theme") as { dark: boolean }).dark = dark;
  });

  Alpine.data("versionPicker", (initial: string) => ({
    current: initial,
    open: false,

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

    switchTo(next: string) {
      this.open = false;
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
  }));

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
      this.refresh();
    },

    saveReflectionText() {
      if (!this.reflection.trim()) return;
      saveReflection(this.reflection);
      markChallengeDone(this.challengeId);
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
      this.done = true;
    },
  }));

  Alpine.data("journeyPanel", () => ({
    streak: 0,
    totalDays: 0,
    levelName: "Seed",
    levelBlurb: "",
    progress: 0,
    remaining: 0,
    nextLevelNote: "",
    streakNote: "Open today to begin.",
    trophyCount: 0,
    trophyTotal: TROPHIES.length,
    trophies: [] as string[],
    devotionDone: 0,
    weekOpened: 0,
    weekRead: 0,
    weekGrow: 0,
    weekChallenges: 0,
    weekComplete: 0,
    chaptersRead: 0,

    refresh() {
      const state = recordAppOpen();
      markOpened();
      const prog = journeyProgress(state.streak);
      this.streak = state.streak;
      this.totalDays = state.totalDays;
      this.levelName = prog.current.name;
      this.levelBlurb = prog.current.blurb;
      this.progress = prog.ratio;
      this.remaining = prog.remaining;
      this.trophies = state.trophies;
      this.trophyCount = state.trophies.length;
      this.devotionDone = state.completedDevotions.length;
      this.streakNote =
        state.streak <= 0 ? "Open today to begin." : "Keep coming back each day.";
      this.nextLevelNote = prog.next
        ? `${prog.remaining} more day${prog.remaining === 1 ? "" : "s"} to reach ${prog.next.name}.`
        : "You have reached the highest level. Stay faithful.";

      const week = getWeekStats();
      this.weekOpened = week.opened;
      this.weekRead = week.read;
      this.weekGrow = week.grow;
      this.weekChallenges = week.challenges;
      this.weekComplete = week.completeDays;
      this.chaptersRead = loadProgress().chaptersRead.length;
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

      init() {
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
        const label = `${this.bookName || titleCaseSlug(this.bookSlug)} ${this.chapter}:${verse}`;
        const utter = new SpeechSynthesisUtterance(`${label}. ${text}`);
        utter.rate = 0.92;
        utter.onend = () => {
          this.speaking = false;
          this.speakingVerse = null;
        };
        utter.onerror = () => {
          this.speaking = false;
          this.speakingVerse = null;
        };
        this.speaking = true;
        this.speakingVerse = verse;
        this.closeMenu();
        this.flashStatus("Listening…");
        window.speechSynthesis.speak(utter);
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

        const book = this.bookName || titleCaseSlug(this.bookSlug);
        let i = 0;
        const speakNext = () => {
          if (i >= texts.length) {
            this.speaking = false;
            this.speakingVerse = null;
            this.flashStatus("Finished listening");
            return;
          }
          const v = texts[i++];
          this.speakingVerse = v.number;
          const utter = new SpeechSynthesisUtterance(
            `${book} ${this.chapter}:${v.number}. ${v.text}`,
          );
          utter.rate = 0.92;
          utter.onend = speakNext;
          utter.onerror = () => {
            this.speaking = false;
            this.speakingVerse = null;
          };
          window.speechSynthesis.speak(utter);
        };
        speakNext();
      },
    }),
  );

  Alpine.data("savedList", () => ({
    items: [] as Array<{
      key: string;
      label: string;
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
          const label = `${versionLabel(parsed.version)} · ${bookLabel} ${parsed.chapter}:${parsed.verse}`;
          return {
            key,
            label,
            url: `/${parsed.version}/chapter/${parsed.slug}/${parsed.chapter}#v${parsed.verse}`,
            highlighted: Boolean(value.highlightColor),
            highlightColor: value.highlightColor,
            note: value.note,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
        .sort((a, b) => a.label.localeCompare(b.label));
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
    wallItems: [] as WallRequest[],
    wallName: "",
    wallBody: "",
    wallStatus: "" as string,
    wallLoading: false,
    wallBusy: false,
    wallError: "" as string,
    deviceId: "",
    items: [] as PrayerEntry[],
    forWhom: "",
    note: "",
    status: "" as string,
    _statusTimer: null as ReturnType<typeof setTimeout> | null,
    _wallStatusTimer: null as ReturnType<typeof setTimeout> | null,

    async init() {
      this.wallLive = isWallLive();
      this.deviceId = getDeviceId();
      this.items = loadPrayers();
      await this.refreshWall();
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

    async refreshWall() {
      this.wallLoading = true;
      this.wallError = "";
      try {
        this.wallItems = await listWallRequests();
      } catch (err) {
        this.wallError =
          err instanceof Error ? err.message : "Could not load the prayer wall.";
        this.wallItems = [];
      } finally {
        this.wallLoading = false;
      }
    },

    async submitRequest() {
      if (!this.wallBody.trim() || this.wallBusy) return;
      this.wallBusy = true;
      this.wallError = "";
      try {
        this.wallItems = await createWallRequest(this.wallName, this.wallBody);
        this.wallBody = "";
        this.flashWall("Shared");
      } catch (err) {
        this.wallError =
          err instanceof Error ? err.message : "Could not share your request.";
      } finally {
        this.wallBusy = false;
      }
    },

    async react(requestId: string, type: ReactionType) {
      try {
        this.wallItems = await toggleReaction(requestId, type);
      } catch (err) {
        this.wallError =
          err instanceof Error ? err.message : "Could not save reaction.";
      }
    },

    async submitComment(item: WallRequest) {
      const draft = (item.commentDraft ?? "").trim();
      if (!draft) return;
      try {
        const openId = item.id;
        this.wallItems = await addWallComment(
          item.id,
          item.commentName ?? "",
          draft,
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
        this.wallItems = await removeOwnRequest(id);
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
    index: null as lunr.Index | null,
    docsById: {} as Record<string, SearchDoc>,
    loadPromise: null as Promise<void> | null,

    init() {
      // /saved is version-agnostic — use the reader's preferred edition
      const path = window.location.pathname.replace(/\/+$/, "") || "/";
      if (path === "/saved") {
        try {
          const saved = localStorage.getItem(VERSION_KEY);
          if (saved && saved in VERSIONS) this.version = saved;
        } catch {
          /* ignore */
        }
      }
    },

    ensureLoaded() {
      if (this.ready || this.loadPromise) return this.loadPromise;
      this.loading = true;
      this.loadPromise = (async () => {
        try {
          const res = await fetch(`/search/${this.version}.json`);
          if (!res.ok) throw new Error("Could not load search data");
          const docs = (await res.json()) as SearchDoc[];
          this.docsById = Object.fromEntries(docs.map((d) => [d.id, d]));
          this.index = lunr(function () {
            this.ref("id");
            this.field("book");
            this.field("text");
            for (const doc of docs) {
              this.add(doc);
            }
          });
          this.ready = true;
        } catch (e) {
          this.error = e instanceof Error ? e.message : "Search failed to load";
        } finally {
          this.loading = false;
        }
      })();
      return this.loadPromise;
    },

    async onFocus() {
      await this.ensureLoaded();
      if (this.q.trim().length >= 2) this.search();
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

      await this.ensureLoaded();
      if (!this.index) {
        this.results = [];
        return;
      }

      const ref = parseReference(query);
      if (ref) {
        const bookName =
          Object.values(this.docsById).find((d) => d.slug === ref.slug)?.book ??
          titleCaseSlug(ref.slug);
        const hash = ref.verse ? `#v${ref.verse}` : "";
        const url = `/${this.version}/chapter/${ref.slug}/${ref.chapter}${hash}`;

        if (ref.verse) {
          const doc = Object.values(this.docsById).find(
            (d) =>
              d.slug === ref.slug &&
              d.chapter === ref.chapter &&
              d.verse === ref.verse,
          );
          this.results = [
            {
              id: `ref-${ref.slug}-${ref.chapter}-${ref.verse}`,
              label: `${bookName} ${ref.chapter}:${ref.verse}`,
              snippet: doc?.text?.slice(0, 120)
                ? doc.text.slice(0, 120) + (doc.text.length > 120 ? "…" : "")
                : "Go to this verse",
              url,
            },
          ];
          return;
        }

        this.results = [
          {
            id: `ref-${ref.slug}-${ref.chapter}`,
            label: `${bookName} ${ref.chapter}`,
            snippet: "Open this chapter",
            url,
          },
        ];
        return;
      }

      try {
        const hits = this.index.search(query).slice(0, 20);
        this.results = hits.map((hit) => {
          const doc = this.docsById[hit.ref];
          return {
            id: doc.id,
            label: `${doc.book} ${doc.chapter}:${doc.verse}`,
            snippet: doc.text.slice(0, 120) + (doc.text.length > 120 ? "…" : ""),
            url: `/${this.version}/chapter/${doc.slug}/${doc.chapter}#v${doc.verse}`,
          };
        });
      } catch {
        this.results = [];
      }
    },
  }));
};
