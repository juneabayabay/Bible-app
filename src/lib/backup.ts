import {
  loadAnnotations,
  normalizeAnnotation,
  saveAnnotations,
  type AnnotationMap,
} from "./annotations";
import { loadPrayers, savePrayers, type PrayerEntry } from "./prayers";

export const BACKUP_VERSION = 1 as const;

export type BackupPayload = {
  app: "bible-app";
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  annotations: AnnotationMap;
  prayers: PrayerEntry[];
};

export type ImportMode = "merge" | "replace";

export type ImportResult = {
  annotations: number;
  prayers: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function buildBackup(): BackupPayload {
  return {
    app: "bible-app",
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    annotations: loadAnnotations(),
    prayers: loadPrayers(),
  };
}

export function downloadBackup() {
  const payload = buildBackup();
  const stamp = payload.exportedAt.slice(0, 10);
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bible-backup-${stamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
  return payload;
}

function parseAnnotations(raw: unknown): AnnotationMap {
  if (!isRecord(raw)) return {};
  const map: AnnotationMap = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof key !== "string" || !isRecord(value)) continue;
    const next = normalizeAnnotation(value);
    if (next.highlightColor || next.note.trim()) {
      map[key] = next;
    }
  }
  return map;
}

function parsePrayers(raw: unknown): PrayerEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (p): p is Record<string, unknown> =>
        isRecord(p) &&
        typeof p.id === "string" &&
        typeof p.forWhom === "string" &&
        typeof p.createdAt === "string",
    )
    .map((p) => ({
      id: p.id as string,
      forWhom: p.forWhom as string,
      note: typeof p.note === "string" ? p.note : "",
      createdAt: p.createdAt as string,
    }));
}

export function parseBackup(raw: unknown): BackupPayload {
  if (!isRecord(raw)) {
    throw new Error("Backup file is not valid JSON.");
  }

  // Accept our format, or a bare annotations map for older exports
  if (raw.app === "bible-app" || raw.version === BACKUP_VERSION || "annotations" in raw) {
    return {
      app: "bible-app",
      version: BACKUP_VERSION,
      exportedAt:
        typeof raw.exportedAt === "string" ? raw.exportedAt : new Date().toISOString(),
      annotations: parseAnnotations(raw.annotations),
      prayers: parsePrayers(raw.prayers),
    };
  }

  // Bare annotation map
  const annotations = parseAnnotations(raw);
  if (Object.keys(annotations).length) {
    return {
      app: "bible-app",
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      annotations,
      prayers: [],
    };
  }

  throw new Error("Unrecognized backup format.");
}

export function applyBackup(payload: BackupPayload, mode: ImportMode = "merge"): ImportResult {
  const incomingAnnotations = payload.annotations;
  const incomingPrayers = payload.prayers;

  if (mode === "replace") {
    saveAnnotations(incomingAnnotations);
    savePrayers(incomingPrayers);
    return {
      annotations: Object.keys(incomingAnnotations).length,
      prayers: incomingPrayers.length,
    };
  }

  const mergedAnnotations: AnnotationMap = {
    ...loadAnnotations(),
    ...incomingAnnotations,
  };
  saveAnnotations(mergedAnnotations);

  const byId = new Map(loadPrayers().map((p) => [p.id, p]));
  for (const prayer of incomingPrayers) {
    byId.set(prayer.id, prayer);
  }
  const mergedPrayers = Array.from(byId.values()).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  savePrayers(mergedPrayers);

  return {
    annotations: Object.keys(incomingAnnotations).length,
    prayers: incomingPrayers.length,
  };
}

export async function importBackupFile(
  file: File,
  mode: ImportMode = "merge",
): Promise<ImportResult> {
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Could not read backup file.");
  }
  return applyBackup(parseBackup(parsed), mode);
}
