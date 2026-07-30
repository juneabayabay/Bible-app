import { readFileSync } from "node:fs";
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

type RawVerse = {
  book: string;
  chapter: number;
  verse: number;
  text: string;
};

const dataDir = join(process.cwd(), "src", "data");
const cache = new Map<string, Book[]>();

function toSlug(name: string) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
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

function dataFileFor(version: VersionId) {
  const meta = VERSIONS[version];
  const stem = meta?.file ?? version;
  return join(dataDir, `${stem}.json`);
}

function loadBooks(version: VersionId): Book[] {
  const cached = cache.get(version);
  if (cached) return cached;

  const raw = JSON.parse(readFileSync(dataFileFor(version), "utf8")) as RawVerse[];
  const books = normalize(raw);
  cache.set(version, books);
  return books;
}

export function resolveVersionId(value: string | undefined): VersionId {
  if (value && isVersionId(value)) return value;
  return DEFAULT_VERSION;
}

export function getBooks(version: VersionId = DEFAULT_VERSION) {
  return loadBooks(version);
}

export function getBook(version: VersionId, slug: string) {
  return loadBooks(version).find((b) => b.slug === slug);
}

export function getChapter(version: VersionId, slug: string, chapter: number) {
  const book = getBook(version, slug);
  return book?.chapters.find((c) => c.number === chapter);
}

export function clearBibleCache(version?: VersionId) {
  if (version) cache.delete(version);
  else cache.clear();
}
