import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  DEFAULT_VERSION,
  VERSIONS,
  type VersionId,
  isVersionId,
} from "./versions";

export type Verse = { number: number; text: string };
export type Chapter = { number: number; verses: Verse[] };
export type Book = { name: string; slug: string; chapters: Chapter[] };

/** Lightweight catalog entry (no verse text) — used for lists & static paths. */
export type BookCatalogEntry = {
  name: string;
  slug: string;
  chapters: number[];
};

type RawVerse = {
  book: string;
  chapter: number;
  verse: number;
  text: string;
};

const root = process.cwd();
const dataDir = join(root, "src", "data");
const biblesDir = join(root, "public", "bibles");

const catalogCache = new Map<string, BookCatalogEntry[]>();
const bookCache = new Map<string, Book>();
const legacyCache = new Map<string, Book[]>();

function toSlug(name: string) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function dataFileFor(version: VersionId) {
  const meta = VERSIONS[version];
  const stem = meta?.file ?? version;
  return join(dataDir, `${stem}.json`);
}

function normalize(data: RawVerse[]): Book[] {
  const books: Book[] = [];
  const byName = new Map<string, Book>();

  for (const row of data) {
    let book = byName.get(row.book);
    if (!book) {
      book = { name: row.book, slug: toSlug(row.book), chapters: [] };
      byName.set(row.book, book);
      books.push(book);
    }

    let chapter = book.chapters.find((c) => c.number === row.chapter);
    if (!chapter) {
      chapter = { number: row.chapter, verses: [] };
      book.chapters.push(chapter);
    }

    chapter.verses.push({ number: row.verse, text: row.text });
  }

  return books;
}

function loadLegacyBooks(version: VersionId): Book[] {
  const cached = legacyCache.get(version);
  if (cached) return cached;
  const raw = JSON.parse(readFileSync(dataFileFor(version), "utf8")) as RawVerse[];
  const books = normalize(raw);
  legacyCache.set(version, books);
  return books;
}

/** Fast catalog from public/_manifest.json (falls back to full data file). */
export function getBookCatalog(version: VersionId = DEFAULT_VERSION): BookCatalogEntry[] {
  const cached = catalogCache.get(version);
  if (cached) return cached;

  const manifestPath = join(biblesDir, version, "_manifest.json");
  if (existsSync(manifestPath)) {
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as BookCatalogEntry[];
    catalogCache.set(version, manifest);
    return manifest;
  }

  const fromLegacy = loadLegacyBooks(version).map((b) => ({
    name: b.name,
    slug: b.slug,
    chapters: b.chapters.map((c) => c.number),
  }));
  catalogCache.set(version, fromLegacy);
  return fromLegacy;
}

function bookCacheKey(version: string, slug: string) {
  return `${version}:${slug}`;
}

/** Load a single book (small JSON). Prefer public/bibles split files. */
export function getBook(version: VersionId, slug: string): Book | undefined {
  const key = bookCacheKey(version, slug);
  const cached = bookCache.get(key);
  if (cached) return cached;

  const splitPath = join(biblesDir, version, `${slug}.json`);
  if (existsSync(splitPath)) {
    const book = JSON.parse(readFileSync(splitPath, "utf8")) as Book;
    bookCache.set(key, book);
    return book;
  }

  const book = loadLegacyBooks(version).find((b) => b.slug === slug);
  if (book) bookCache.set(key, book);
  return book;
}

/** Full books with verses — prefer only when you truly need every book. */
export function getBooks(version: VersionId = DEFAULT_VERSION): Book[] {
  const catalog = getBookCatalog(version);
  return catalog.map((entry) => {
    const book = getBook(version, entry.slug);
    return (
      book ?? {
        name: entry.name,
        slug: entry.slug,
        chapters: entry.chapters.map((n) => ({ number: n, verses: [] })),
      }
    );
  });
}

export function resolveVersionId(value: string | undefined): VersionId {
  if (value && isVersionId(value)) return value;
  return DEFAULT_VERSION;
}

export function getChapter(version: VersionId, slug: string, chapter: number) {
  const book = getBook(version, slug);
  return book?.chapters.find((c) => c.number === chapter);
}

export function clearBibleCache(version?: VersionId) {
  if (version) {
    catalogCache.delete(version);
    legacyCache.delete(version);
    for (const key of bookCache.keys()) {
      if (key.startsWith(`${version}:`)) bookCache.delete(key);
    }
  } else {
    catalogCache.clear();
    bookCache.clear();
    legacyCache.clear();
  }
}
