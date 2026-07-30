export type VersionId = string;

export type BibleVersion = {
  id: VersionId;
  label: string;
  shortLabel: string;
  language: string;
  languageName: string;
  description: string;
  /** Filename under src/data without .json when different from id */
  file?: string;
};

/** Free / public-domain (or freely redistributable) editions only. */
export const VERSIONS: Record<string, BibleVersion> = {
  // English
  web: {
    id: "web",
    label: "English · WEB",
    shortLabel: "WEB",
    language: "en",
    languageName: "English",
    description: "World English Bible (public domain)",
  },
  kjv: {
    id: "kjv",
    label: "English · KJV",
    shortLabel: "KJV",
    language: "en",
    languageName: "English",
    description: "King James Version (public domain)",
  },
  asv: {
    id: "asv",
    label: "English · ASV",
    shortLabel: "ASV",
    language: "en",
    languageName: "English",
    description: "American Standard Version 1901 (public domain)",
  },
  dra: {
    id: "dra",
    label: "English · Douay-Rheims",
    shortLabel: "DRA",
    language: "en",
    languageName: "English",
    description: "Douay-Rheims American Edition 1899 (public domain)",
  },
  geneva1599: {
    id: "geneva1599",
    label: "English · Geneva 1599",
    shortLabel: "Geneva",
    language: "en",
    languageName: "English",
    description: "Geneva Bible 1599 (public domain)",
  },

  // Filipino
  tl: {
    id: "tl",
    label: "Tagalog · ADB 1905",
    shortLabel: "Tagalog",
    language: "tl",
    languageName: "Tagalog",
    description: "Ang Dating Biblia 1905 (public domain)",
    file: "tl-adb1905",
  },

  // Spanish
  "es-rvr": {
    id: "es-rvr",
    label: "Español · Reina-Valera",
    shortLabel: "RVR",
    language: "es",
    languageName: "Spanish",
    description: "Reina-Valera (public domain)",
  },

  // French
  lsg: {
    id: "lsg",
    label: "Français · Louis Segond 1910",
    shortLabel: "LSG",
    language: "fr",
    languageName: "French",
    description: "Louis Segond 1910 (public domain)",
  },
  "darby-fr": {
    id: "darby-fr",
    label: "Français · Darby",
    shortLabel: "Darby FR",
    language: "fr",
    languageName: "French",
    description: "Bible Darby Française 1885 (public domain)",
  },
  martin1744: {
    id: "martin1744",
    label: "Français · Martin 1744",
    shortLabel: "Martin",
    language: "fr",
    languageName: "French",
    description: "Bible David Martin 1744 (public domain)",
  },

  // German
  luth1912: {
    id: "luth1912",
    label: "Deutsch · Luther 1912",
    shortLabel: "Luther",
    language: "de",
    languageName: "German",
    description: "Lutherbibel 1912 (public domain)",
  },
  elb1905: {
    id: "elb1905",
    label: "Deutsch · Elberfelder 1905",
    shortLabel: "Elberfelder",
    language: "de",
    languageName: "German",
    description: "Elberfelder Bibel 1905 (public domain)",
  },

  // Portuguese
  "almeida-livre": {
    id: "almeida-livre",
    label: "Português · Almeida Livre",
    shortLabel: "Almeida",
    language: "pt",
    languageName: "Portuguese",
    description: "Almeida 1819 / Bíblia Livre (public domain)",
  },

  // Chinese
  cuv: {
    id: "cuv",
    label: "中文 · 和合本 (繁體)",
    shortLabel: "CUV",
    language: "zh",
    languageName: "Chinese",
    description: "Chinese Union Version Traditional 1919 (public domain)",
  },
  cuvs: {
    id: "cuvs",
    label: "中文 · 和合本 (简体)",
    shortLabel: "CUVS",
    language: "zh",
    languageName: "Chinese",
    description: "Chinese Union Version Simplified 1919 (public domain)",
  },

  // Russian / Ukrainian / etc.
  synodal: {
    id: "synodal",
    label: "Русский · Синодальный",
    shortLabel: "Synodal",
    language: "ru",
    languageName: "Russian",
    description: "Russian Synodal Translation 1876 (public domain)",
  },
  kp: {
    id: "kp",
    label: "Українська · Куліш-Пулюй",
    shortLabel: "KP",
    language: "uk",
    languageName: "Ukrainian",
    description: "Kulish-Puliui 1905 (public domain)",
  },

  // Romance / European
  diodati: {
    id: "diodati",
    label: "Italiano · Diodati 1649",
    shortLabel: "Diodati",
    language: "it",
    languageName: "Italian",
    description: "Bibbia Diodati 1649 (public domain)",
  },
  riveduta: {
    id: "riveduta",
    label: "Italiano · Riveduta 1927",
    shortLabel: "Riveduta",
    language: "it",
    languageName: "Italian",
    description: "Bibbia Riveduta 1927 (public domain)",
  },
  vdc: {
    id: "vdc",
    label: "Română · Cornilescu",
    shortLabel: "VDC",
    language: "ro",
    languageName: "Romanian",
    description: "Biblia Cornilescu 1924 (public domain)",
  },
  dutch1917: {
    id: "dutch1917",
    label: "Nederlands · 1917",
    shortLabel: "Dutch",
    language: "nl",
    languageName: "Dutch",
    description: "De Heilige Schrift 1917 (public domain)",
  },
  nb1930: {
    id: "nb1930",
    label: "Norsk · 1930",
    shortLabel: "Norsk",
    language: "nb",
    languageName: "Norwegian",
    description: "Norsk Bibel 1930 (public domain)",
  },
  sv1917: {
    id: "sv1917",
    label: "Svenska · 1917",
    shortLabel: "Swedish",
    language: "sv",
    languageName: "Swedish",
    description: "Bibeln 1917 (public domain)",
  },
  dansk1931: {
    id: "dansk1931",
    label: "Dansk · 1931",
    shortLabel: "Danish",
    language: "da",
    languageName: "Danish",
    description: "Dansk Bibel 1931 (public domain)",
  },
  bkr: {
    id: "bkr",
    label: "Čeština · Bible kralická",
    shortLabel: "BKR",
    language: "cs",
    languageName: "Czech",
    description: "Bible kralická 1613 (public domain)",
  },
  kar: {
    id: "kar",
    label: "Magyar · Károli",
    shortLabel: "Károli",
    language: "hu",
    languageName: "Hungarian",
    description: "Károli Biblia 1908 (public domain)",
  },
  bg: {
    id: "bg",
    label: "Polski · Gdańska",
    shortLabel: "BG",
    language: "pl",
    languageName: "Polish",
    description: "Biblia Gdańska 1632 (public domain)",
  },

  // Other
  svd: {
    id: "svd",
    label: "العربية · فان دايك",
    shortLabel: "SVD",
    language: "ar",
    languageName: "Arabic",
    description: "Smith-Van Dyck 1865 (public domain)",
  },
  vi1934: {
    id: "vi1934",
    label: "Tiếng Việt · 1934",
    shortLabel: "Vietnamese",
    language: "vi",
    languageName: "Vietnamese",
    description: "Kinh Thánh 1934 (public domain)",
  },
  lsb: {
    id: "lsb",
    label: "Esperanto · La Sankta Biblio",
    shortLabel: "Esperanto",
    language: "eo",
    languageName: "Esperanto",
    description: "La Sankta Biblio 1926 (public domain)",
  },

  // Classical / original-language texts
  vulg: {
    id: "vulg",
    label: "Latina · Vulgata",
    shortLabel: "Vulgate",
    language: "la",
    languageName: "Latin",
    description: "Biblia Sacra Vulgata (public domain)",
  },
  clem: {
    id: "clem",
    label: "Latina · Clementina",
    shortLabel: "Clementine",
    language: "la",
    languageName: "Latin",
    description: "Clementine Vulgate 1592 (public domain)",
  },
  tr: {
    id: "tr",
    label: "Ελληνικά · Textus Receptus",
    shortLabel: "TR",
    language: "gr",
    languageName: "Greek (NT)",
    description: "Textus Receptus Stephanus 1550 — New Testament (public domain)",
  },
  wlc: {
    id: "wlc",
    label: "עברית · WLC",
    shortLabel: "WLC",
    language: "he",
    languageName: "Hebrew (OT)",
    description: "Westminster Leningrad Codex — Old Testament (free license)",
  },
  aleppo: {
    id: "aleppo",
    label: "עברית · Aleppo",
    shortLabel: "Aleppo",
    language: "he",
    languageName: "Hebrew (OT)",
    description: "Aleppo Codex — Old Testament (public domain)",
  },
};

export const VERSION_IDS = Object.keys(VERSIONS);

export const DEFAULT_VERSION: VersionId = "web";

export function isVersionId(value: string): boolean {
  return value in VERSIONS;
}

export function getVersion(id: string): BibleVersion {
  return VERSIONS[id] ?? VERSIONS[DEFAULT_VERSION];
}

export function versionsByLanguage(): Array<{
  languageName: string;
  versions: BibleVersion[];
}> {
  const map = new Map<string, BibleVersion[]>();
  for (const version of Object.values(VERSIONS)) {
    const list = map.get(version.languageName) ?? [];
    list.push(version);
    map.set(version.languageName, list);
  }
  return [...map.entries()].map(([languageName, versions]) => ({
    languageName,
    versions,
  }));
}
