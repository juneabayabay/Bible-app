import { getVersion, type VersionId } from "./versions";

/**
 * Pick a parallel translation for side-by-side reading.
 * Tagalog ↔ English (WEB) is the default unique pairing for this app.
 */
export function getCompareVersionId(current: VersionId): VersionId | null {
  const meta = getVersion(current);
  if (meta.language === "tl") return "web";
  if (current === "web") return "tl";
  if (meta.language === "en") return "tl";
  return "tl";
}
