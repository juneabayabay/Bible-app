import { getSupabase, isSupabaseConfigured } from "./supabase";

export type FeedbackEntry = {
  id: string;
  name: string;
  message: string;
  createdAt: string;
  deviceId: string;
};

const LOCAL_KEY = "bible-app-feedback";

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function loadLocal(): FeedbackEntry[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FeedbackEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocal(entries: FeedbackEntry[]) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(entries.slice(0, 40)));
  } catch {
    /* ignore */
  }
}

export function isFeedbackLive(): boolean {
  return isSupabaseConfigured();
}

/**
 * Submit feedback. Uses Supabase when configured; otherwise saves on this device.
 * Returns whether it was shared remotely.
 */
export async function submitFeedback(
  name: string,
  message: string,
  deviceId: string,
): Promise<{ remote: boolean }> {
  const trimmed = message.trim();
  if (!trimmed) throw new Error("Please write a short message.");

  const entry: FeedbackEntry = {
    id: newId(),
    name: (name.trim() || "Anonymous").slice(0, 40),
    message: trimmed.slice(0, 1000),
    createdAt: new Date().toISOString(),
    deviceId,
  };

  if (!isFeedbackLive()) {
    const list = loadLocal();
    list.unshift(entry);
    saveLocal(list);
    return { remote: false };
  }

  const sb = getSupabase()!;
  const { error } = await sb.from("app_feedback").insert({
    display_name: entry.name,
    body: entry.message,
    device_id: entry.deviceId,
  });

  if (error) {
    // Keep a local copy so the note isn’t lost if the network fails.
    const list = loadLocal();
    list.unshift(entry);
    saveLocal(list);
    throw new Error(error.message || "Could not send feedback. Saved on this device.");
  }

  return { remote: true };
}
