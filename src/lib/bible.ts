import webRaw from "../data/web.json";
import tlRaw from "../data/tl-adb1905.json";
import { DEFAULT_VERSION, type VersionId, isVersionId } from "./versions";

export type Verse = { number: number; text: string };
export type Chapter = { number: number; verses: Verse[] };
export type Book = { name: string; slug: string; chapters: Chapter[] };

type RawVerse = {
  book: string;
  chapter: number;
  verse: number;
  text: string;
};

function toSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-");
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

const byVersion: Record<VersionId, Book[]> = {
  web: normalize(webRaw as RawVerse[]),
  tl: normalize(tlRaw as RawVerse[]),
};

export function resolveVersionId(value: string | undefined): VersionId {
  if (value && isVersionId(value)) return value;
  return DEFAULT_VERSION;
}

export function getBooks(version: VersionId = DEFAULT_VERSION) {
  return byVersion[version];
}

export function getBook(version: VersionId, slug: string) {
  return byVersion[version].find((b) => b.slug === slug);
}

export function getChapter(version: VersionId, slug: string, chapter: number) {
  const book = getBook(version, slug);
  return book?.chapters.find((c) => c.number === chapter);
}
