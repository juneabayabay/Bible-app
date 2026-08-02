export type GameStatus = "live" | "soon";

export type GameCard = {
  id: string;
  title: string;
  blurb: string;
  status: GameStatus;
  /** Path under /{version}/play/ when live */
  slug?: string;
  /** Short tag shown on the list */
  vibe?: string;
};

/** Play hub list — add new games here as you build them. */
export const GAMES: GameCard[] = [
  {
    id: "fill",
    title: "Fill the blank",
    blurb: "Missing words. Easy to hard.",
    status: "live",
    slug: "fill",
    vibe: "Memory",
  },
  {
    id: "unscramble",
    title: "Word river",
    blurb: "Tap words in the right order.",
    status: "live",
    slug: "unscramble",
    vibe: "Order",
  },
  {
    id: "match",
    title: "Cite snap",
    blurb: "Match the verse to its reference.",
    status: "live",
    slug: "match",
    vibe: "Focus",
  },
  {
    id: "next",
    title: "Finish the line",
    blurb: "Pick the true ending of the verse.",
    status: "live",
    slug: "next",
    vibe: "Echo",
  },
  {
    id: "theme",
    title: "Heart compass",
    blurb: "Name the heart of the verse.",
    status: "live",
    slug: "theme",
    vibe: "Discern",
  },
  {
    id: "speed",
    title: "Breath sprint",
    blurb: "60 seconds. Fill blanks fast.",
    status: "live",
    slug: "speed",
    vibe: "Tempo",
  },
];

export function liveGames(): GameCard[] {
  return GAMES.filter((g) => g.status === "live" && g.slug);
}
