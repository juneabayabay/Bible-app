import raw from "../data/bible-raw.json";

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

const books = normalize(raw as RawVerse[]);

export function getBooks() {
  return books;
}

export function getBook(slug: string) {
  return books.find((b) => b.slug === slug);
}

export function getChapter(slug: string, chapter: number) {
  const book = getBook(slug);
  return book?.chapters.find((c) => c.number === chapter);
}