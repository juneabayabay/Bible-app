const DISMISS_KEY = "bible-install-dismissed";
const SESSION_HIDE_KEY = "bible-install-session-hide";
const JUST_INSTALLED_KEY = "bible-install-just-done";

export type InstallPlatform = "ios" | "android" | "desktop" | "other";

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let listenersBound = false;

export function isAppInstalled(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  if (nav.standalone) return true;
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  if (window.matchMedia("(display-mode: fullscreen)").matches) return true;
  if (window.matchMedia("(display-mode: minimal-ui)").matches) return true;
  return false;
}

export function detectInstallPlatform(): InstallPlatform {
  if (typeof window === "undefined") return "other";
  const ua = window.navigator.userAgent || "";
  const iOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
  if (iOS) return "ios";
  if (/Android/i.test(ua)) return "android";
  if (/Windows|Macintosh|Linux/i.test(ua) && !/Mobile/i.test(ua)) return "desktop";
  return "other";
}

/** Facebook, Instagram, etc. — no native PWA install prompt. */
export function isLikelyInAppBrowser(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent || "";
  if (/FBAN|FBAV|FB_IAB|Instagram|Line\/|Twitter|WhatsApp|Snapchat|TikTok|Bytedance|MicroMessenger/i.test(ua)) {
    return true;
  }
  // Android WebView
  if (/Android/i.test(ua) && (/; wv\)/.test(ua) || /\bwv\b/.test(ua))) return true;
  return false;
}

/**
 * Browsers that can fire beforeinstallprompt (Chrome / Edge / Samsung / Opera).
 * Others should not show a fake “Install” button.
 */
export function browserMaySupportInstallPrompt(): boolean {
  if (typeof window === "undefined") return false;
  if (isLikelyInAppBrowser()) return false;
  const ua = window.navigator.userAgent || "";
  if (/Firefox|FxiOS/i.test(ua)) return false;
  // iOS Chrome still cannot one-tap install like Android
  if (/iPhone|iPad|iPod/i.test(ua)) return false;
  return /Chrome\/|Edg\/|OPR\/|SamsungBrowser/i.test(ua);
}

/** Open the same page in Chrome on Android when stuck in an in-app browser. */
export function openInChromeAndroid(url = typeof location !== "undefined" ? location.href : ""): boolean {
  if (typeof window === "undefined" || !url) return false;
  try {
    const u = new URL(url);
    const intent =
      `intent://${u.host}${u.pathname}${u.search}${u.hash}` +
      `#Intent;scheme=https;package=com.android.chrome;` +
      `S.browser_fallback_url=${encodeURIComponent(url)};end`;
    window.location.href = intent;
    return true;
  } catch {
    return false;
  }
}

export function markJustInstalled() {
  try {
    sessionStorage.setItem(JUST_INSTALLED_KEY, "1");
  } catch {
    /* ignore */
  }
}

/** True once after a successful install in this tab session. */
export function consumeJustInstalledTip(): boolean {
  try {
    if (sessionStorage.getItem(JUST_INSTALLED_KEY) === "1") {
      sessionStorage.removeItem(JUST_INSTALLED_KEY);
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

export function isInstallDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

export function isInstallHiddenThisSession(): boolean {
  try {
    return sessionStorage.getItem(SESSION_HIDE_KEY) === "1";
  } catch {
    return false;
  }
}

export function hideInstallForSession() {
  try {
    sessionStorage.setItem(SESSION_HIDE_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function dismissInstallPrompt() {
  try {
    localStorage.setItem(DISMISS_KEY, "1");
  } catch {
    /* ignore */
  }
}

/** Call once at app boot so Chrome’s install event is not lost. */
export function bindInstallPromptCapture() {
  if (typeof window === "undefined" || listenersBound) return;
  listenersBound = true;

  // Pick up prompt captured by the early <head> script (before Alpine loads).
  const early = (window as unknown as { __bibleDeferredInstall?: BeforeInstallPromptEvent | null })
    .__bibleDeferredInstall;
  if (early) {
    deferredPrompt = early;
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    (
      window as unknown as { __bibleDeferredInstall?: BeforeInstallPromptEvent | null }
    ).__bibleDeferredInstall = deferredPrompt;
    window.dispatchEvent(new CustomEvent("bible-install-available"));
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    (
      window as unknown as { __bibleDeferredInstall?: BeforeInstallPromptEvent | null }
    ).__bibleDeferredInstall = null;
    markJustInstalled();
    dismissInstallPrompt();
    window.dispatchEvent(new CustomEvent("bible-app-installed"));
  });
}

export function getDeferredInstallPrompt(): BeforeInstallPromptEvent | null {
  if (deferredPrompt) return deferredPrompt;
  if (typeof window === "undefined") return null;
  const early = (window as unknown as { __bibleDeferredInstall?: BeforeInstallPromptEvent | null })
    .__bibleDeferredInstall;
  if (early) {
    deferredPrompt = early;
    return early;
  }
  return null;
}

export function clearDeferredInstallPrompt() {
  deferredPrompt = null;
  if (typeof window !== "undefined") {
    (
      window as unknown as { __bibleDeferredInstall?: BeforeInstallPromptEvent | null }
    ).__bibleDeferredInstall = null;
  }
}

/** Wait until Chrome fires beforeinstallprompt (or timeout). */
export function waitForDeferredInstallPrompt(timeoutMs = 2800): Promise<BeforeInstallPromptEvent | null> {
  const existing = getDeferredInstallPrompt();
  if (existing) return Promise.resolve(existing);
  if (typeof window === "undefined") return Promise.resolve(null);

  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.removeEventListener("bible-install-available", onAvail);
      window.clearTimeout(timer);
      resolve(getDeferredInstallPrompt());
    };
    const onAvail = () => finish();
    const timer = window.setTimeout(finish, timeoutMs);
    window.addEventListener("bible-install-available", onAvail);
  });
}

export function shouldShowInstallBanner(): boolean {
  if (isAppInstalled()) return false;
  if (isInstallDismissed()) return false;
  if (isInstallHiddenThisSession()) return false;
  return true;
}
