import type { Alpine } from "alpinejs";
import lunr from "lunr";

type SearchDoc = {
  id: string;
  book: string;
  slug: string;
  chapter: number;
  verse: number;
  text: string;
};

export default (Alpine: Alpine) => {
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
