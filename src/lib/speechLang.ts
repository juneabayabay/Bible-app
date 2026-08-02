/**
 * Map app Bible language codes → speech recognition / TTS / Whisper.
 */

export type ListenCues = {
  chapter: string;
  verse: string;
};

const SPEECH_REC: Record<string, string> = {
  en: "en-US",
  tl: "fil-PH",
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE",
  pt: "pt-BR",
  zh: "zh-CN",
  ru: "ru-RU",
  uk: "uk-UA",
  it: "it-IT",
  ro: "ro-RO",
  nl: "nl-NL",
  nb: "nb-NO",
  sv: "sv-SE",
  da: "da-DK",
  cs: "cs-CZ",
  hu: "hu-HU",
  pl: "pl-PL",
  ar: "ar-SA",
  vi: "vi-VN",
  eo: "eo",
  la: "la",
  gr: "el-GR",
  he: "he-IL",
};

/** BCP-47 tags / prefixes to match SpeechSynthesisVoice.lang */
const TTS_PREFIXES: Record<string, string[]> = {
  en: ["en"],
  tl: ["fil", "tl"],
  es: ["es"],
  fr: ["fr"],
  de: ["de"],
  pt: ["pt"],
  zh: ["zh", "cmn"],
  ru: ["ru"],
  uk: ["uk"],
  it: ["it"],
  ro: ["ro"],
  nl: ["nl"],
  nb: ["nb", "no"],
  sv: ["sv"],
  da: ["da"],
  cs: ["cs"],
  hu: ["hu"],
  pl: ["pl"],
  ar: ["ar"],
  vi: ["vi"],
  eo: ["eo"],
  la: ["la"],
  gr: ["el"],
  he: ["he", "iw"],
};

const WHISPER_LANG: Record<string, string> = {
  en: "english",
  tl: "tagalog",
  es: "spanish",
  fr: "french",
  de: "german",
  pt: "portuguese",
  zh: "chinese",
  ru: "russian",
  uk: "ukrainian",
  it: "italian",
  ro: "romanian",
  nl: "dutch",
  nb: "norwegian",
  sv: "swedish",
  da: "danish",
  cs: "czech",
  hu: "hungarian",
  pl: "polish",
  ar: "arabic",
  vi: "vietnamese",
  la: "latin",
  gr: "greek",
  he: "hebrew",
};

const CUES: Record<string, ListenCues> = {
  en: { chapter: "chapter", verse: "verse" },
  tl: { chapter: "kabanata", verse: "talata" },
  es: { chapter: "capítulo", verse: "versículo" },
  fr: { chapter: "chapitre", verse: "verset" },
  de: { chapter: "Kapitel", verse: "Vers" },
  pt: { chapter: "capítulo", verse: "versículo" },
  it: { chapter: "capitolo", verse: "versetto" },
  zh: { chapter: "章", verse: "节" },
  ru: { chapter: "глава", verse: "стих" },
  uk: { chapter: "розділ", verse: "вірш" },
  nl: { chapter: "hoofdstuk", verse: "vers" },
  pl: { chapter: "rozdział", verse: "werset" },
  vi: { chapter: "chương", verse: "câu" },
  ar: { chapter: "إصحاح", verse: "آية" },
  he: { chapter: "פרק", verse: "פסוק" },
  gr: { chapter: "κεφάλαιο", verse: "εδάφιο" },
  la: { chapter: "caput", verse: "versus" },
};

const MIC_EXAMPLE: Record<string, string> = {
  en: "John 3 16",
  tl: "Juan 3 16",
  es: "Juan 3 16",
  fr: "Jean 3 16",
  de: "Johannes 3 16",
  pt: "João 3 16",
  it: "Giovanni 3 16",
  zh: "约翰 3 16",
  ru: "Иоанна 3 16",
  nl: "Johannes 3 16",
  pl: "Jana 3 16",
  vi: "Giăng 3 16",
  uk: "Івана 3 16",
};

export function speechRecognitionLang(language: string): string {
  return SPEECH_REC[language] || "en-US";
}

/** Alternate recognition langs to retry (e.g. fil-PH → tl-PH → en-US). */
export function speechRecognitionLangFallbacks(language: string): string[] {
  if (language === "tl") return ["fil-PH", "tl-PH", "en-PH", "en-US"];
  if (language === "zh") return ["zh-CN", "zh-TW", "cmn-Hans-CN"];
  if (language === "pt") return ["pt-BR", "pt-PT"];
  if (language === "es") return ["es-ES", "es-MX", "es-US"];
  return [speechRecognitionLang(language)];
}

export function ttsLangPrefixes(language: string): string[] {
  return TTS_PREFIXES[language] || ["en"];
}

export function whisperLanguageName(language: string): string | undefined {
  return WHISPER_LANG[language];
}

export function listenCues(language: string): ListenCues {
  return CUES[language] || CUES.en!;
}

export function micExamplePhrase(language: string): string {
  return MIC_EXAMPLE[language] || MIC_EXAMPLE.en!;
}

export function voiceMatchesLanguage(voiceLang: string, language: string): boolean {
  const prefixes = ttsLangPrefixes(language);
  const lower = (voiceLang || "").toLowerCase().replace(/_/g, "-");
  return prefixes.some((p) => lower === p || lower.startsWith(`${p}-`));
}
