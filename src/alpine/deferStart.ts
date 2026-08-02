import type { Alpine } from "alpinejs";

/**
 * Astro’s Alpine integration calls setup() then Alpine.start() on DOMContentLoaded
 * without awaiting async work. On heavy routes we briefly defer start() until
 * lazy chunks register their Alpine.data components.
 */
export function deferAlpineStart(Alpine: Alpine, prepare: () => Promise<void>): void {
  const originalStart = Alpine.start.bind(Alpine);
  let ready = false;
  let queued = false;

  Alpine.start = (() => {
    if (!ready) {
      queued = true;
      return;
    }
    originalStart();
  }) as typeof Alpine.start;

  void prepare()
    .catch((err) => {
      console.error("[bible] Failed to load page features", err);
    })
    .finally(() => {
      ready = true;
      Alpine.start = originalStart;
      if (queued || document.readyState !== "loading") {
        originalStart();
      }
    });
}

export function pathNeedsGames(pathname: string): boolean {
  return /\/play(\/|$)/.test(pathname);
}

export function pathNeedsPrayer(pathname: string): boolean {
  if (/\/prayer(\/|$)/.test(pathname)) return true;
  // Version home: /web or /web/
  const parts = pathname.replace(/\/+$/, "").split("/").filter(Boolean);
  return parts.length === 1;
}
