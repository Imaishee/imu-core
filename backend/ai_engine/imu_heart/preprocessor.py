"""
IMU_Heart - Dataset Preprocessor
Extracts mood, time, style, and relationship features from WhatsApp chat data.
"""

import json
import re
import os
from datetime import datetime, timedelta
from collections import Counter, defaultdict
from typing import List, Dict, Tuple

# ─── Mood Keywords ─────────────────────────────────────────────────────────────

MOOD_KEYWORDS = {
    "happy": [
        "ha",
        "haha",
        "hehe",
        "nice",
        "great",
        "awesome",
        "love",
        "perfect",
        "accha",
        "thik",
        "ok",
        "good",
        "amazing",
        "wonderful",
        "best",
        "❤️",
        "💚",
        "😊",
    ],
    "sad": [
        "dukh",
        "khotta",
        "难过",
        "sorry",
        "miss",
        "mono",
        "heart",
        "cry",
        "karon",
        "na",
        "nah",
        "hurt",
        "pain",
        "lonely",
        "alone",
        "empty",
        "😢",
        "💔",
        "😭",
    ],
    "angry": [
        "raag",
        "gussha",
        "angry",
        "hate",
        "chal",
        "nikal",
        "sala",
        "kharap",
        "nasty",
        "worst",
        "irritate",
        "annoy",
        "烦",
        "😤",
        "🤬",
    ],
    "loving": [
        "bhalobashi",
        "love",
        "valo",
        "miss",
        "darun",
        "sundor",
        "beautiful",
        "cute",
        "pagli",
        "shona",
        "jan",
        "darling",
        "jaan",
        "❤️",
        "🥰",
        "💕",
        "💗",
    ],
    "flirty": [
        "tui",
        " ki",
        "hmm",
        "😏",
        "khali",
        "ami",
        "tor",
        "amar",
        "dekha",
        "konta",
        "ki korbi",
        "flirt",
        "hot",
        "sexy",
        "gorgeous",
        "🫠",
        "😏",
    ],
    "tired": [
        "ghum",
        "sleep",
        "sona",
        "nite",
        "night",
        "goodnight",
        "thak",
        "exhausted",
        "bore",
        "tired",
        "😴",
        "💤",
    ],
    "hungry": [
        "khabe",
        "khabar",
        "bhook",
        "lunch",
        "dinner",
        "breakfast",
        "food",
        "pet",
        "khete",
        "nasta",
        "chai",
        "☕",
        "🍕",
        "🍔",
    ],
    "excited": [
        "wow",
        "omg",
        "cant wait",
        "excited",
        "yay",
        "yayy",
        "finally",
        "party",
        "dance",
        "🔥",
        "🎉",
        "🤩",
    ],
    "caring": [
        "take care",
        "jalna",
        "dhyan",
        "bhalo",
        "safe",
        "healthy",
        "medicine",
        "rest",
        "worry",
        "concern",
        "🤗",
        "❤️",
    ],
    "normal": [],
}

# ─── Intent Patterns ───────────────────────────────────────────────────────────

INTENT_PATTERNS = {
    "greeting": re.compile(
        r"\b(hi|hello|hey|good\s*(morning|afternoon|evening|night)|subho|nomoshkar|ei|oii|are|arre)\b",
        re.I,
    ),
    "farewell": re.compile(
        r"\b(bye|tata|chal|nikal|gn|good\s*night|good\s*morning|rakh|thak|chal\s*bye)\b",
        re.I,
    ),
    "love": re.compile(
        r"\b(bhalobashi|love|valobashi|miss|miss\s*korchi|darling|jaan|shona|pagli|❤️|💚|💕|💗|🥰)\b",
        re.I,
    ),
    "flirty": re.compile(
        r"\b(ki\s*korbi|ki\s*korchis|dekha|hot|sexy|beautiful|gorgeous|cute|sundor|tumi|tor|😏|🫠)\b",
        re.I,
    ),
    "sad": re.compile(
        r"\b(dukh|sorry|cry|hurt|pain|miss|lonely|mono|mon|empty|sad|难过|😢|💔|😭)\b",
        re.I,
    ),
    "angry": re.compile(
        r"\b(raag|gussha|angry|hate|chal|nikal|sala|kharap|nasty|worst|😤|🤬)\b", re.I
    ),
    "question": re.compile(
        r"\b(ki|kano|keno|kno|kire|kisher|kothay|kakhon|kemon|bol|sotti|kotha)\b", re.I
    ),
    "food": re.compile(
        r"\b(khabe|khabar|bhook|lunch|dinner|breakfast|food|pet|khete|nasta|chai|coffee)\b",
        re.I,
    ),
    "sleep": re.compile(
        r"\b(ghum|sleep|sona|nite|night|goodnight|thak|exhausted|bore|tired|😴)\b", re.I
    ),
    "study": re.compile(
        r"\b(porishona|study|padhai|exam|result|marks|class|college|school|assignment)\b",
        re.I,
    ),
    "miss": re.compile(
        r"\b(miss|miss\s*korchi|miss\s*kore|ichche|mon\s*ache|mone\s*ache)\b", re.I
    ),
}

# ─── Emoji Extractor ───────────────────────────────────────────────────────────

EMOJI_RE = re.compile(
    "["
    "\U0001f600-\U0001f64f"  # emoticons
    "\U0001f300-\U0001f5ff"  # symbols & pictographs
    "\U0001f680-\U0001f6ff"  # transport & map
    "\U0001f1e0-\U0001f1ff"  # flags
    "\U00002702-\U000027b0"
    "\U000024c2-\U0001f251"
    "\U0001f926-\U0001f937"
    "\U00010000-\U0010ffff"
    "\u200d"
    "\ufe0f"
    "]+",
    flags=re.UNICODE,
)

# ─── Timestamp Parser ──────────────────────────────────────────────────────────

TS_RE = re.compile(
    r"(\d{1,2}/\d{1,2}/\d{2,4}),\s(\d{1,2}:\d{2}(?::\d{2})?)\s([ap]m)\s*-\s*([A-Z]+):\s*(.*)",
    re.I,
)


def parse_whatsapp_export(filepath: str) -> List[Dict]:
    """Parse WhatsApp chat export into structured messages."""
    messages = []
    current_msg = None

    with open(filepath, "r", encoding="utf-8", errors="replace") as f:
        for line in f:
            line = line.strip()
            match = TS_RE.match(line)
            if match:
                if current_msg:
                    messages.append(current_msg)
                date_str, time_str, ampm, speaker, text = match.groups()
                try:
                    dt_str = f"{date_str} {time_str} {ampm}"
                    for fmt in [
                        "%m/%d/%Y, %I:%M %p",
                        "%m/%d/%y, %I:%M %p",
                        "%d/%m/%Y, %I:%M %p",
                        "%d/%m/%y, %I:%M %p",
                    ]:
                        try:
                            timestamp = datetime.strptime(dt_str, fmt)
                            break
                        except ValueError:
                            continue
                    else:
                        timestamp = datetime.now()
                except Exception:
                    timestamp = datetime.now()

                current_msg = {
                    "timestamp": timestamp.isoformat(),
                    "speaker": speaker.upper(),
                    "text": text.strip(),
                    "hour": timestamp.hour,
                    "day_of_week": timestamp.weekday(),
                }
            elif current_msg:
                current_msg["text"] += "\n" + line

    if current_msg:
        messages.append(current_msg)

    return messages


def detect_mood(text: str) -> str:
    """Detect mood from message text."""
    text_lower = text.lower()
    scores = {}
    for mood, keywords in MOOD_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw.lower() in text_lower)
        if score > 0:
            scores[mood] = score

    # Check emojis
    emojis = EMOJI_RE.findall(text)
    for emoji in emojis:
        if emoji in ["😢", "💔", "😭", "😞"]:
            scores["sad"] = scores.get("sad", 0) + 2
        elif emoji in ["😤", "🤬"]:
            scores["angry"] = scores.get("angry", 0) + 2
        elif emoji in ["❤️", "💚", "💕", "💗", "🥰", "😍"]:
            scores["loving"] = scores.get("loving", 0) + 2
        elif emoji in ["😏", "🫠", "🙄"]:
            scores["flirty"] = scores.get("flirty", 0) + 2
        elif emoji in ["😊", "😄", "😃", "😁"]:
            scores["happy"] = scores.get("happy", 0) + 2
        elif emoji in ["😴", "💤"]:
            scores["tired"] = scores.get("tired", 0) + 2

    if scores:
        return max(scores, key=lambda k: scores.get(k, 0))
    return "normal"


def detect_intent(text: str) -> str:
    """Detect intent from message text."""
    for intent, pattern in INTENT_PATTERNS.items():
        if pattern.search(text):
            return intent
    return "normal"


def build_training_pairs(messages: List[Dict]) -> List[Dict]:
    """Build training pairs with full context features."""
    pairs = []

    for i in range(len(messages)):
        msg = messages[i]
        text = msg["text"]

        # Skip junk
        if any(
            junk in text.lower()
            for junk in [
                "this message was deleted",
                "<media omitted>",
                "media omitted",
                "message deleted",
                "you deleted this message",
                "http",
            ]
        ):
            continue
        if len(text.strip()) < 1:
            continue

        # Find response (next message from different speaker)
        response = None
        response_idx = None
        for j in range(i + 1, min(i + 5, len(messages))):
            if messages[j]["speaker"] != msg["speaker"]:
                response = messages[j]
                response_idx = j
                break

        if response is None:
            continue

        # Skip junk responses
        if any(
            junk in response["text"].lower()
            for junk in ["this message was deleted", "<media omitted>", "media omitted"]
        ):
            continue
        if len(response["text"].strip()) < 1:
            continue

        # Calculate time gap
        try:
            t1 = datetime.fromisoformat(msg["timestamp"])
            t2 = datetime.fromisoformat(response["timestamp"])
            time_gap_seconds = (t2 - t1).total_seconds()
        except Exception:
            time_gap_seconds = 0

        # Calculate time of day
        hour = msg["hour"]
        if 5 <= hour < 12:
            time_of_day = "morning"
        elif 12 <= hour < 17:
            time_of_day = "afternoon"
        elif 17 <= hour < 21:
            time_of_day = "evening"
        else:
            time_of_day = "night"

        # Mood of previous context (last 3 messages from same speaker)
        recent_moods = []
        for k in range(max(0, i - 3), i):
            if messages[k]["speaker"] == msg["speaker"]:
                recent_moods.append(detect_mood(messages[k]["text"]))

        mood_shift = "stable"
        if len(recent_moods) >= 2:
            if recent_moods[-1] != recent_moods[-2]:
                mood_shift = f"{recent_moods[-2]}_to_{recent_moods[-1]}"

        pair = {
            "input_text": text,
            "output_text": response["text"],
            "input_speaker": msg["speaker"],
            "output_speaker": response["speaker"],
            "input_mood": detect_mood(text),
            "output_mood": detect_mood(response["text"]),
            "input_intent": detect_intent(text),
            "output_intent": detect_intent(response["text"]),
            "time_gap_seconds": min(time_gap_seconds, 86400),  # cap at 24h
            "time_of_day": time_of_day,
            "hour": hour,
            "day_of_week": msg["day_of_week"],
            "mood_shift": mood_shift,
            "input_emojis": EMOJI_RE.findall(text),
            "output_emojis": EMOJI_RE.findall(response["text"]),
            "input_length": len(text),
            "output_length": len(response["text"]),
            "context_moods": recent_moods[-3:] if recent_moods else [],
        }
        pairs.append(pair)

    return pairs


def main():
    print("=" * 60)
    print("IMU_Heart Dataset Preprocessor")
    print("=" * 60)

    # Find the WhatsApp export
    dataset_dir = os.path.join(
        os.path.dirname(__file__), "..", "..", "..", "chat sampple dataset"
    )
    whatsapp_dirs = []
    if os.path.exists(dataset_dir):
        for d in os.listdir(dataset_dir):
            full = os.path.join(dataset_dir, d)
            if os.path.isdir(full):
                whatsapp_dirs.append(full)

    if not whatsapp_dirs:
        print("ERROR: No WhatsApp chat directory found")
        return

    # Parse all chat files
    all_messages = []
    for chat_dir in whatsapp_dirs:
        for fname in os.listdir(chat_dir):
            fpath = os.path.join(chat_dir, fname)
            if os.path.isfile(fpath):
                print(f"Parsing: {fpath}")
                msgs = parse_whatsapp_export(fpath)
                all_messages.extend(msgs)
                print(f"  -> {len(msgs)} messages")

    print(f"\nTotal raw messages: {len(all_messages)}")

    # Filter to MALE/FEMALE only
    filtered = [m for m in all_messages if m["speaker"] in ("MALE", "FEMALE")]
    print(f"After speaker filter: {len(filtered)}")

    # Build training pairs
    pairs = build_training_pairs(filtered)
    print(f"Training pairs: {len(pairs)}")

    # Stats
    mood_dist = Counter(p["output_mood"] for p in pairs)
    intent_dist = Counter(p["output_intent"] for p in pairs)
    time_dist = Counter(p["time_of_day"] for p in pairs)
    shift_dist = Counter(p["mood_shift"] for p in pairs if p["mood_shift"] != "stable")

    print(f"\n--- Mood Distribution ---")
    for mood, count in mood_dist.most_common():
        print(f"  {mood}: {count} ({count * 100 // len(pairs)}%)")

    print(f"\n--- Intent Distribution ---")
    for intent, count in intent_dist.most_common():
        print(f"  {intent}: {count} ({count * 100 // len(pairs)}%)")

    print(f"\n--- Time of Day ---")
    for tod, count in time_dist.most_common():
        print(f"  {tod}: {count}")

    print(f"\n--- Top Mood Shifts ---")
    for shift, count in shift_dist.most_common(10):
        print(f"  {shift}: {count}")

    # Save training data
    out_dir = os.path.dirname(os.path.abspath(__file__))
    out_path = os.path.join(out_dir, "training_data.jsonl")
    with open(out_path, "w", encoding="utf-8") as f:
        for p in pairs:
            f.write(json.dumps(p, ensure_ascii=False) + "\n")

    # Save stats
    stats = {
        "total_messages": len(filtered),
        "total_pairs": len(pairs),
        "mood_distribution": dict(mood_dist),
        "intent_distribution": dict(intent_dist),
        "time_distribution": dict(time_dist),
        "mood_shift_distribution": dict(shift_dist),
        "avg_time_gap_seconds": sum(p["time_gap_seconds"] for p in pairs) / len(pairs)
        if pairs
        else 0,
        "avg_input_length": sum(p["input_length"] for p in pairs) / len(pairs)
        if pairs
        else 0,
        "avg_output_length": sum(p["output_length"] for p in pairs) / len(pairs)
        if pairs
        else 0,
    }

    stats_path = os.path.join(out_dir, "training_stats.json")
    with open(stats_path, "w", encoding="utf-8") as f:
        json.dump(stats, f, indent=2, ensure_ascii=False)

    print(f"\nSaved: {out_path}")
    print(f"Stats: {stats_path}")
    print("DONE")


if __name__ == "__main__":
    main()
