/**
 * Voice transcription for verse search.
 *
 * Priority:
 * 1) Browser SpeechRecognition (Chrome / Edge / Safari / installed PWA) — fast
 * 2) On-device Whisper when Google speech is unavailable (Cursor preview, etc.)
 *
 * Whisper is cached after first download so installed PWAs can reuse it offline.
 */

/** Bump when voice logic changes — shown in the mic hint so you can confirm a refresh. */
export const VOICE_ENGINE = "v3";

type AsrPipeline = (
  input: string | Float32Array,
  options?: Record<string, unknown>,
) => Promise<{ text?: string } | { text?: string }[]>;

// Multilingual tiny accepts language/task; *.en throws if those are set in config.
const MODEL_ID = "Xenova/whisper-tiny";

let asrPromise: Promise<AsrPipeline> | null = null;

/** True when Chrome’s cloud speech API is known-broken (not real Chrome/Edge/Safari). */
export function chromeSpeechLikelyBroken(): boolean {
  if (typeof navigator === "undefined") return true;
  const ua = navigator.userAgent;
  if (/Electron|VSCode|Cursor/i.test(ua)) return true;
  return false;
}

export function hasBrowserSpeech(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as unknown as {
    SpeechRecognition?: unknown;
    webkitSpeechRecognition?: unknown;
  };
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
}

export function hasMicrophone(): boolean {
  return typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
}

async function getAsr(): Promise<AsrPipeline> {
  if (!asrPromise) {
    asrPromise = (async () => {
      const { pipeline, env } = await import("@huggingface/transformers");
      env.allowLocalModels = false;
      env.useBrowserCache = true;

      try {
        const asr = await pipeline("automatic-speech-recognition", MODEL_ID, {
          dtype: "q8",
          session_options: { graphOptimizationLevel: "basic" },
        });
        return asr as unknown as AsrPipeline;
      } catch {
        const asr = await pipeline("automatic-speech-recognition", MODEL_ID, {
          dtype: "fp32",
        });
        return asr as unknown as AsrPipeline;
      }
    })().catch((err) => {
      asrPromise = null;
      throw err;
    });
  }
  return asrPromise;
}

function pickMimeType(): string {
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  for (const t of types) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) {
      return t;
    }
  }
  return "";
}

export type LocalVoiceSession = {
  stop: () => Promise<string>;
  cancel: () => void;
};

export async function startLocalRecording(
  onReady: () => void,
  maxMs = 4000,
  onAutoStop?: () => void,
): Promise<LocalVoiceSession> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("Microphone isn’t available in this browser.");
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      channelCount: 1,
    },
  });

  const mimeType = pickMimeType();
  const recorder = mimeType
    ? new MediaRecorder(stream, { mimeType })
    : new MediaRecorder(stream);
  const chunks: BlobPart[] = [];

  recorder.ondataavailable = (ev) => {
    if (ev.data.size > 0) chunks.push(ev.data);
  };

  let finished: ((blob: Blob) => void) | null = null;
  const blobPromise = new Promise<Blob>((resolve) => {
    finished = resolve;
  });

  let autoStopped = false;

  recorder.onstop = () => {
    stream.getTracks().forEach((t) => t.stop());
    const type = recorder.mimeType || mimeType || "audio/webm";
    finished?.(new Blob(chunks, { type }));
    if (autoStopped) onAutoStop?.();
  };

  recorder.start(120);
  onReady();

  let autoTimer: ReturnType<typeof setTimeout> | null = window.setTimeout(() => {
    autoTimer = null;
    if (recorder.state === "recording") {
      autoStopped = true;
      recorder.stop();
    }
  }, maxMs);

  let cancelled = false;

  return {
    cancel() {
      cancelled = true;
      autoStopped = false;
      if (autoTimer) clearTimeout(autoTimer);
      try {
        if (recorder.state === "recording") recorder.stop();
        else stream.getTracks().forEach((t) => t.stop());
      } catch {
        /* ignore */
      }
    },
    async stop() {
      autoStopped = false;
      if (autoTimer) clearTimeout(autoTimer);
      if (recorder.state === "recording") {
        recorder.stop();
      }
      const blob = await blobPromise;
      if (cancelled) return "";
      if (blob.size < 600) {
        throw new Error("No speech heard. Tap the mic and speak clearly.");
      }
      return transcribeBlob(blob);
    },
  };
}

export async function transcribeBlob(blob: Blob): Promise<string> {
  const asr = await getAsr();
  const url = URL.createObjectURL(blob);
  try {
    // Multilingual model — language/task are valid here.
    // Also try a bare call if the first path fails (older cached configs).
    let result: { text?: string } | { text?: string }[];
    try {
      result = await asr(url, { language: "english", task: "transcribe" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/English-only|language|task/i.test(msg)) {
        result = await asr(url);
      } else {
        throw err;
      }
    }
    const text = Array.isArray(result) ? result[0]?.text : result?.text;
    return (text || "").trim();
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function warmLocalVoice(): void {
  void getAsr().catch(() => {
    asrPromise = null;
  });
}
