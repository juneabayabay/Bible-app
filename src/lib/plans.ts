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
  return Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    book: "Psalms",
    slug: "psalms",
    chapter: i + 1,
    label: `Psalm ${i + 1}`,
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
