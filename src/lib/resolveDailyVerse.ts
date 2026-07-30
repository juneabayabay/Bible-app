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
  const start = dayOfYearIndex(date);
  for (let offset = 0; offset < DAILY_VERSE_POOL.length; offset++) {
    const pick = DAILY_VERSE_POOL[(start + offset) % DAILY_VERSE_POOL.length];
    const chapter = getChapter(version, pick.slug, pick.chapter);
    const verse = chapter?.verses.find((v) => v.number === pick.verse);
    if (!verse?.text) continue;

    const book = getBook(version, pick.slug);
    return {
      ...pick,
      book: book?.name ?? pick.book,
      text: verse.text,
      url: `/${version}/chapter/${pick.slug}/${pick.chapter}#v${pick.verse}`,
    };
  }
  return null;
}
