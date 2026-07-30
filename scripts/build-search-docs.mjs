import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = join(root, "src", "data");

const versions = [
  { id: "web", file: "web.json" },
  { id: "kjv", file: "kjv.json" },
  { id: "asv", file: "asv.json" },
  { id: "dra", file: "dra.json" },
  { id: "geneva1599", file: "geneva1599.json" },
  { id: "tl", file: "tl-adb1905.json" },
  { id: "es-rvr", file: "es-rvr.json" },
  { id: "lsg", file: "lsg.json" },
  { id: "darby-fr", file: "darby-fr.json" },
  { id: "martin1744", file: "martin1744.json" },
  { id: "luth1912", file: "luth1912.json" },
  { id: "elb1905", file: "elb1905.json" },
  { id: "almeida-livre", file: "almeida-livre.json" },
  { id: "cuv", file: "cuv.json" },
  { id: "cuvs", file: "cuvs.json" },
  { id: "synodal", file: "synodal.json" },
  { id: "kp", file: "kp.json" },
  { id: "diodati", file: "diodati.json" },
  { id: "riveduta", file: "riveduta.json" },
  { id: "vdc", file: "vdc.json" },
  { id: "dutch1917", file: "dutch1917.json" },
  { id: "nb1930", file: "nb1930.json" },
  { id: "sv1917", file: "sv1917.json" },
  { id: "dansk1931", file: "dansk1931.json" },
  { id: "bkr", file: "bkr.json" },
  { id: "kar", file: "kar.json" },
  { id: "bg", file: "bg.json" },
  { id: "svd", file: "svd.json" },
  { id: "vi1934", file: "vi1934.json" },
  { id: "lsb", file: "lsb.json" },
  { id: "vulg", file: "vulg.json" },
  { id: "clem", file: "clem.json" },
  { id: "tr", file: "tr.json" },
  { id: "wlc", file: "wlc.json" },
  { id: "aleppo", file: "aleppo.json" },
];

function toSlug(name) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalize(raw) {
  const books = [];
  const byName = new Map();
  for (const row of raw) {
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

const searchDir = join(root, "public", "search");
const biblesDir = join(root, "public", "bibles");
mkdirSync(searchDir, { recursive: true });
if (existsSync(biblesDir)) rmSync(biblesDir, { recursive: true });
mkdirSync(biblesDir, { recursive: true });

for (const version of versions) {
  const filePath = join(dataDir, version.file);
  if (!existsSync(filePath)) {
    console.warn(`Missing ${version.file}, skipping ${version.id}`);
    continue;
  }

  const raw = JSON.parse(readFileSync(filePath, "utf8"));
  const books = normalize(raw);

  const docs = [];
  const versionDir = join(biblesDir, version.id);
  mkdirSync(versionDir, { recursive: true });

  const manifest = books.map((book) => ({
    name: book.name,
    slug: book.slug,
    chapters: book.chapters.map((c) => c.number),
  }));
  writeFileSync(join(versionDir, "_manifest.json"), JSON.stringify(manifest));

  for (const book of books) {
    writeFileSync(join(versionDir, `${book.slug}.json`), JSON.stringify(book));
    for (const chapter of book.chapters) {
      for (const verse of chapter.verses) {
        docs.push({
          id: `${book.slug}-${chapter.number}-${verse.number}`,
          book: book.name,
          slug: book.slug,
          chapter: chapter.number,
          verse: verse.number,
          text: verse.text,
          version: version.id,
        });
      }
    }
  }

  writeFileSync(join(searchDir, `${version.id}.json`), JSON.stringify(docs));
  console.log(
    `${version.id}: ${books.length} books, ${docs.length} verses (search + public/bibles)`,
  );
}
