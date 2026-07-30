import type { Alpine } from "alpinejs";
import lunr from "lunr";
import {
  getAnnotation,
  loadAnnotations,
  saveAnnotations,
  upsertAnnotation,
  verseKey,
  type AnnotationMap,
} from "./lib/annotations";

type SearchDoc = {
  id: string;
  book: string;
  slug: string;
  chapter: number;
  verse: number;
  text: string;
};

function parseVerseKey(key: string) {
  const match = key.match(/^(.*)-(\d+)-(\d+)$/);
  if (!match) return null;
  return {
    slug: match[1],
    chapter: Number(match[2]),
    verse: Number(match[3]),
  };
}

const THEME_KEY = "bible-theme";

function resolveDark(): boolean {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "dark") return true;
  if (saved === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
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

  // Keep store in sync if another tab changes preference
  window.addEventListener("storage", (e) => {
    if (e.key !== THEME_KEY) return;
    const dark = resolveDark();
    document.documentElement.classList.toggle("dark", dark);
    (Alpine.store("theme") as { dark: boolean }).dark = dark;
  });

  Alpine.data("chapterReader", (bookSlug: string, chapter: number) => ({
    bookSlug,
    chapter,
    annotations: {} as AnnotationMap,
    openNote: null as number | null,

    init() {
      this.annotations = loadAnnotations();
    },

    key(verse: number) {
      return verseKey(this.bookSlug, this.chapter, verse);
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
  }));

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
          const label = `${parsed.slug.replace(/-/g, " ")} ${parsed.chapter}:${parsed.verse}`;
          return {
            key,
            label,
            url: `/chapter/${parsed.slug}/${parsed.chapter}`,
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

  Alpine.data("bibleSearch", () => ({
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
        const res = await fetch("/search-docs.json");
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
            url: `/chapter/${doc.slug}/${doc.chapter}`,
          };
        });
      } catch {
        this.results = [];
      }
    },
  }));
};
