/** Common English book aliases → slug used in our data. */
const BOOK_ALIASES: Record<string, string> = {
  genesis: "genesis",
  gen: "genesis",
  ge: "genesis",
  gn: "genesis",
  exodus: "exodus",
  exo: "exodus",
  ex: "exodus",
  leviticus: "leviticus",
  lev: "leviticus",
  le: "leviticus",
  numbers: "numbers",
  num: "numbers",
  nu: "numbers",
  nm: "numbers",
  deuteronomy: "deuteronomy",
  deut: "deuteronomy",
  de: "deuteronomy",
  dt: "deuteronomy",
  joshua: "joshua",
  josh: "joshua",
  jos: "joshua",
  judges: "judges",
  judg: "judges",
  jdg: "judges",
  ruth: "ruth",
  ru: "ruth",
  "1 samuel": "1-samuel",
  "1samuel": "1-samuel",
  "1 sam": "1-samuel",
  "1sam": "1-samuel",
  "1sa": "1-samuel",
  "2 samuel": "2-samuel",
  "2samuel": "2-samuel",
  "2 sam": "2-samuel",
  "2sam": "2-samuel",
  "2sa": "2-samuel",
  "1 kings": "1-kings",
  "1kings": "1-kings",
  "1ki": "1-kings",
  "2 kings": "2-kings",
  "2kings": "2-kings",
  "2ki": "2-kings",
  "1 chronicles": "1-chronicles",
  "1chronicles": "1-chronicles",
  "1 chron": "1-chronicles",
  "1ch": "1-chronicles",
  "2 chronicles": "2-chronicles",
  "2chronicles": "2-chronicles",
  "2 chron": "2-chronicles",
  "2ch": "2-chronicles",
  ezra: "ezra",
  ezr: "ezra",
  nehemiah: "nehemiah",
  neh: "nehemiah",
  ne: "nehemiah",
  esther: "esther",
  est: "esther",
  es: "esther",
  job: "job",
  psalms: "psalms",
  psalm: "psalms",
  psa: "psalms",
  ps: "psalms",
  proverbs: "proverbs",
  prov: "proverbs",
  pr: "proverbs",
  prv: "proverbs",
  ecclesiastes: "ecclesiastes",
  eccles: "ecclesiastes",
  ecc: "ecclesiastes",
  ec: "ecclesiastes",
  "song of solomon": "song-of-solomon",
  "song of songs": "song-of-solomon",
  songs: "song-of-solomon",
  sos: "song-of-solomon",
  ss: "song-of-solomon",
  isaiah: "isaiah",
  isa: "isaiah",
  is: "isaiah",
  jeremiah: "jeremiah",
  jer: "jeremiah",
  je: "jeremiah",
  lamentations: "lamentations",
  lam: "lamentations",
  la: "lamentations",
  ezekiel: "ezekiel",
  ezek: "ezekiel",
  eze: "ezekiel",
  daniel: "daniel",
  dan: "daniel",
  da: "daniel",
  hosea: "hosea",
  hos: "hosea",
  ho: "hosea",
  joel: "joel",
  joe: "joel",
  amos: "amos",
  am: "amos",
  obadiah: "obadiah",
  obad: "obadiah",
  ob: "obadiah",
  jonah: "jonah",
  jon: "jonah",
  micah: "micah",
  mic: "micah",
  nahum: "nahum",
  nah: "nahum",
  na: "nahum",
  habakkuk: "habakkuk",
  hab: "habakkuk",
  zephaniah: "zephaniah",
  zeph: "zephaniah",
  zep: "zephaniah",
  haggai: "haggai",
  hag: "haggai",
  hg: "haggai",
  zechariah: "zechariah",
  zech: "zechariah",
  zec: "zechariah",
  malachi: "malachi",
  mal: "malachi",
  matthew: "matthew",
  matt: "matthew",
  mt: "matthew",
  mark: "mark",
  mrk: "mark",
  mk: "mark",
  luke: "luke",
  luk: "luke",
  lk: "luke",
  john: "john",
  jhn: "john",
  jn: "john",
  acts: "acts",
  act: "acts",
  ac: "acts",
  romans: "romans",
  rom: "romans",
  ro: "romans",
  "1 corinthians": "1-corinthians",
  "1corinthians": "1-corinthians",
  "1 cor": "1-corinthians",
  "1cor": "1-corinthians",
  "1co": "1-corinthians",
  "2 corinthians": "2-corinthians",
  "2corinthians": "2-corinthians",
  "2 cor": "2-corinthians",
  "2cor": "2-corinthians",
  "2co": "2-corinthians",
  galatians: "galatians",
  gal: "galatians",
  ga: "galatians",
  ephesians: "ephesians",
  eph: "ephesians",
  philippians: "philippians",
  phil: "philippians",
  php: "philippians",
  colossians: "colossians",
  col: "colossians",
  "1 thessalonians": "1-thessalonians",
  "1thessalonians": "1-thessalonians",
  "1 thess": "1-thessalonians",
  "1th": "1-thessalonians",
  "2 thessalonians": "2-thessalonians",
  "2thessalonians": "2-thessalonians",
  "2 thess": "2-thessalonians",
  "2th": "2-thessalonians",
  "1 timothy": "1-timothy",
  "1timothy": "1-timothy",
  "1 tim": "1-timothy",
  "1ti": "1-timothy",
  "2 timothy": "2-timothy",
  "2timothy": "2-timothy",
  "2 tim": "2-timothy",
  "2ti": "2-timothy",
  titus: "titus",
  tit: "titus",
  philemon: "philemon",
  phlm: "philemon",
  phm: "philemon",
  hebrews: "hebrews",
  heb: "hebrews",
  james: "james",
  jas: "james",
  jm: "james",
  "1 peter": "1-peter",
  "1peter": "1-peter",
  "1 pet": "1-peter",
  "1pe": "1-peter",
  "2 peter": "2-peter",
  "2peter": "2-peter",
  "2 pet": "2-peter",
  "2pe": "2-peter",
  "1 john": "1-john",
  "1john": "1-john",
  "1 jn": "1-john",
  "1jn": "1-john",
  "2 john": "2-john",
  "2john": "2-john",
  "2 jn": "2-john",
  "2jn": "2-john",
  "3 john": "3-john",
  "3john": "3-john",
  "3 jn": "3-john",
  "3jn": "3-john",
  jude: "jude",
  jud: "jude",
  revelation: "revelation",
  rev: "revelation",
  re: "revelation",
  // Tagalog / common spoken names (for voice search)
  juan: "john",
  "1 juan": "1-john",
  "1juan": "1-john",
  "2 juan": "2-john",
  "2juan": "2-john",
  "3 juan": "3-john",
  "3juan": "3-john",
  mateo: "matthew",
  marcos: "mark",
  lucas: "luke",
  roma: "romans",
  romanos: "romans",
  "mga gawa": "acts",
  gawa: "acts",
  apostol: "acts",
  "mga awit": "psalms",
  awit: "psalms",
  "mga kawikaan": "proverbs",
  kawikaan: "proverbs",
  pmb: "proverbs",
  henesis: "genesis",
  exodo: "exodus",
  isaias: "isaiah",
  jeremias: "jeremiah",
  ezekiel: "ezekiel",
  daniel: "daniel",
  oseas: "hosea",
  joel: "joel",
  amos: "amos",
  jonas: "jonah",
  mikas: "micah",
  nahum: "nahum",
  habacuc: "habakkuk",
  sofonia: "zephaniah",
  ageo: "haggai",
  zacarias: "zechariah",
  malakias: "malachi",
  corinto: "1-corinthians",
  "1 corinto": "1-corinthians",
  "1corinto": "1-corinthians",
  "2 corinto": "2-corinthians",
  "2corinto": "2-corinthians",
  galacia: "galatians",
  efeso: "ephesians",
  filipos: "philippians",
  colosas: "colossians",
  "1 tesalonica": "1-thessalonians",
  "2 tesalonica": "2-thessalonians",
  "1 timoteo": "1-timothy",
  "2 timoteo": "2-timothy",
  tito: "titus",
  filemon: "philemon",
  hebreo: "hebrews",
  hebreos: "hebrews",
  santiago: "james",
  "1 pedro": "1-peter",
  "2 pedro": "2-peter",
  judas: "jude",
  apocalipsis: "revelation",
  pahayag: "revelation",
  // More Tagalog / Spanish / FR / DE / IT / PT spoken names
  "unang juan": "1-john",
  "ikalawang juan": "2-john",
  "ikatlong juan": "3-john",
  "unang pedro": "1-peter",
  "ikalawang pedro": "2-peter",
  "unang samuel": "1-samuel",
  "ikalawang samuel": "2-samuel",
  "mga hukom": "judges",
  hukom: "judges",
  "mga bilang": "numbers",
  bilang: "numbers",
  levitico: "leviticus",
  deuteronomio: "deuteronomy",
  josue: "joshua",
  rut: "ruth",
  nehemias: "nehemiah",
  ester: "esther",
  "mga panaghoy": "lamentations",
  panaghoy: "lamentations",
  "awit ng mga awit": "song-of-solomon",
  "cantares": "song-of-solomon",
  jean: "john",
  matthieu: "matthew",
  marc: "mark",
  luc: "luke",
  giovanni: "john",
  matteo: "matthew",
  marco: "mark",
  luca: "luke",
  joao: "john",
  "joão": "john",
  mateus: "matthew",
  johannes: "john",
  "matthäus": "matthew",
  markus: "mark",
  lukas: "luke",
};

export type ParsedReference = {
  slug: string;
  chapter: number;
  verse?: number;
};

const ONES: Record<string, number> = {
  zero: 0,
  oh: 0,
  o: 0,
  one: 1,
  first: 1,
  two: 2,
  second: 2,
  three: 3,
  third: 3,
  four: 4,
  fourth: 4,
  five: 5,
  fifth: 5,
  six: 6,
  sixth: 6,
  seven: 7,
  seventh: 7,
  eight: 8,
  eighth: 8,
  nine: 9,
  ninth: 9,
  ten: 10,
  tenth: 10,
  eleven: 11,
  eleventh: 11,
  twelve: 12,
  twelfth: 12,
  thirteen: 13,
  fourteenth: 14,
  fourteen: 14,
  fifteen: 15,
  fifteenth: 15,
  sixteen: 16,
  sixteenth: 16,
  seventeen: 17,
  seventeenth: 17,
  eighteen: 18,
  eighteenth: 18,
  nineteen: 19,
  nineteenth: 19,
  // Tagalog
  isa: 1,
  una: 1,
  dalawa: 2,
  pangalawa: 2,
  tatlo: 3,
  pangatlo: 3,
  apat: 4,
  lima: 5,
  anim: 6,
  pito: 7,
  walo: 8,
  siyam: 9,
  sampu: 10,
  labingisa: 11,
  "labing-isa": 11,
  labindalawa: 12,
  "labing-dalawa": 12,
  labintatlo: 13,
  labingapat: 14,
  "labing-apat": 14,
  labinlima: 15,
  labinganim: 16,
  "labing-anim": 16,
  // Spanish
  uno: 1,
  dos: 2,
  tres: 3,
  cuatro: 4,
  cinco: 5,
  seis: 6,
  siete: 7,
  ocho: 8,
  nueve: 9,
  diez: 10,
  once: 11,
  doce: 12,
  trece: 13,
  catorce: 14,
  quince: 15,
  dieciseis: 16,
  "dieciséis": 16,
  diecisiete: 17,
  dieciocho: 18,
  diecinueve: 19,
};

const TENS: Record<string, number> = {
  twenty: 20,
  twentieth: 20,
  thirty: 30,
  thirtieth: 30,
  forty: 40,
  fortieth: 40,
  fifty: 50,
  fiftieth: 50,
  sixty: 60,
  sixtieth: 60,
  seventy: 70,
  seventieth: 70,
  eighty: 80,
  eightieth: 80,
  ninety: 90,
  ninetieth: 90,
};

/** Turn spoken number words into digits (“three sixteen” → “3 16”). */
function spokenNumbersToDigits(text: string): string {
  const words = text.split(/\s+/).filter(Boolean);
  const out: string[] = [];
  let i = 0;

  while (i < words.length) {
    const w = words[i];
    const next = words[i + 1];

    if (TENS[w] != null && next && ONES[next] != null && ONES[next]! < 10) {
      out.push(String(TENS[w]! + ONES[next]!));
      i += 2;
      continue;
    }
    if (TENS[w] != null) {
      out.push(String(TENS[w]));
      i += 1;
      continue;
    }
    if (ONES[w] != null) {
      out.push(String(ONES[w]));
      i += 1;
      continue;
    }
    // “a hundred” / “one hundred fifty” — keep simple: hundred alone → 100
    if (w === "hundred") {
      const prev = out[out.length - 1];
      if (prev && /^\d+$/.test(prev) && Number(prev) < 10) {
        out[out.length - 1] = String(Number(prev) * 100);
      } else {
        out.push("100");
      }
      i += 1;
      continue;
    }

    out.push(w);
    i += 1;
  }

  return out.join(" ");
}

/** Clean spoken transcripts before parsing (e.g. “John chapter 3 verse 16”). */
export function normalizeSpokenReference(query: string): string {
  let q = query
    .toLowerCase()
    .replace(/[?!'"“”‘’]/g, " ")
    .replace(/\b(please|open|go to|goto|find|show|read|basahin|buksan|hanapin|abre|ouvrir|öffne)\b/g, " ")
    .replace(/\b(chapter|kapitulo|kabanata|capítulo|chapitre|kapitel|capitolo|hoofdstuk)\b/g, " ")
    .replace(/\b(verse|verses|talata|bersikulo|versículo|verset|vers|versetto|стих)\b/g, " ")
    .replace(/\b(book of|libro ng|libro|sa|livre|buch)\b/g, " ")
    .replace(/,/g, " ")
    .replace(/:/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  q = spokenNumbersToDigits(q);
  return q.replace(/\s+/g, " ").trim();
}

/** Extra spoken forms like “john 316” → try “john 3 16”. */
function spokenGluedCandidates(q: string): string[] {
  const m = q.match(/^(.+?)\s+(\d{3,4})$/);
  if (!m) return [q];
  const book = m[1];
  const digits = m[2];
  const splits: string[] = [];
  if (digits.length === 3) {
    splits.push(`${book} ${digits[0]} ${digits.slice(1)}`);
    splits.push(`${book} ${digits.slice(0, 2)} ${digits[2]}`);
  } else if (digits.length === 4) {
    splits.push(`${book} ${digits.slice(0, 2)} ${digits.slice(2)}`);
    splits.push(`${book} ${digits[0]} ${digits.slice(1)}`);
  }
  // Prefer split chapter:verse forms before treating the whole number as a chapter.
  return [...splits, q];
}

/** Protestant chapter counts — used to disambiguate spoken “john 316” vs “psalm 119”. */
const MAX_CHAPTER: Record<string, number> = {
  genesis: 50,
  exodus: 40,
  leviticus: 27,
  numbers: 36,
  deuteronomy: 34,
  joshua: 24,
  judges: 21,
  ruth: 4,
  "1-samuel": 31,
  "2-samuel": 24,
  "1-kings": 22,
  "2-kings": 25,
  "1-chronicles": 29,
  "2-chronicles": 36,
  ezra: 10,
  nehemiah: 13,
  esther: 10,
  job: 42,
  psalms: 150,
  proverbs: 31,
  ecclesiastes: 12,
  "song-of-solomon": 8,
  isaiah: 66,
  jeremiah: 52,
  lamentations: 5,
  ezekiel: 48,
  daniel: 12,
  hosea: 14,
  joel: 3,
  amos: 9,
  obadiah: 1,
  jonah: 4,
  micah: 7,
  nahum: 3,
  habakkuk: 3,
  zephaniah: 3,
  haggai: 2,
  zechariah: 14,
  malachi: 4,
  matthew: 28,
  mark: 16,
  luke: 24,
  john: 21,
  acts: 28,
  romans: 16,
  "1-corinthians": 16,
  "2-corinthians": 13,
  galatians: 6,
  ephesians: 6,
  philippians: 4,
  colossians: 4,
  "1-thessalonians": 5,
  "2-thessalonians": 3,
  "1-timothy": 6,
  "2-timothy": 4,
  titus: 3,
  philemon: 1,
  hebrews: 13,
  james: 5,
  "1-peter": 5,
  "2-peter": 3,
  "1-john": 5,
  "2-john": 1,
  "3-john": 1,
  jude: 1,
  revelation: 22,
};

function isPlausibleRef(ref: ParsedReference): boolean {
  const max = MAX_CHAPTER[ref.slug] ?? 50;
  if (ref.chapter < 1 || ref.chapter > max) return false;
  if (ref.verse !== undefined && (ref.verse < 1 || ref.verse > 176)) return false;
  return true;
}

/**
 * Parse strings like "John 3:16", "Ps 23", "1 Cor 13:4", or spoken "John 3 16".
 * Returns null if the query does not look like a reference.
 */
export function parseReference(query: string): ParsedReference | null {
  const base = normalizeSpokenReference(query);
  if (!base) return null;

  const candidates: ParsedReference[] = [];

  for (const q of spokenGluedCandidates(base)) {
    const match = q.match(
      /^((?:\d\s*)?[a-z][a-z\s]*?)\s+(\d+)(?:\s*[:.]\s*(\d+)|\s+(\d+))?$/i,
    );
    if (!match) continue;

    const bookRaw = match[1].replace(/\s+/g, " ").trim();
    const compact = bookRaw.replace(/\s+/g, "");
    const slug =
      BOOK_ALIASES[bookRaw] ??
      BOOK_ALIASES[compact] ??
      (bookRaw.includes(" ") ? null : BOOK_ALIASES[bookRaw]);

    if (!slug) continue;

    const chapter = Number(match[2]);
    const verseRaw = match[3] ?? match[4];
    const verse = verseRaw ? Number(verseRaw) : undefined;
    if (!Number.isFinite(chapter) || chapter < 1) continue;
    if (verse !== undefined && (!Number.isFinite(verse) || verse < 1)) continue;

    const ref = { slug, chapter, verse };
    if (!isPlausibleRef(ref)) continue;
    candidates.push(ref);
  }

  if (!candidates.length) return null;

  // Prefer a whole chapter when it is a valid chapter number (e.g. Psalm 119),
  // otherwise the first chapter:verse split (e.g. John 316 → 3:16).
  const chapterOnly = candidates.find((c) => c.verse === undefined);
  if (chapterOnly) return chapterOnly;
  return candidates[0];
}
