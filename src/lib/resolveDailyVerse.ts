import { DAILY_VERSE_POOL, dayOfYearIndex, type VerseRef } from "./dailyVerse";
import { getBook, getChapter } from "./bible";
import type { VersionId } from "./versions";

export type ResolvedDailyVerse = VerseRef & {
  text: string;
  url: string;
};

/** Pick today's verse that exists in the given version (fallback through the pool). */
export function resolveDailyVerse(
  version: VersionId,
  date = new Date(),
): ResolvedDailyVerse | null {
  const list = resolveGameVerses(version, 1, date);
  return list[0] ?? null;
}

/**
 * Resolve `count` distinct verses that exist in this version.
 * Starts from a day-rotated offset, then walks the whole pool so games get deep context.
 */
export function resolveGameVerses(
  version: VersionId,
  count: number,
  date = new Date(),
): ResolvedDailyVerse[] {
  const start = dayOfYearIndex(date);
  const out: ResolvedDailyVerse[] = [];
  const seen = new Set<string>();

  for (let offset = 0; offset < DAILY_VERSE_POOL.length && out.length < count; offset++) {
    const pick = DAILY_VERSE_POOL[(start + offset) % DAILY_VERSE_POOL.length];
    const key = `${pick.slug}-${pick.chapter}-${pick.verse}`;
    if (seen.has(key)) continue;

    const chapter = getChapter(version, pick.slug, pick.chapter);
    const verse = chapter?.verses.find((v) => v.number === pick.verse);
    if (!verse?.text) continue;

    const book = getBook(version, pick.slug);
    seen.add(key);
    out.push({
      ...pick,
      book: book?.name ?? pick.book,
      text: verse.text,
      url: `/${version}/chapter/${pick.slug}/${pick.chapter}#v${pick.verse}`,
    });
  }

  return out;
}
