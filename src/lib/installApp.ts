const DISMISS_KEY = "bible-install-dismissed";
const SESSION_HIDE_KEY = "bible-install-session-hide";

export type InstallPlatform = "ios" | "android" | "desktop" | "other";

type BeforeInstallPromptEvent = Event & {
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

export function getDeferredInstallPrompt(): BeforeInstallPromptEvent | null {
  return deferredPrompt;
}

export function clearDeferredInstallPrompt() {
  deferredPrompt = null;
}

/** Call once at app boot so Chrome’s install event is not lost. */
export function bindInstallPromptCapture() {
  if (typeof window === "undefined" || listenersBound) return;
  listenersBound = true;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    window.dispatchEvent(new CustomEvent("bible-install-available"));
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    dismissInstallPrompt();
    window.dispatchEvent(new CustomEvent("bible-app-installed"));
  });
}

export function shouldShowInstallBanner(): boolean {
  if (isAppInstalled()) return false;
  if (isInstallDismissed()) return false;
  if (isInstallHiddenThisSession()) return false;
  return true;
}
