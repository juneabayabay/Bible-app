/**
 * Clearer Bible listening via Web Speech API.
 * Picks a natural voice for the Bible version language (Tagalog, Spanish, …).
 */

import {
  listenCues,
  ttsLangPrefixes,
  voiceMatchesLanguage,
} from "./speechLang";

export type SpeakHandle = {
  cancel: () => void;
};

const voiceCache = new Map<string, SpeechSynthesisVoice | null>();
let voicesHooked = false;

function hookVoicesChanged() {
  if (typeof window === "undefined" || voicesHooked) return;
  voicesHooked = true;
  window.speechSynthesis.addEventListener("voiceschanged", () => {
    voiceCache.clear();
  });
}

function rankVoice(v: SpeechSynthesisVoice, language: string): number {
  const n = `${v.name} ${v.voiceURI}`.toLowerCase();
  let score = 0;
  if (voiceMatchesLanguage(v.lang, language)) score += 100;
  if (/neural|natural|premium|enhanced|online \(natural\)/i.test(n)) score += 50;
  if (/google/i.test(n)) score += 40;
  if (/microsoft/i.test(n)) score += 35;
  if (language === "tl" && /filipino|tagalog|fil-ph/i.test(n)) score += 60;
  if (language === "es" && /sabina|jorge|paulina|alonso|dalia/i.test(n)) score += 20;
  if (language === "en" && /samantha|karen|moira|aria|jenny|sonia/i.test(n)) score += 20;
  if (v.localService) score += 8;
  if (/compact|eloquence|zarvox|novelty|funny|robot|whisper/i.test(n)) score -= 40;
  return score;
}

/** Prefer a clear voice in `language`; fall back to English, then any voice. */
export function pickBibleVoice(language = "en"): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  hookVoicesChanged();
  if (voiceCache.has(language)) return voiceCache.get(language) ?? null;

  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) {
    voiceCache.set(language, null);
    return null;
  }

  const primary = voices.filter((v) => voiceMatchesLanguage(v.lang, language));
  const fallbackEn =
    language !== "en" ? voices.filter((v) => voiceMatchesLanguage(v.lang, "en")) : [];
  const pool = primary.length ? primary : fallbackEn.length ? fallbackEn : voices;

  const sorted = [...pool].sort(
    (a, b) => rankVoice(b, language) - rankVoice(a, language),
  );
  const best = sorted[0] ?? null;
  voiceCache.set(language, best);
  return best;
}

/** Warm up voice list (Chrome loads voices async). */
export function warmSpeechVoices(language = "en") {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  hookVoicesChanged();
  void window.speechSynthesis.getVoices();
  pickBibleVoice(language);
}

/** True when the device has a voice for this language (not just English fallback). */
export function hasNativeVoiceFor(language: string): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return false;
  return voices.some((v) => voiceMatchesLanguage(v.lang, language));
}

function applyVoice(utter: SpeechSynthesisUtterance, language: string) {
  const voice = pickBibleVoice(language);
  const prefixes = ttsLangPrefixes(language);
  if (voice) {
    utter.voice = voice;
    utter.lang = voice.lang || `${prefixes[0]}-${(prefixes[0] || "en").toUpperCase()}`;
  } else {
    utter.lang = language === "tl" ? "fil-PH" : speechFallbackLang(language);
  }
  // Slightly slower for non-English clarity
  utter.rate = language === "en" ? 0.88 : 0.86;
  utter.pitch = 0.97;
  utter.volume = 1;
}

function speechFallbackLang(language: string): string {
  const map: Record<string, string> = {
    en: "en-US",
    tl: "fil-PH",
    es: "es-ES",
    fr: "fr-FR",
    de: "de-DE",
    pt: "pt-BR",
    zh: "zh-CN",
    ru: "ru-RU",
    it: "it-IT",
  };
  return map[language] || "en-US";
}

function speakOnce(
  text: string,
  language: string,
): Promise<"end" | "error" | "cancel"> {
  return new Promise((resolve) => {
    const utter = new SpeechSynthesisUtterance(text);
    applyVoice(utter, language);
    let done = false;
    const finish = (result: "end" | "error" | "cancel") => {
      if (done) return;
      done = true;
      resolve(result);
    };
    utter.onend = () => finish("end");
    utter.onerror = (ev) => {
      const err = (ev as SpeechSynthesisErrorEvent).error;
      finish(err === "interrupted" || err === "canceled" ? "cancel" : "error");
    };
    window.speechSynthesis.speak(utter);
  });
}

function pause(ms: number, cancelled: () => boolean): Promise<void> {
  return new Promise((resolve) => {
    const t = window.setTimeout(() => resolve(), ms);
    const poll = window.setInterval(() => {
      if (cancelled()) {
        window.clearTimeout(t);
        window.clearInterval(poll);
        resolve();
      }
    }, 50);
    window.setTimeout(() => window.clearInterval(poll), ms + 60);
  });
}

/** Single verse: short reference, then the text. */
export function speakBibleVerse(opts: {
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
  language?: string;
  onDone?: () => void;
}): SpeakHandle {
  const language = opts.language || "en";
  const cues = listenCues(language);
  let cancelled = false;
  const run = async () => {
    warmSpeechVoices(language);
    await pause(80, () => cancelled);
    if (cancelled) {
      opts.onDone?.();
      return;
    }
    const intro = `${opts.bookName}, ${cues.chapter} ${opts.chapter}, ${cues.verse} ${opts.verse}.`;
    const body = opts.text.trim();
    const r1 = await speakOnce(intro, language);
    if (cancelled || r1 !== "end") {
      if (!cancelled) opts.onDone?.();
      return;
    }
    await pause(280, () => cancelled);
    if (cancelled) {
      opts.onDone?.();
      return;
    }
    await speakOnce(body, language);
    if (!cancelled) opts.onDone?.();
  };
  void run();
  return {
    cancel() {
      cancelled = true;
      try {
        window.speechSynthesis.cancel();
      } catch {
        /* ignore */
      }
    },
  };
}

/**
 * Whole chapter: announce book/chapter once, then verse numbers lightly,
 * with short pauses so it feels less like a machine gun.
 */
export function speakBibleChapter(opts: {
  bookName: string;
  chapter: number;
  verses: Array<{ number: number; text: string }>;
  language?: string;
  onVerse?: (n: number | null) => void;
  onDone?: () => void;
}): SpeakHandle {
  const language = opts.language || "en";
  const cues = listenCues(language);
  let cancelled = false;
  const run = async () => {
    warmSpeechVoices(language);
    await pause(80, () => cancelled);
    if (cancelled) return;

    const open = `${opts.bookName}, ${cues.chapter} ${opts.chapter}.`;
    const r0 = await speakOnce(open, language);
    if (cancelled || r0 !== "end") {
      opts.onDone?.();
      return;
    }
    await pause(420, () => cancelled);
    if (cancelled) {
      opts.onDone?.();
      return;
    }

    for (let i = 0; i < opts.verses.length; i++) {
      if (cancelled) break;
      const v = opts.verses[i];
      opts.onVerse?.(v.number);

      const line = `${cues.verse} ${v.number}. ${v.text.trim()}`;
      const result = await speakOnce(line, language);
      if (cancelled || result !== "end") break;

      const gap = (i + 1) % 5 === 0 ? 520 : 320;
      if (i < opts.verses.length - 1) {
        await pause(gap, () => cancelled);
      }
    }

    opts.onVerse?.(null);
    if (!cancelled) opts.onDone?.();
  };
  void run();
  return {
    cancel() {
      cancelled = true;
      try {
        window.speechSynthesis.cancel();
      } catch {
        /* ignore */
      }
    },
  };
}
