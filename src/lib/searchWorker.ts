import lunr from "lunr";

/** [book, slug, chapter, verse, text] */
export type CompactDoc = [string, string, number, number, string];

type InMsg =
  | { type: "init"; version: string }
  | { type: "search"; id: number; query: string };

type OutMsg =
  | { type: "ready" }
  | { type: "error"; message: string }
  | {
      type: "results";
      id: number;
      hits: Array<{
        id: string;
        book: string;
        slug: string;
        chapter: number;
        verse: number;
        text: string;
      }>;
    };

declare const self: DedicatedWorkerGlobalScope;

let index: lunr.Index | null = null;
const docsById: Record<
  string,
  { id: string; book: string; slug: string; chapter: number; verse: number; text: string }
> = {};

function loadDocs(docs: CompactDoc[]) {
  for (const key of Object.keys(docsById)) delete docsById[key];
  for (const [book, slug, chapter, verse, text] of docs) {
    const id = `${slug}-${chapter}-${verse}`;
    docsById[id] = { id, book, slug, chapter, verse, text };
  }
}

function parsePayload(payload: unknown): CompactDoc[] {
  if (Array.isArray(payload)) {
    return (payload as Array<Record<string, unknown>>).map((d) => [
      String(d.book),
      String(d.slug),
      Number(d.chapter),
      Number(d.verse),
      String(d.text),
    ]);
  }
  if (payload && typeof payload === "object" && "docs" in payload) {
    const docs = (payload as { docs: unknown }).docs;
    if (!Array.isArray(docs) || !docs.length) return [];
    if (Array.isArray(docs[0])) return docs as CompactDoc[];
    return (docs as Array<Record<string, unknown>>).map((d) => [
      String(d.book),
      String(d.slug),
      Number(d.chapter),
      Number(d.verse),
      String(d.text),
    ]);
  }
  return [];
}

self.onmessage = async (event: MessageEvent<InMsg>) => {
  const msg = event.data;
  try {
    if (msg.type === "init") {
      const res = await fetch(`/search/${msg.version}.json`);
      if (!res.ok) throw new Error("Could not load search data");
      const compact = parsePayload(await res.json());
      loadDocs(compact);
      index = lunr(function () {
        this.ref("id");
        this.field("text");
        for (const doc of Object.values(docsById)) {
          this.add({ id: doc.id, text: doc.text });
        }
      });
      self.postMessage({ type: "ready" } satisfies OutMsg);
      return;
    }

    if (msg.type === "search") {
      if (!index) {
        self.postMessage({
          type: "results",
          id: msg.id,
          hits: [],
        } satisfies OutMsg);
        return;
      }
      const hits = index.search(msg.query).slice(0, 20).flatMap((hit) => {
        const doc = docsById[hit.ref];
        return doc ? [doc] : [];
      });
      self.postMessage({
        type: "results",
        id: msg.id,
        hits,
      } satisfies OutMsg);
    }
  } catch (err) {
    self.postMessage({
      type: "error",
      message: err instanceof Error ? err.message : "Search worker failed",
    } satisfies OutMsg);
  }
};
