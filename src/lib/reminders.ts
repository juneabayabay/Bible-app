const STORAGE_KEY = "bible-reminders";
const SHOWN_KEY = "bible-reminder-shown-day";
export const REMINDER_TAG = "bible-daily-reminder";

export type ReminderPrefs = {
  enabled: boolean;
  /** Local hour 0–23 */
  hour: number;
  /** Local minute 0–59 */
  minute: number;
};

const DEFAULTS: ReminderPrefs = {
  enabled: false,
  hour: 7,
  minute: 0,
};

let localTimer: ReturnType<typeof setTimeout> | null = null;
let visibilityBound = false;

export function loadReminderPrefs(): ReminderPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<ReminderPrefs>;
    return {
      enabled: Boolean(parsed.enabled),
      hour: clampInt(parsed.hour, 0, 23, DEFAULTS.hour),
      minute: clampInt(parsed.minute, 0, 59, DEFAULTS.minute),
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveReminderPrefs(prefs: ReminderPrefs) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        enabled: prefs.enabled,
        hour: clampInt(prefs.hour, 0, 23, DEFAULTS.hour),
        minute: clampInt(prefs.minute, 0, 59, DEFAULTS.minute),
      }),
    );
  } catch {
    /* private mode */
  }
}

function clampInt(value: unknown, min: number, max: number, fallback: number) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

export function formatReminderTime(hour: number, minute: number): string {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

/** Next local occurrence of hour:minute (always in the future). */
export function nextReminderTimestamp(hour: number, minute: number, from = new Date()): number {
  const next = new Date(from);
  next.setSeconds(0, 0);
  next.setHours(hour, minute, 0, 0);
  if (next.getTime() <= from.getTime() + 15_000) {
    next.setDate(next.getDate() + 1);
  }
  return next.getTime();
}

function dayKey(d = new Date()): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function wasShownToday(): boolean {
  try {
    return localStorage.getItem(SHOWN_KEY) === dayKey();
  } catch {
    return false;
  }
}

function markShownToday() {
  try {
    localStorage.setItem(SHOWN_KEY, dayKey());
  } catch {
    /* ignore */
  }
}

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator;
}

export function notificationPermission(): NotificationPermission | "unsupported" {
  if (!notificationsSupported()) return "unsupported";
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!notificationsSupported()) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

export function isOneSignalConfigured(): boolean {
  const id = import.meta.env.PUBLIC_ONESIGNAL_APP_ID as string | undefined;
  return Boolean(id?.trim());
}

export function getOneSignalAppId(): string | null {
  const id = (import.meta.env.PUBLIC_ONESIGNAL_APP_ID as string | undefined)?.trim();
  return id || null;
}

export type ScheduleResult =
  | { ok: true; mode: "scheduled" | "local" | "onesignal" | "deferred"; at: number }
  | { ok: false; reason: string };

async function readyRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.ready;
  } catch {
    return null;
  }
}

function reminderVersionPath(): string {
  if (typeof window === "undefined") return "/web/";
  const v = window.location.pathname.split("/").filter(Boolean)[0] || "web";
  return `/${v}/`;
}

/** Fire the daily reminder notification now (once per local day). */
export async function showReminderNotificationNow(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (Notification.permission !== "granted") return false;
  if (wasShownToday()) return false;

  const title = "Time with the Word";
  const body = "A quiet moment is waiting — open Scripture when you’re ready.";
  const url = reminderVersionPath();
  const options: NotificationOptions = {
    tag: REMINDER_TAG,
    body,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: { url },
    renotify: true,
  };

  try {
    const reg = await readyRegistration();
    if (reg?.showNotification) {
      await reg.showNotification(title, options);
    } else {
      new Notification(title, options);
    }
    markShownToday();
    return true;
  } catch {
    try {
      new Notification(title, options);
      markShownToday();
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * If today's reminder time already passed and we haven't notified, fire once
 * (helps when the user opens the app after the scheduled time).
 */
export async function catchUpReminderIfNeeded(prefs: ReminderPrefs): Promise<void> {
  if (!prefs.enabled || Notification.permission !== "granted") return;
  if (wasShownToday()) return;
  const now = new Date();
  const slot = new Date(now);
  slot.setSeconds(0, 0);
  slot.setHours(prefs.hour, prefs.minute, 0, 0);
  if (now.getTime() < slot.getTime()) return;
  // Only catch up within 12 hours of the slot (avoid surprising late-night enables).
  if (now.getTime() - slot.getTime() > 12 * 60 * 60 * 1000) return;
  await showReminderNotificationNow();
}

export function clearLocalReminderArm() {
  if (localTimer != null) {
    clearTimeout(localTimer);
    localTimer = null;
  }
}

/**
 * In-page timer — fires while the site/PWA is open (browsers no longer support
 * TimestampTrigger for closed tabs). Re-arms for the next day after firing.
 */
export function armLocalReminder(prefs: ReminderPrefs, opts?: { catchUp?: boolean }) {
  if (typeof window === "undefined") return;
  clearLocalReminderArm();
  if (!prefs.enabled || Notification.permission !== "granted") return;

  if (opts?.catchUp) void catchUpReminderIfNeeded(prefs);

  const at = nextReminderTimestamp(prefs.hour, prefs.minute);
  const delay = Math.max(1_000, at - Date.now());

  localTimer = setTimeout(() => {
    localTimer = null;
    void (async () => {
      await showReminderNotificationNow();
      const latest = loadReminderPrefs();
      if (latest.enabled) armLocalReminder(latest, { catchUp: false });
    })();
  }, delay);

  bindReminderVisibility();
}

function bindReminderVisibility() {
  if (visibilityBound || typeof document === "undefined") return;
  visibilityBound = true;
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    const prefs = loadReminderPrefs();
    if (!prefs.enabled || Notification.permission !== "granted") return;
    void catchUpReminderIfNeeded(prefs);
    armLocalReminder(prefs, { catchUp: false });
  });
}

/** Wait until OneSignal SDK is ready (loaded deferred on Journey). */
export async function waitForOneSignal(timeoutMs = 8000): Promise<boolean> {
  if (!isOneSignalConfigured() || typeof window === "undefined") return false;
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const w = window as Window & {
      OneSignal?: { User?: { PushSubscription?: unknown } };
      OneSignalDeferred?: unknown[];
    };
    if (w.OneSignal?.User?.PushSubscription) return true;
    await new Promise((r) => setTimeout(r, 200));
  }
  return false;
}

/** Push reminder preference tags to OneSignal (for dashboard / Journey scheduling). */
export async function syncOneSignalReminderTags(prefs: ReminderPrefs): Promise<boolean> {
  if (!isOneSignalConfigured() || typeof window === "undefined") return false;
  const ready = await waitForOneSignal();
  if (!ready) return false;
  const w = window as Window & {
    OneSignal?: {
      User?: {
        addTags?: (tags: Record<string, string>) => Promise<void> | void;
        PushSubscription?: { optIn: () => Promise<void>; optOut: () => Promise<void> };
      };
    };
  };
  try {
    const os = w.OneSignal;
    if (!os?.User) return false;
    if (prefs.enabled) {
      await os.User.PushSubscription?.optIn();
    } else {
      await os.User.PushSubscription?.optOut();
    }
    const tz =
      typeof Intl !== "undefined"
        ? Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
        : "UTC";
    await os.User.addTags?.({
      reminder_enabled: prefs.enabled ? "1" : "0",
      reminder_hour: String(prefs.hour),
      reminder_minute: String(prefs.minute),
      reminder_tz: tz,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Ask the service worker to schedule (or clear) the next daily reminder.
 * Also arms a reliable in-page timer (Chrome no longer supports TimestampTrigger).
 */
export async function syncReminderSchedule(prefs?: ReminderPrefs): Promise<ScheduleResult> {
  const current = prefs ?? loadReminderPrefs();
  const at = nextReminderTimestamp(current.hour, current.minute);

  if (!current.enabled) {
    clearLocalReminderArm();
    const reg = await readyRegistration();
    reg?.active?.postMessage({ type: "REMINDER_CANCEL" });
    void syncOneSignalReminderTags(current);
    return { ok: true, mode: "deferred", at: 0 };
  }

  if (Notification.permission !== "granted") {
    return { ok: false, reason: "Notification permission is required." };
  }

  // Always arm local timer so reminders fire while the app is open / PWA is used.
  // Catch-up runs separately on visibility/load — not here (avoids instant notify on enable).
  armLocalReminder(current, { catchUp: false });
  void syncOneSignalReminderTags(current);

  const reg = await readyRegistration();
  if (!reg?.active) {
    return { ok: true, mode: "local", at };
  }

  const version =
    typeof window !== "undefined"
      ? window.location.pathname.split("/").filter(Boolean)[0] || "web"
      : "web";

  return new Promise((resolve) => {
    const channel = new MessageChannel();
    let settled = false;
    const finish = (result: ScheduleResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };
    const timer = setTimeout(() => {
      finish({ ok: true, mode: "local", at });
    }, 2000);

    channel.port1.onmessage = (event) => {
      const data = event.data as { ok?: boolean; mode?: string; reason?: string };
      if (data?.ok) {
        const mode =
          data.mode === "scheduled"
            ? "scheduled"
            : data.mode === "onesignal"
              ? "onesignal"
              : "local";
        finish({ ok: true, mode, at });
      } else {
        // Local timer already armed — still ok for the user.
        finish({ ok: true, mode: "local", at });
      }
    };

    reg.active!.postMessage(
      {
        type: "REMINDER_SCHEDULE",
        at,
        title: "Time with the Word",
        body: "A quiet moment is waiting — open Scripture when you’re ready.",
        url: `/${version}/`,
        hour: current.hour,
        minute: current.minute,
      },
      [channel.port2],
    );
  });
}
