/** Protestant OT book slugs (English names used in our data). */
export const OT_SLUGS = new Set([
  "genesis",
  "exodus",
  "leviticus",
  "numbers",
  "deuteronomy",
  "joshua",
  "judges",
  "ruth",
  "1-samuel",
  "2-samuel",
  "1-kings",
  "2-kings",
  "1-chronicles",
  "2-chronicles",
  "ezra",
  "nehemiah",
  "esther",
  "job",
  "psalms",
  "proverbs",
  "ecclesiastes",
  "song-of-solomon",
  "isaiah",
  "jeremiah",
  "lamentations",
  "ezekiel",
  "daniel",
  "hosea",
  "joel",
  "amos",
  "obadiah",
  "jonah",
  "micah",
  "nahum",
  "habakkuk",
  "zephaniah",
  "haggai",
  "zechariah",
  "malachi",
]);

const SECTIONS: Array<{ id: string; label: string; slugs: string[] }> = [
  {
    id: "law",
    label: "Law",
    slugs: ["genesis", "exodus", "leviticus", "numbers", "deuteronomy"],
  },
  {
    id: "history",
    label: "History",
    slugs: [
      "joshua",
      "judges",
      "ruth",
      "1-samuel",
      "2-samuel",
      "1-kings",
      "2-kings",
      "1-chronicles",
      "2-chronicles",
      "ezra",
      "nehemiah",
      "esther",
    ],
  },
  {
    id: "poetry",
    label: "Poetry & Wisdom",
    slugs: ["job", "psalms", "proverbs", "ecclesiastes", "song-of-solomon"],
  },
  {
    id: "major-prophets",
    label: "Major Prophets",
    slugs: ["isaiah", "jeremiah", "lamentations", "ezekiel", "daniel"],
  },
  {
    id: "minor-prophets",
    label: "Minor Prophets",
    slugs: [
      "hosea",
      "joel",
      "amos",
      "obadiah",
      "jonah",
      "micah",
      "nahum",
      "habakkuk",
      "zephaniah",
      "haggai",
      "zechariah",
      "malachi",
    ],
  },
  {
    id: "gospels",
    label: "Gospels",
    slugs: ["matthew", "mark", "luke", "john"],
  },
  {
    id: "acts",
    label: "History",
    slugs: ["acts"],
  },
  {
    id: "paul",
    label: "Paul’s Letters",
    slugs: [
      "romans",
      "1-corinthians",
      "2-corinthians",
      "galatians",
      "ephesians",
      "philippians",
      "colossians",
      "1-thessalonians",
      "2-thessalonians",
      "1-timothy",
      "2-timothy",
      "titus",
      "philemon",
    ],
  },
  {
    id: "general",
    label: "General Letters",
    slugs: [
      "hebrews",
      "james",
      "1-peter",
      "2-peter",
      "1-john",
      "2-john",
      "3-john",
      "jude",
    ],
  },
  {
    id: "revelation",
    label: "Revelation",
    slugs: ["revelation"],
  },
];

export function isOldTestament(slug: string) {
  return OT_SLUGS.has(slug);
}

export type BookLike = { name: string; slug: string; chapters?: number[] };

export type BookSection = {
  id: string;
  label: string;
  books: BookLike[];
};

/** Group books into readable sections; leftover books go under “Other”. */
export function groupBooks(books: BookLike[]): BookSection[] {
  const bySlug = new Map(books.map((b) => [b.slug, b]));
  const used = new Set<string>();
  const sections: BookSection[] = [];

  for (const section of SECTIONS) {
    const matched = section.slugs
      .map((slug) => bySlug.get(slug))
      .filter((b): b is BookLike => Boolean(b));
    if (!matched.length) continue;
    for (const b of matched) used.add(b.slug);
    sections.push({ id: section.id, label: section.label, books: matched });
  }

  const leftover = books.filter((b) => !used.has(b.slug));
  if (leftover.length) {
    sections.push({ id: "other", label: "Other", books: leftover });
  }

  return sections;
}
