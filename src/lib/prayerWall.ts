import { getDeviceId } from "./deviceId";
import { getSupabase, isSupabaseConfigured } from "./supabase";

export type ReactionType = "prayed" | "heart" | "amen";

export type WallComment = {
  id: string;
  requestId: string;
  displayName: string;
  body: string;
  createdAt: string;
  deviceId: string;
};

export type WallRequest = {
  id: string;
  displayName: string;
  body: string;
  createdAt: string;
  deviceId: string;
  reactionCounts: Record<ReactionType, number>;
  myReactions: ReactionType[];
  comments: WallComment[];
  commentsOpen?: boolean;
  commentDraft?: string;
  commentName?: string;
};

const LOCAL_KEY = "bible-prayer-wall";

type LocalStore = {
  requests: Array<{
    id: string;
    displayName: string;
    body: string;
    createdAt: string;
    deviceId: string;
  }>;
  reactions: Array<{
    id: string;
    requestId: string;
    deviceId: string;
    type: ReactionType;
  }>;
  comments: Array<{
    id: string;
    requestId: string;
    displayName: string;
    body: string;
    createdAt: string;
    deviceId: string;
  }>;
};

export function isWallLive(): boolean {
  return isSupabaseConfigured();
}

function emptyCounts(): Record<ReactionType, number> {
  return { prayed: 0, heart: 0, amen: 0 };
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function loadLocal(): LocalStore {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return { requests: [], reactions: [], comments: [] };
    const parsed = JSON.parse(raw) as LocalStore;
    return {
      requests: Array.isArray(parsed.requests) ? parsed.requests : [],
      reactions: Array.isArray(parsed.reactions) ? parsed.reactions : [],
      comments: Array.isArray(parsed.comments) ? parsed.comments : [],
    };
  } catch {
    return { requests: [], reactions: [], comments: [] };
  }
}

function saveLocal(store: LocalStore) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(store));
  } catch {
    /* private mode / quota */
  }
}

function assemble(
  requests: LocalStore["requests"],
  reactions: LocalStore["reactions"],
  comments: LocalStore["comments"],
  deviceId: string,
): WallRequest[] {
  return [...requests]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((r) => {
      const counts = emptyCounts();
      const myReactions: ReactionType[] = [];
      for (const react of reactions.filter((x) => x.requestId === r.id)) {
        counts[react.type] += 1;
        if (react.deviceId === deviceId) myReactions.push(react.type);
      }
      const requestComments = comments
        .filter((c) => c.requestId === r.id)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .map((c) => ({
          id: c.id,
          requestId: c.requestId,
          displayName: c.displayName,
          body: c.body,
          createdAt: c.createdAt,
          deviceId: c.deviceId,
        }));
      return {
        id: r.id,
        displayName: r.displayName,
        body: r.body,
        createdAt: r.createdAt,
        deviceId: r.deviceId,
        reactionCounts: counts,
        myReactions,
        comments: requestComments,
        commentsOpen: false,
        commentDraft: "",
        commentName: "",
      };
    });
}

async function listLocal(): Promise<WallRequest[]> {
  const store = loadLocal();
  return assemble(store.requests, store.reactions, store.comments, getDeviceId());
}

async function listRemote(): Promise<WallRequest[]> {
  const sb = getSupabase();
  if (!sb) return listLocal();
  const deviceId = getDeviceId();

  const { data: requests, error } = await sb
    .from("prayer_requests")
    .select("id, display_name, body, created_at, device_id")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !requests) throw error ?? new Error("Failed to load requests");

  const ids = requests.map((r) => r.id);
  if (!ids.length) return [];

  const [{ data: reactions }, { data: comments }] = await Promise.all([
    sb.from("prayer_reactions").select("id, request_id, device_id, type").in("request_id", ids),
    sb
      .from("prayer_comments")
      .select("id, request_id, display_name, body, created_at, device_id")
      .in("request_id", ids)
      .order("created_at", { ascending: true }),
  ]);

  return assemble(
    requests.map((r) => ({
      id: r.id,
      displayName: r.display_name,
      body: r.body,
      createdAt: r.created_at,
      deviceId: r.device_id,
    })),
    (reactions ?? []).map((x) => ({
      id: x.id,
      requestId: x.request_id,
      deviceId: x.device_id,
      type: x.type as ReactionType,
    })),
    (comments ?? []).map((c) => ({
      id: c.id,
      requestId: c.request_id,
      displayName: c.display_name,
      body: c.body,
      createdAt: c.created_at,
      deviceId: c.device_id,
    })),
    deviceId,
  );
}

export async function listWallRequests(): Promise<WallRequest[]> {
  if (isWallLive()) return listRemote();
  return listLocal();
}

export async function createWallRequest(
  displayName: string,
  body: string,
): Promise<WallRequest[]> {
  const trimmedBody = body.trim();
  if (!trimmedBody) return listWallRequests();

  const name = displayName.trim() || "Anonymous";
  const deviceId = getDeviceId();

  if (!isWallLive()) {
    const store = loadLocal();
    store.requests.unshift({
      id: newId(),
      displayName: name.slice(0, 40),
      body: trimmedBody.slice(0, 500),
      createdAt: new Date().toISOString(),
      deviceId,
    });
    saveLocal(store);
    return listLocal();
  }

  const sb = getSupabase()!;
  const { error } = await sb.from("prayer_requests").insert({
    display_name: name.slice(0, 40),
    body: trimmedBody.slice(0, 500),
    device_id: deviceId,
  });
  if (error) throw error;
  return listRemote();
}

export async function toggleReaction(
  requestId: string,
  type: ReactionType,
): Promise<WallRequest[]> {
  const deviceId = getDeviceId();

  if (!isWallLive()) {
    const store = loadLocal();
    const idx = store.reactions.findIndex(
      (r) => r.requestId === requestId && r.deviceId === deviceId && r.type === type,
    );
    if (idx >= 0) store.reactions.splice(idx, 1);
    else {
      store.reactions.push({
        id: newId(),
        requestId,
        deviceId,
        type,
      });
    }
    saveLocal(store);
    return listLocal();
  }

  const sb = getSupabase()!;
  const { data: existing } = await sb
    .from("prayer_reactions")
    .select("id")
    .eq("request_id", requestId)
    .eq("device_id", deviceId)
    .eq("type", type)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await sb.from("prayer_reactions").delete().eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await sb.from("prayer_reactions").insert({
      request_id: requestId,
      device_id: deviceId,
      type,
    });
    if (error) throw error;
  }
  return listRemote();
}

export async function addWallComment(
  requestId: string,
  displayName: string,
  body: string,
): Promise<WallRequest[]> {
  const trimmed = body.trim();
  if (!trimmed) return listWallRequests();

  const name = displayName.trim() || "Anonymous";
  const deviceId = getDeviceId();

  if (!isWallLive()) {
    const store = loadLocal();
    store.comments.push({
      id: newId(),
      requestId,
      displayName: name.slice(0, 40),
      body: trimmed.slice(0, 280),
      createdAt: new Date().toISOString(),
      deviceId,
    });
    saveLocal(store);
    return listLocal();
  }

  const sb = getSupabase()!;
  const { error } = await sb.from("prayer_comments").insert({
    request_id: requestId,
    display_name: name.slice(0, 40),
    body: trimmed.slice(0, 280),
    device_id: deviceId,
  });
  if (error) throw error;
  return listRemote();
}

export async function removeOwnRequest(requestId: string): Promise<WallRequest[]> {
  const deviceId = getDeviceId();

  if (!isWallLive()) {
    const store = loadLocal();
    const mine = store.requests.find((r) => r.id === requestId && r.deviceId === deviceId);
    if (!mine) return listLocal();
    store.requests = store.requests.filter((r) => r.id !== requestId);
    store.reactions = store.reactions.filter((r) => r.requestId !== requestId);
    store.comments = store.comments.filter((c) => c.requestId !== requestId);
    saveLocal(store);
    return listLocal();
  }

  const sb = getSupabase()!;
  const { error } = await sb
    .from("prayer_requests")
    .delete()
    .eq("id", requestId)
    .eq("device_id", deviceId);
  if (error) throw error;
  return listRemote();
}
