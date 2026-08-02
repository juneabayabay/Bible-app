/**
 * Clearer, less monotonous Bible listening via Web Speech API.
 * Picks a natural English voice when available; softens chapter pacing.
 */

export type SpeakHandle = {
  cancel: () => void;
};

let cachedVoice: SpeechSynthesisVoice | null | undefined;
let voicesHooked = false;

function hookVoicesChanged() {
  if (typeof window === "undefined" || voicesHooked) return;
  voicesHooked = true;
  window.speechSynthesis.addEventListener("voiceschanged", () => {
    cachedVoice = undefined;
  });
}

/** Prefer warm, clear English voices; skip novelty / compressed names. */
export function pickBibleVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  hookVoicesChanged();
  if (cachedVoice !== undefined) return cachedVoice;

  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) {
    cachedVoice = null;
    return null;
  }

  const en = voices.filter((v) => /^en([-_]|$)/i.test(v.lang));
  const pool = en.length ? en : voices;

  const rank = (v: SpeechSynthesisVoice): number => {
    const n = `${v.name} ${v.voiceURI}`.toLowerCase();
    let score = 0;
    if (/neural|natural|premium|enhanced|online \(natural\)/i.test(n)) score += 50;
    if (/google/i.test(n)) score += 40;
    if (/microsoft.*(aria|jenny|guy|sara|sonia|ryan)/i.test(n)) score += 38;
    if (/samantha|karen|moira|daniel|martha|rishi|serena/i.test(n)) score += 35;
    if (/siri|premium/i.test(n)) score += 30;
    if (v.localService) score += 8;
    if (/en-us/i.test(v.lang)) score += 6;
    if (/en-gb|en-au|en-in/i.test(v.lang)) score += 4;
    if (/compact|eloquence|whisper|zarvox|bad|novelty|funny|robot/i.test(n)) score -= 40;
    return score;
  };

  const sorted = [...pool].sort((a, b) => rank(b) - rank(a));
  cachedVoice = sorted[0] ?? null;
  return cachedVoice;
}

/** Warm up voice list (Chrome loads voices async). */
export function warmSpeechVoices() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  hookVoicesChanged();
  void window.speechSynthesis.getVoices();
  pickBibleVoice();
}

function applyVoice(utter: SpeechSynthesisUtterance) {
  const voice = pickBibleVoice();
  if (voice) {
    utter.voice = voice;
    utter.lang = voice.lang || "en-US";
  } else {
    utter.lang = "en-US";
  }
  // Slightly slower + soft pitch = clearer, less “lecture robot”
  utter.rate = 0.88;
  utter.pitch = 0.97;
  utter.volume = 1;
}

function speakOnce(text: string): Promise<"end" | "error" | "cancel"> {
  return new Promise((resolve) => {
    const utter = new SpeechSynthesisUtterance(text);
    applyVoice(utter);
    let done = false;
    const finish = (result: "end" | "error" | "cancel") => {
      if (done) return;
      done = true;
      resolve(result);
    };
    utter.onend = () => finish("end");
    utter.onerror = (ev) => {
      // "interrupted" / "canceled" when user hits Stop
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
  onDone?: () => void;
}): SpeakHandle {
  let cancelled = false;
  const run = async () => {
    warmSpeechVoices();
    // Brief breath so Chrome actually applies the chosen voice
    await pause(80, () => cancelled);
    if (cancelled) {
      opts.onDone?.();
      return;
    }
    const intro = `${opts.bookName}, chapter ${opts.chapter}, verse ${opts.verse}.`;
    const body = opts.text.trim();
    const r1 = await speakOnce(intro);
    if (cancelled || r1 !== "end") {
      if (!cancelled) opts.onDone?.();
      return;
    }
    await pause(280, () => cancelled);
    if (cancelled) {
      opts.onDone?.();
      return;
    }
    await speakOnce(body);
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
  onVerse?: (n: number | null) => void;
  onDone?: () => void;
}): SpeakHandle {
  let cancelled = false;
  const run = async () => {
    warmSpeechVoices();
    await pause(80, () => cancelled);
    if (cancelled) return;

    const open = `${opts.bookName}, chapter ${opts.chapter}.`;
    const r0 = await speakOnce(open);
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

      // Every verse: soft number + text (clear navigation without shouting the book each time)
      const line = `Verse ${v.number}. ${v.text.trim()}`;
      const result = await speakOnce(line);
      if (cancelled || result !== "end") break;

      // Slightly longer breath between verses; a bit more after every 5th
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
