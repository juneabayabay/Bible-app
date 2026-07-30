import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const raw = JSON.parse(readFileSync(join(root, "src/data/bible-raw.json"), "utf8"));

function toSlug(name) {
  return name.toLowerCase().replace(/\s+/g, "-");
}

const docs = raw.map((row) => {
  const slug = toSlug(row.book);
  return {
    id: `${slug}-${row.chapter}-${row.verse}`,
    book: row.book,
    slug,
    chapter: row.chapter,
    verse: row.verse,
    text: row.text,
  };
});

const outDir = join(root, "public");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "search-docs.json"), JSON.stringify(docs));
console.log(`Wrote ${docs.length} search docs to public/search-docs.json`);
