import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const versions = [
  { id: "web", file: "src/data/web.json" },
  { id: "tl", file: "src/data/tl-adb1905.json" },
];

function toSlug(name) {
  return name.toLowerCase().replace(/\s+/g, "-");
}

const outDir = join(root, "public", "search");
mkdirSync(outDir, { recursive: true });

for (const version of versions) {
  const raw = JSON.parse(readFileSync(join(root, version.file), "utf8"));
  const docs = raw.map((row) => {
    const slug = toSlug(row.book);
    return {
      id: `${slug}-${row.chapter}-${row.verse}`,
      book: row.book,
      slug,
      chapter: row.chapter,
      verse: row.verse,
      text: row.text,
      version: version.id,
    };
  });

  writeFileSync(join(outDir, `${version.id}.json`), JSON.stringify(docs));
  console.log(`Wrote ${docs.length} search docs to public/search/${version.id}.json`);
}
