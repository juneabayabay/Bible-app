export type VersionId = "web" | "tl";

export type BibleVersion = {
  id: VersionId;
  label: string;
  shortLabel: string;
  language: string;
  description: string;
};

export const VERSIONS: Record<VersionId, BibleVersion> = {
  web: {
    id: "web",
    label: "English · WEB",
    shortLabel: "English",
    language: "en",
    description: "World English Bible (public domain)",
  },
  tl: {
    id: "tl",
    label: "Tagalog · ADB 1905",
    shortLabel: "Tagalog",
    language: "tl",
    description: "Ang Dating Biblia (1905, public domain)",
  },
};

export const VERSION_IDS = Object.keys(VERSIONS) as VersionId[];
export const DEFAULT_VERSION: VersionId = "web";

export function isVersionId(value: string): value is VersionId {
  return value in VERSIONS;
}

export function getVersion(id: string): BibleVersion {
  if (isVersionId(id)) return VERSIONS[id];
  return VERSIONS[DEFAULT_VERSION];
}
