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
    blurb: "Lock in missing words. Easy, medium, or hard.",
    status: "live",
    slug: "fill",
    vibe: "Memory",
  },
  {
    id: "unscramble",
    title: "Word river",
    blurb: "Tap words in the right current — rebuild the verse before it drifts.",
    status: "live",
    slug: "unscramble",
    vibe: "Order",
  },
  {
    id: "match",
    title: "Cite snap",
    blurb: "A verse flashes. Snap the true reference — near-misses from the same book.",
    status: "live",
    slug: "match",
    vibe: "Focus",
  },
  {
    id: "next",
    title: "Finish the line",
    blurb: "Half the verse is given. Which ending keeps the Word true?",
    status: "live",
    slug: "next",
    vibe: "Echo",
  },
  {
    id: "theme",
    title: "Heart compass",
    blurb: "Read the verse. Point the compass: hope, peace, love, faith, or courage.",
    status: "live",
    slug: "theme",
    vibe: "Discern",
  },
  {
    id: "speed",
    title: "Breath sprint",
    blurb: "Sixty seconds. Fill blanks as verses shift — calm speed, not chaos.",
    status: "live",
    slug: "speed",
    vibe: "Tempo",
  },
];

export function liveGames(): GameCard[] {
  return GAMES.filter((g) => g.status === "live" && g.slug);
}
