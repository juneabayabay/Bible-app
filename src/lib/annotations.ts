const STORAGE_KEY = "bible-annotations";

export const HIGHLIGHT_COLORS = [
  { id: "gold", label: "Gold" },
  { id: "sage", label: "Sage" },
  { id: "sky", label: "Sky" },
  { id: "rose", label: "Rose" },
  { id: "lilac", label: "Lilac" },
] as const;

export type HighlightColorId = (typeof HIGHLIGHT_COLORS)[number]["id"];

export type Annotation = {
  highlightColor: HighlightColorId | null;
  note: string;
};

export type AnnotationMap = Record<string, Annotation>;

type LegacyAnnotation = {
  highlightColor?: HighlightColorId | null;
  highlighted?: boolean;
  note?: string;
};

function isHighlightColor(value: unknown): value is HighlightColorId {
  return HIGHLIGHT_COLORS.some((c) => c.id === value);
}

export function normalizeAnnotation(raw: LegacyAnnotation | null | undefined): Annotation {
  const note = typeof raw?.note === "string" ? raw.note : "";
  if (isHighlightColor(raw?.highlightColor)) {
    return { highlightColor: raw.highlightColor, note };
  }
  if (raw?.highlighted) {
    return { highlightColor: "gold", note };
  }
  return { highlightColor: null, note };
}

export function verseKey(
  version: string,
  slug: string,
  chapter: number,
  verse: number,
) {
  return `${version}:${slug}-${chapter}-${verse}`;
}

export function parseVerseKey(key: string) {
  const withVersion = key.match(/^([a-z0-9]+):(.+)-(\d+)-(\d+)$/i);
  if (withVersion) {
    return {
      version: withVersion[1],
      slug: withVersion[2],
      chapter: Number(withVersion[3]),
      verse: Number(withVersion[4]),
    };
  }

  // Legacy keys (before multi-version) → treat as WEB
  const legacy = key.match(/^(.+)-(\d+)-(\d+)$/);
  if (legacy) {
    return {
      version: "web",
      slug: legacy[1],
      chapter: Number(legacy[2]),
      verse: Number(legacy[3]),
    };
  }

  return null;
}

export function loadAnnotations(): AnnotationMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, LegacyAnnotation>;
    if (!parsed || typeof parsed !== "object") return {};

    const map: AnnotationMap = {};
    for (const [key, value] of Object.entries(parsed)) {
      const next = normalizeAnnotation(value);
      if (next.highlightColor || next.note.trim()) {
        map[key] = next;
      }
    }
    return map;
  } catch {
    return {};
  }
}

export function saveAnnotations(map: AnnotationMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function getAnnotation(map: AnnotationMap, key: string): Annotation {
  return map[key] ?? { highlightColor: null, note: "" };
}

export function upsertAnnotation(
  map: AnnotationMap,
  key: string,
  patch: Partial<Annotation>,
): AnnotationMap {
  const current = getAnnotation(map, key);
  const next = { ...current, ...patch };
  const copy = { ...map };

  if (!next.highlightColor && !next.note.trim()) {
    delete copy[key];
  } else {
    copy[key] = next;
  }

  return copy;
}
