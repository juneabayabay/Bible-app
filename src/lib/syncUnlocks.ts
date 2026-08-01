import {
  applyTrophyUnlocks,
  buildUnlockContext,
  loadJourney,
  type Trophy,
} from "./journey";
import { loadGameProfile } from "./gameRewards";
import { loadProgress } from "./progress";

/** Re-check all medals after any meaningful action. */
export function syncJourneyUnlocks(): {
  newlyUnlocked: Trophy[];
  trophies: string[];
} {
  const state = loadJourney();
  const progress = loadProgress();
  const game = loadGameProfile();
  const ctx = buildUnlockContext(state, progress, {
    totalRuns: game.totalRuns,
    hardClears: game.hardClears,
    perfectRuns: game.perfectRuns,
    runsByGame: game.runsByGame,
  });
  const result = applyTrophyUnlocks(state, ctx);
  return {
    newlyUnlocked: result.newlyUnlocked,
    trophies: result.state.trophies,
  };
}
