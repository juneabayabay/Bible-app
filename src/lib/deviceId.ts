const STORAGE_KEY = "bible-device-id";

/** Stable anonymous id for this browser — used for wall posts / reacts. */
export function getDeviceId(): string {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing && existing.length >= 8) return existing;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
    localStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    return `session-${Date.now()}`;
  }
}
