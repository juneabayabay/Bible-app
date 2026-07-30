const STORAGE_KEY = "bible-annotations";

export type Annotation = {
  highlighted: boolean;
  note: string;
};

export type AnnotationMap = Record<string, Annotation>;

export function verseKey(slug: string, chapter: number, verse: number) {
  return `${slug}-${chapter}-${verse}`;
}

export function loadAnnotations(): AnnotationMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as AnnotationMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveAnnotations(map: AnnotationMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function getAnnotation(map: AnnotationMap, key: string): Annotation {
  return map[key] ?? { highlighted: false, note: "" };
}

export function upsertAnnotation(
  map: AnnotationMap,
  key: string,
  patch: Partial<Annotation>,
): AnnotationMap {
  const current = getAnnotation(map, key);
  const next = { ...current, ...patch };
  const copy = { ...map };

  if (!next.highlighted && !next.note.trim()) {
    delete copy[key];
  } else {
    copy[key] = next;
  }

  return copy;
}
