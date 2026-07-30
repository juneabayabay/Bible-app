import { dayOfYearIndex } from "./dailyVerse";

export type Challenge = {
  id: string;
  title: string;
  body: string;
  /** How the UI should help complete it */
  kind: "read" | "devotion" | "reflect" | "plan";
  ctaLabel: string;
};

const POOL: Challenge[] = [
  {
    id: "read-chapter",
    title: "Read one chapter",
    body: "Open any chapter and read it slowly. Even one chapter keeps your heart near the Word.",
    kind: "read",
    ctaLabel: "Choose a book",
  },
  {
    id: "one-devotion",
    title: "Finish one devotion",
    body: "Pick a theme—love, peace, grace—and complete a short reading with prayer.",
    kind: "devotion",
    ctaLabel: "Open devotionals",
  },
  {
    id: "reflect",
    title: "One-sentence prayer",
    body: "Write one honest sentence to God about today. Keep it simple and true.",
    kind: "reflect",
    ctaLabel: "Write reflection",
  },
  {
    id: "plan-day",
    title: "Continue your plan",
    body: "Take the next day of your reading plan. Steady steps form a faithful life.",
    kind: "plan",
    ctaLabel: "Open plans",
  },
  {
    id: "todays-verse",
    title: "Sit with today’s verse",
    body: "Read the verse of the day in its chapter. Ask: what is God saying to me?",
    kind: "read",
    ctaLabel: "Read today’s chapter",
  },
];

export function getChallengeForDate(date = new Date()): Challenge {
  const idx = dayOfYearIndex(date) % POOL.length;
  return POOL[idx];
}

export function getChallengeById(id: string) {
  return POOL.find((c) => c.id === id);
}
