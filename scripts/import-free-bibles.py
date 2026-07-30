"""Download free/public-domain Bible texts and normalize to flat JSON."""
from __future__ import annotations

import json
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "src" / "data"
DATA.mkdir(parents=True, exist_ok=True)

UA = {"User-Agent": "bible-app-importer"}
BASE = "https://raw.githubusercontent.com/midvash/bible-data/main"

# Skip midvash `web` — we already ship WEBU as `web.json`
MIDVASH = [
    ("ar", "svd", "svd"),
    ("cs", "bkr", "bkr"),
    ("da", "dansk1931", "dansk1931"),
    ("de", "elb1905", "elb1905"),
    ("de", "luth1912", "luth1912"),
    ("en", "asv", "asv"),
    ("en", "dra", "dra"),
    ("en", "geneva1599", "geneva1599"),
    ("en", "kjv", "kjv"),
    ("eo", "lsb", "lsb"),
    ("fr", "darby-fr", "darby-fr"),
    ("fr", "lsg", "lsg"),
    ("fr", "martin1744", "martin1744"),
    ("gr", "tr", "tr"),
    ("he", "aleppo", "aleppo"),
    ("he", "wlc", "wlc"),
    ("hu", "kar", "kar"),
    ("it", "diodati", "diodati"),
    ("it", "riveduta", "riveduta"),
    ("la", "clem", "clem"),
    ("la", "vulg", "vulg"),
    ("nb", "nb1930", "nb1930"),
    ("nl", "dutch1917", "dutch1917"),
    ("pl", "bg", "bg"),
    ("pt", "almeida-livre", "almeida-livre"),
    ("ro", "vdc", "vdc"),
    ("ru", "synodal", "synodal"),
    ("sv", "sv1917", "sv1917"),
    ("uk", "kp", "kp"),
    ("vi", "vi1934", "vi1934"),
    ("zh", "cuv", "cuv"),
    ("zh", "cuvs", "cuvs"),
]

# Protestant canon order for nested arrays without englishName
CANON = [
    "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth",
    "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra",
    "Nehemiah", "Esther", "Job", "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon",
    "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos",
    "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah",
    "Malachi", "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians",
    "2 Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians",
    "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon",
    "Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude",
    "Revelation",
]


def fetch_json(url: str):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=180) as res:
        return json.loads(res.read().decode("utf-8-sig"))


def midvash_to_flat(payload: dict, translation: str) -> list[dict]:
    rows = []
    for book in payload.get("books", []):
        name = book.get("englishName") or book.get("name") or book.get("book")
        for chapter in book.get("chapters", []):
            chap_n = chapter["chapter"]
            for verse in chapter.get("verses", []):
                rows.append(
                    {
                        "translation": translation,
                        "book": name,
                        "chapter": int(chap_n),
                        "verse": int(verse["number"]),
                        "text": verse.get("text") or "",
                    }
                )
    return rows


def thiago_to_flat(payload: list, translation: str) -> list[dict]:
    rows = []
    for idx, book in enumerate(payload):
        name = CANON[idx] if idx < len(CANON) else book.get("name") or f"Book {idx+1}"
        for c_idx, verses in enumerate(book.get("chapters", [])):
            for v_idx, text in enumerate(verses):
                rows.append(
                    {
                        "translation": translation,
                        "book": name,
                        "chapter": c_idx + 1,
                        "verse": v_idx + 1,
                        "text": text if isinstance(text, str) else str(text),
                    }
                )
    return rows


def write_version(version_id: str, rows: list[dict]):
    out = DATA / f"{version_id}.json"
    out.write_text(json.dumps(rows, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"Wrote {version_id}: {len(rows)} verses -> {out.name}")


def main():
    for lang, slug, file_stem in MIDVASH:
        version_id = slug
        url = f"{BASE}/versions/{lang}/{slug}/{file_stem}.json"
        print(f"Downloading {version_id} ...")
        payload = fetch_json(url)
        rows = midvash_to_flat(payload, version_id.upper())
        write_version(version_id, rows)

    # Spanish Reina-Valera (public domain) from thiagobodruk/bible
    print("Downloading es-rvr ...")
    es = fetch_json(
        "https://raw.githubusercontent.com/thiagobodruk/bible/master/json/es_rvr.json"
    )
    write_version("es-rvr", thiago_to_flat(es, "RVR"))

    print("Done.")


if __name__ == "__main__":
    main()
