import { VERSION_IDS } from "./versions";
import { getBookCatalog, type BookCatalogEntry } from "./bible";

type ChapterPath = {
  params: { version: string; book: string; chapter: string };
};

type BookPath = {
  params: { version: string; book: string };
};

let chapterPaths: ChapterPath[] | null = null;
let bookPaths: BookPath[] | null = null;

/** Precompute once per process — avoids re-walking every version on each click in dev. */
export function getChapterStaticPaths(): ChapterPath[] {
  if (chapterPaths) return chapterPaths;

  const paths: ChapterPath[] = [];
  for (const version of VERSION_IDS) {
    for (const book of getBookCatalog(version)) {
      for (const chapter of book.chapters) {
        paths.push({
          params: {
            version,
            book: book.slug,
            chapter: String(chapter),
          },
        });
      }
    }
  }
  chapterPaths = paths;
  return paths;
}

export function getBookStaticPaths(): BookPath[] {
  if (bookPaths) return bookPaths;

  const paths: BookPath[] = [];
  for (const version of VERSION_IDS) {
    for (const book of getBookCatalog(version)) {
      paths.push({
        params: { version, book: book.slug },
      });
    }
  }
  bookPaths = paths;
  return paths;
}

export function getVersionHomePaths() {
  return VERSION_IDS.map((version) => ({ params: { version } }));
}

export type { BookCatalogEntry };
