const STORAGE_KEY = "bible-reminders";
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
  | { ok: true; mode: "scheduled" | "onesignal" | "deferred"; at: number }
  | { ok: false; reason: string };

async function readyRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.ready;
  } catch {
    return null;
  }
}

/**
 * Ask the service worker to schedule (or clear) the next daily reminder.
 * Uses Notification Triggers when the browser supports them.
 */
export async function syncReminderSchedule(prefs?: ReminderPrefs): Promise<ScheduleResult> {
  const current = prefs ?? loadReminderPrefs();
  const reg = await readyRegistration();
  if (!reg) {
    return { ok: false, reason: "Service worker not ready. Try again in a moment." };
  }

  if (!current.enabled) {
    reg.active?.postMessage({ type: "REMINDER_CANCEL" });
    return { ok: true, mode: "deferred", at: 0 };
  }

  if (Notification.permission !== "granted") {
    return { ok: false, reason: "Notification permission is required." };
  }

  const at = nextReminderTimestamp(current.hour, current.minute);
  const version =
    typeof window !== "undefined"
      ? window.location.pathname.split("/").filter(Boolean)[0] || "web"
      : "web";

  return new Promise((resolve) => {
    const channel = new MessageChannel();
    const timer = setTimeout(() => {
      resolve({
        ok: true,
        mode: "deferred",
        at,
      });
    }, 2500);

    channel.port1.onmessage = (event) => {
      clearTimeout(timer);
      const data = event.data as { ok?: boolean; mode?: string; reason?: string };
      if (data?.ok) {
        resolve({
          ok: true,
          mode: data.mode === "scheduled" ? "scheduled" : "deferred",
          at,
        });
      } else {
        resolve({
          ok: false,
          reason: data?.reason || "Could not schedule reminder.",
        });
      }
    };

    const worker = reg.active;
    if (!worker) {
      clearTimeout(timer);
      resolve({ ok: false, reason: "Service worker not active yet." });
      return;
    }

    worker.postMessage(
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
