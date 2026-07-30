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

      // /{version}/book/... or /{version}/chapter/...
      if (parts[0] && parts[0] in VERSIONS) {
        parts[0] = next;
        window.location.href = "/" + parts.join("/");
        return;
      }

      window.location.href = `/${next}/`;
    },
  }));

  Alpine.data(
    "chapterReader",
    (version: string, bookSlug: string, chapter: number) => ({
      version,
      bookSlug,
      chapter,
      verses: [] as Array<{ number: number; text: string }>,
      loading: true,
      error: "",
      annotations: {} as AnnotationMap,
      openNote: null as number | null,

      async init() {
        this.annotations = loadAnnotations();
        try {
          const res = await fetch(`/bibles/${this.version}/${this.bookSlug}.json`);
          if (!res.ok) throw new Error("Could not load chapter");
          const book = (await res.json()) as {
            chapters: Array<{ number: number; verses: Array<{ number: number; text: string }> }>;
          };
          const found = book.chapters.find((c) => c.number === this.chapter);
          this.verses = found?.verses ?? [];
          if (!this.verses.length) this.error = "Chapter not found in this version.";
        } catch (e) {
          this.error = e instanceof Error ? e.message : "Failed to load chapter";
        } finally {
          this.loading = false;
        }
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
          const bookLabel = parsed.slug.replace(/-/g, " ");
          const label = `${versionLabel(parsed.version)} · ${bookLabel} ${parsed.chapter}:${parsed.verse}`;
          return {
            key,
            label,
            url: `/${parsed.version}/chapter/${parsed.slug}/${parsed.chapter}`,
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

    async init() {
      this.loading = true;
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
    },

    search() {
      const query = this.q.trim();
      if (!this.index || query.length < 2) {
        this.results = [];
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
            url: `/${this.version}/chapter/${doc.slug}/${doc.chapter}`,
          };
        });
      } catch {
        this.results = [];
      }
    },
  }));
};
