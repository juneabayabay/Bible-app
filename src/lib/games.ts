export type GameStatus = "live" | "soon";

export type GameCard = {
  id: string;
  title: string;
  blurb: string;
  status: GameStatus;
  /** Path under /{version}/play/ when live */
  slug?: string;
};

/** Play hub list — add new games here as you build them. */
export const GAMES: GameCard[] = [
  {
    id: "fill",
    title: "Fill the blank",
    blurb: "Different verses each round. Easy, medium, or hard.",
    status: "live",
    slug: "fill",
  },
  {
    id: "unscramble",
    title: "Verse unscramble",
    blurb: "Put the words back in order — short memory race.",
    status: "soon",
  },
  {
    id: "match",
    title: "Reference match",
    blurb: "Match the verse text to its book and chapter.",
    status: "soon",
  },
  {
    id: "next",
    title: "What comes next?",
    blurb: "See the first half — pick the ending.",
    status: "soon",
  },
  {
    id: "theme",
    title: "Theme sort",
    blurb: "Hope, peace, or love — which theme fits the verse?",
    status: "soon",
  },
  {
    id: "speed",
    title: "One-minute sprint",
    blurb: "As many correct fills as you can before time’s up.",
    status: "soon",
  },
];

export function liveGames(): GameCard[] {
  return GAMES.filter((g) => g.status === "live" && g.slug);
}
