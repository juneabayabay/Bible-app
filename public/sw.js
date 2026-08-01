/* Bible app — offline shell cache + daily reminder scheduling */
const CACHE = "bible-shell-v3";
const PRECACHE = [
  "/",
  "/manifest.webmanifest",
  "/icons/icon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
  "/favicon.svg",
];
const REMINDER_TAG = "bible-daily-reminder";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

function isCacheableGet(request) {
  if (request.method !== "GET") return false;
  const url = new URL(request.url);
  // Same-origin only. Let Hugging Face / CDN / speech models bypass the SW.
  if (url.origin !== self.location.origin) return false;
  if (url.pathname.startsWith("/search/")) return false;
  // Transformers / ONNX chunks must always hit the network or browser cache.
  if (url.pathname.includes("transformers") || url.pathname.includes("onnx")) return false;
  return true;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (!isCacheableGet(request)) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match("/")),
        ),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});

async function clearReminderNotifications() {
  try {
    const list = await self.registration.getNotifications({
      tag: REMINDER_TAG,
      includeTriggered: true,
    });
    for (const n of list) n.close();
  } catch {
    const list = await self.registration.getNotifications({ tag: REMINDER_TAG });
    for (const n of list) n.close();
  }
}

function nextOccurrence(hour, minute) {
  const h = typeof hour === "number" ? hour : 7;
  const m = typeof minute === "number" ? minute : 0;
  const now = new Date();
  const next = new Date(now);
  next.setSeconds(0, 0);
  next.setHours(h, m, 0, 0);
  if (next.getTime() <= now.getTime() + 15_000) {
    next.setDate(next.getDate() + 1);
  }
  return next.getTime();
}

async function scheduleReminder(payload) {
  const { at, title, body, url, hour, minute } = payload;
  await clearReminderNotifications();

  const options = {
    tag: REMINDER_TAG,
    body: body || "A quiet moment is waiting.",
    icon: "/icons/icon.svg",
    badge: "/icons/icon.svg",
    data: {
      url: url || "/",
      title: title || "Time with the Word",
      body: body || "A quiet moment is waiting.",
      hour,
      minute,
    },
    renotify: true,
  };

  if (typeof TimestampTrigger !== "undefined") {
    options.showTrigger = new TimestampTrigger(at);
    await self.registration.showNotification(title || "Time with the Word", options);
    return { ok: true, mode: "scheduled" };
  }

  return {
    ok: true,
    mode: "deferred",
    reason: "This browser schedules reminders when you open the app.",
  };
}

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || typeof data !== "object") return;

  const reply = (result) => {
    if (event.ports && event.ports[0]) event.ports[0].postMessage(result);
  };

  if (data.type === "REMINDER_CANCEL") {
    event.waitUntil(
      clearReminderNotifications()
        .then(() => reply({ ok: true, mode: "cancelled" }))
        .catch((err) => reply({ ok: false, reason: String(err) })),
    );
    return;
  }

  if (data.type === "REMINDER_SCHEDULE") {
    event.waitUntil(
      scheduleReminder(data)
        .then((result) => reply(result))
        .catch((err) => reply({ ok: false, reason: String(err) })),
    );
  }
});

function safeAppUrl(candidate) {
  try {
    const base = self.location.origin;
    const url = new URL(candidate || "/", base);
    if (url.origin !== base) return "/";
    return url.pathname + url.search + url.hash;
  } catch (_) {
    return "/";
  }
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const target = safeAppUrl(data.url || "/");

  event.waitUntil(
    (async () => {
      if (event.notification.tag === REMINDER_TAG && typeof TimestampTrigger !== "undefined") {
        try {
          await scheduleReminder({
            at: nextOccurrence(data.hour, data.minute),
            title: data.title,
            body: data.body,
            url: target,
            hour: data.hour,
            minute: data.minute,
          });
        } catch (_) {
          /* ignore reschedule errors */
        }
      }

      const clientList = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(target);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
    })(),
  );
});

// After a triggered notification fires, the page/SW can be asked to schedule the next day
// when the user opens the app again (handled in reminders.ts).
self.addEventListener("push", (event) => {
  let title = "Time with the Word";
  let body = "A quiet moment is waiting — open Scripture when you’re ready.";
  let url = "/";
  try {
    if (event.data) {
      const payload = event.data.json();
      title = payload.title || title;
      body = payload.body || body;
      url = safeAppUrl(payload.url || url);
    }
  } catch (_) {
    try {
      body = event.data.text();
    } catch (__) {
      /* ignore */
    }
  }
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icons/icon.svg",
      tag: REMINDER_TAG,
      data: { url },
    }),
  );
});
