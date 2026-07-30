import type { Alpine } from "alpinejs";
import lunr from "lunr";
import {
  getAnnotation,
  loadAnnotations,
  parseVerseKey,
  saveAnnotations,
  upsertAnnotation,
  verseKey,
  type AnnotationMap,
} from "./lib/annotations";
import { DEFAULT_VERSION, VERSIONS, type VersionId } from "./lib/versions";
import { shareOrDownloadCard } from "./lib/shareCard";
import { loadLastRead, loadStreak, saveLastRead } from "./lib/reading";
import { parseReference } from "./lib/parseReference";
import {
  completeDevotion,
  journeyProgress,
  loadJourney,
  recordAppOpen,
  TROPHIES,
} from "./lib/journey";

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

    switchTo(next: string) {
      localStorage.setItem(VERSION_KEY, next);
      const path = window.location.pathname.replace(/\/+$/, "") || "/";
      const parts = path.split("/").filter(Boolean);

      if (parts.length === 0) {
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
        /* ignore */
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
      const last = loadLastRead();
      if (last) {
        this.continueUrl = `/${last.version}/chapter/${last.slug}/${last.chapter}`;
        this.continueLabel = `${last.book} ${last.chapter}`;
        this.welcome = "Welcome back. Your journey of faith continues today.";
      }
      const map = loadAnnotations();
      this.savedCount = Object.keys(map).length;
      this.streak = journey.streak || loadStreak().count;
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

    refresh() {
      const state = recordAppOpen();
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
        state.streak <= 0
          ? "Open today to begin."
          : state.lastDay
            ? "Keep coming back each day."
            : "Keep coming back each day.";
      this.nextLevelNote = prog.next
        ? `${prog.remaining} more day${prog.remaining === 1 ? "" : "s"} to reach ${prog.next.name}.`
        : "You have reached the highest level. Stay faithful.";
    },
  }));

  Alpine.data("devotionTheme", (theme: string, entryIds: string[] = []) => ({
    theme,
    entryIds,
    completed: [] as string[],
    doneCount: 0,

    init() {
      recordAppOpen();
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
      shareStatus: "" as string,
      annotations: {} as AnnotationMap,
      openNote: null as number | null,
      flashVerse: null as number | null,
      showTip: false,
      fontScale: 1,
      progress: 0,
      _onScroll: null as null | (() => void),

      init() {
        this.annotations = loadAnnotations();
        try {
          this.showTip = localStorage.getItem("bible-tip-seen") !== "1";
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
        this._onScroll = () => {
          const doc = document.documentElement;
          const max = doc.scrollHeight - window.innerHeight;
          this.progress =
            max > 0 ? Math.min(100, Math.round((window.scrollY / max) * 100)) : 0;
        };
        window.addEventListener("scroll", this._onScroll, { passive: true });
        this._onScroll();
        this.$nextTick(() => this.scrollToHash());
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
          localStorage.setItem("bible-tip-seen", "1");
        } catch {
          /* ignore */
        }
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
        return getAnnotation(this.annotations, this.key(verse)).highlighted;
      },

      noteText(verse: number) {
        return getAnnotation(this.annotations, this.key(verse)).note;
      },

      toggleHighlight(verse: number) {
        this.annotations = upsertAnnotation(this.annotations, this.key(verse), {
          highlighted: !this.isHighlighted(verse),
        });
        saveAnnotations(this.annotations);
        if (this.showTip) this.dismissTip();
      },

      setNote(verse: number, note: string) {
        this.annotations = upsertAnnotation(this.annotations, this.key(verse), {
          note,
        });
        saveAnnotations(this.annotations);
      },

      toggleNote(verse: number) {
        this.openNote = this.openNote === verse ? null : verse;
      },

      async copyVerse(verse: number, text: string) {
        const label = `${this.bookName || titleCaseSlug(this.bookSlug)} ${this.chapter}:${verse}`;
        const line = `"${text}" — ${label}`;
        try {
          await navigator.clipboard.writeText(line);
        } catch {
          /* ignore */
        }
      },

      async shareVerse(verse: number, text: string) {
        const label = `${this.bookName || titleCaseSlug(this.bookSlug)} ${this.chapter}:${verse}`;
        const line = `"${text}" — ${label}`;
        const pageUrl = `${window.location.origin}${window.location.pathname}#v${verse}`;
        this.shareStatus = "Preparing…";
        try {
          const result = await shareOrDownloadCard(
            {
              text,
              cite: label,
              versionLabel: this.versionLabel || undefined,
            },
            `${line}\n${pageUrl}`,
          );
          if (result === "shared") {
            this.shareStatus = "Opened share — pick Facebook, Messenger, etc.";
          } else if (result === "downloaded") {
            this.shareStatus = "Card downloaded — attach it in Facebook / Messenger";
            // Also open Facebook composer with the verse link (desktop fallback)
            window.open(
              `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`,
              "_blank",
              "noopener,noreferrer",
            );
          } else {
            this.shareStatus = "";
          }
        } catch {
          try {
            if (navigator.share) {
              await navigator.share({ title: label, text: line, url: pageUrl });
              this.shareStatus = "Opened share — pick Facebook, Messenger, etc.";
            } else {
              await this.copyVerse(verse, text);
              window.open(
                `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`,
                "_blank",
                "noopener,noreferrer",
              );
              this.shareStatus = "Copied verse + opened Facebook";
            }
          } catch {
            await this.copyVerse(verse, text);
            this.shareStatus = "Copied verse text";
          }
        }
        window.setTimeout(() => {
          this.shareStatus = "";
        }, 4000);
      },
    }),
  );

  Alpine.data("savedList", () => ({
    items: [] as Array<{
      key: string;
      label: string;
      url: string;
      highlighted: boolean;
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
            highlighted: value.highlighted,
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
