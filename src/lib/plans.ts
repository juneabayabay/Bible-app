export type PlanDay = {
  day: number;
  book: string;
  slug: string;
  chapter: number;
  label: string;
};

export type ReadingPlan = {
  id: string;
  title: string;
  summary: string;
  image: string;
  imageAlt: string;
  days: PlanDay[];
};

function daysFromChapters(
  book: string,
  slug: string,
  chapters: number[],
  labelFn?: (chapter: number, day: number) => string,
): PlanDay[] {
  return chapters.map((chapter, i) => ({
    day: i + 1,
    book,
    slug,
    chapter,
    label: labelFn?.(chapter, i + 1) ?? `${book} ${chapter}`,
  }));
}

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}

function gospelDays(): PlanDay[] {
  const seq: Array<{ book: string; slug: string; chapter: number }> = [
    ...Array.from({ length: 7 }, (_, i) => ({
      book: "Matthew",
      slug: "matthew",
      chapter: i + 1,
    })),
    ...Array.from({ length: 4 }, (_, i) => ({
      book: "Mark",
      slug: "mark",
      chapter: i + 1,
    })),
    ...Array.from({ length: 5 }, (_, i) => ({
      book: "Luke",
      slug: "luke",
      chapter: i + 1,
    })),
    ...Array.from({ length: 5 }, (_, i) => ({
      book: "John",
      slug: "john",
      chapter: i + 1,
    })),
  ];
  return seq.map((item, i) => ({
    day: i + 1,
    ...item,
    label: `${item.book} ${item.chapter}`,
  }));
}

function psalmDays(): PlanDay[] {
  return daysFromChapters("Psalms", "psalms", range(1, 30), (c) => `Psalm ${c}`);
}

function epistleSurveyDays(): PlanDay[] {
  const seq: Array<{ book: string; slug: string; chapter: number }> = [
    { book: "James", slug: "james", chapter: 1 },
    { book: "James", slug: "james", chapter: 2 },
    { book: "James", slug: "james", chapter: 3 },
    { book: "1 Peter", slug: "1-peter", chapter: 1 },
    { book: "1 Peter", slug: "1-peter", chapter: 2 },
    { book: "1 John", slug: "1-john", chapter: 1 },
    { book: "1 John", slug: "1-john", chapter: 3 },
    { book: "1 John", slug: "1-john", chapter: 4 },
    { book: "Philippians", slug: "philippians", chapter: 1 },
    { book: "Philippians", slug: "philippians", chapter: 2 },
    { book: "Philippians", slug: "philippians", chapter: 3 },
    { book: "Philippians", slug: "philippians", chapter: 4 },
    { book: "Colossians", slug: "colossians", chapter: 1 },
    { book: "Colossians", slug: "colossians", chapter: 3 },
  ];
  return seq.map((item, i) => ({
    day: i + 1,
    ...item,
    label: `${item.book} ${item.chapter}`,
  }));
}

export const READING_PLANS: ReadingPlan[] = [
  {
    id: "gospels-21",
    title: "Gospels in 21 days",
    summary: "A gentle walk through Matthew, Mark, Luke, and John—one chapter a day.",
    image: "/images/plans/gospels-21.png",
    imageAlt: "Dawn light over hills, suggesting the four Gospels",
    days: gospelDays(),
  },
  {
    id: "psalms-30",
    title: "Psalms in 30 days",
    summary: "Begin the songbook of Scripture—one psalm each day for a month.",
    image: "/images/plans/psalms-30.png",
    imageAlt: "Quiet hillside at dusk, suggesting the Psalms",
    days: psalmDays(),
  },
  {
    id: "john-21",
    title: "John in 21 days",
    summary: "Read the whole Gospel of John—one chapter a day, from beginning to end.",
    image: "/images/themes/hope.png",
    imageAlt: "Soft light suggesting the Gospel of John",
    days: daysFromChapters("John", "john", range(1, 21)),
  },
  {
    id: "proverbs-31",
    title: "Proverbs in 31 days",
    summary: "Daily wisdom for the heart—one chapter of Proverbs each day of the month.",
    image: "/images/themes/humility.png",
    imageAlt: "Quiet path suggesting wisdom from Proverbs",
    days: daysFromChapters("Proverbs", "proverbs", range(1, 31)),
  },
  {
    id: "romans-16",
    title: "Romans in 16 days",
    summary: "The foundation of the gospel—walk through Romans, one chapter a day.",
    image: "/images/themes/grace.png",
    imageAlt: "Warm light suggesting the letter to the Romans",
    days: daysFromChapters("Romans", "romans", range(1, 16)),
  },
  {
    id: "acts-28",
    title: "Acts in 28 days",
    summary: "Follow the early church from Jerusalem to the ends of the earth.",
    image: "/images/themes/faith.png",
    imageAlt: "Open road suggesting the book of Acts",
    days: daysFromChapters("Acts", "acts", range(1, 28)),
  },
  {
    id: "genesis-14",
    title: "Genesis beginnings",
    summary: "Creation, promise, and the first steps of faith—Genesis 1–14.",
    image: "/images/themes/peace.png",
    imageAlt: "Morning landscape suggesting Genesis beginnings",
    days: daysFromChapters("Genesis", "genesis", range(1, 14)),
  },
  {
    id: "epistles-14",
    title: "Letters for life",
    summary: "Fourteen days in James, Peter, John, Philippians, and Colossians.",
    image: "/images/themes/kindness.png",
    imageAlt: "Quiet desk light suggesting the New Testament letters",
    days: epistleSurveyDays(),
  },
];

export function getPlans() {
  return READING_PLANS;
}

export function getPlan(id: string) {
  return READING_PLANS.find((p) => p.id === id);
}

/** Next incomplete day for a plan (1-based), or null if finished. */
export function nextPlanDay(
  plan: ReadingPlan,
  doneKeys: string[],
): PlanDay | null {
  for (const day of plan.days) {
    if (!doneKeys.includes(`${plan.id}:${day.day}`)) return day;
  }
  return null;
}
