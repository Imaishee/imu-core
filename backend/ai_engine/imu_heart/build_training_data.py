"""
Bridge: Convert clean_dataset.jsonl (211K messages) into IMU_Heart training_data.jsonl
"""

import json
import os
import re
from collections import Counter
from typing import Dict

# ─── Mood/Intent Detection (from preprocessor.py) ─────────────────────────────

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
        "sorry",
        "miss",
        "mono",
        "heart",
        "cry",
        "karon",
        "nah",
        "hurt",
        "pain",
        "lonely",
        "cry",
        "😢",
        "💔",
    ],
    "flirty": [
        "baby",
        "jaan",
        "darling",
        "kiss",
        "hug",
        "romantic",
        "sexy",
        "gorgeous",
        "beautiful",
        "cute",
        "😍",
        "😘",
        "🥰",
        "💋",
        "❤️‍🔥",
    ],
    "angry": [
        "raiz",
        "gusso",
        "angry",
        "furious",
        "hate",
        "stupid",
        "worst",
        "khotam",
        "‼️",
        "🤬",
        "😡",
    ],
    "loving": [
        "miss you",
        "love you",
        "priyo",
        "darling",
        "valobashi",
        "mohabbat",
        " sweetheart",
        "❤️",
        "💕",
        "💗",
        "🫶",
    ],
    "curious": [
        "ki",
        "kemon",
        "kothay",
        "kivabe",
        "kyun",
        "kaise",
        "what",
        "how",
        "where",
        "when",
        "why",
        "🤔",
        "❓",
    ],
    "excited": [
        "wow",
        "amazing",
        "yay",
        "woohoo",
        "yes",
        "finally",
        "🔥",
        "🎉",
        "⚡",
        "💯",
        "🙌",
    ],
    "tired": ["sleepy", "ghum", "tired", "exhausted", "nap", "bed", "😴", "💤", "🥱"],
}

INTENT_PATTERNS = {
    "greeting": re.compile(
        r"^(hi|hello|hey|good\s*(morning|afternoon|evening|night)|kemon|ki\s*hal|sup|yo)\b",
        re.I,
    ),
    "question": re.compile(
        r"\?|ki|kemon|kothay|kivabe|kyun|kaise|what|how|where|when|why|bolo|bolo na",
        re.I,
    ),
    "affection": re.compile(
        r"love|miss|darling|baby|jaan|valobashi|mohabbat|kiss|hug|❤️|💕|💗|😘|🥰", re.I
    ),
    "farewell": re.compile(
        r"bye|good\s*night|tata|goodbye|chal|ghum|ses|end|exit|ta+tA", re.I
    ),
    "complaint": re.compile(
        r"nahi|nah|na|ki\s*ho|ki\s*holo|problem|issue|wrong|bobusona|khotam", re.I
    ),
    "joke": re.compile(r"joke|funny|hasi|mazak|lol|hahaha|rofl", re.I),
    "praise": re.compile(
        r"good|nice|great|awesome|amazing|perfect|best|accha|valo|sundor", re.I
    ),
    "comfort": re.compile(r"sorry|dukh|cry|pain|hurt|feel|comfort|relax", re.I),
    "tease": re.compile(r"pagal|stupid|silly|boka|pagli|nasty|naughty|😏|🤭", re.I),
    "flirt": re.compile(
        r"sexy|hot|gorgeous|cute|beautiful|handsome|😍|😘|🥰|💋|❤️‍🔥", re.I
    ),
}


def detect_mood(text: str) -> str:
    scores: Dict[str, int] = {}
    lower = text.lower()
    for mood, keywords in MOOD_KEYWORDS.items():
        for kw in keywords:
            if kw in lower:
                scores[mood] = scores.get(mood, 0) + 1
    emojis = re.findall(
        r"[\U0001f600-\U0001f64f\U0001f300-\U0001f5ff\U0001f680-\U0001f6ff\U0001f1e0-\U0001f1ff\U00002702-\U000027B0\U000024C2-\U0001F251]",
        text,
    )
    for emoji in emojis:
        if emoji in ["💔", "😢", "😭"]:
            scores["sad"] = scores.get("sad", 0) + 2
        elif emoji in ["😡", "🤬"]:
            scores["angry"] = scores.get("angry", 0) + 2
        elif emoji in ["😘", "🥰", "😍", "💋", "❤️‍🔥"]:
            scores["flirty"] = scores.get("flirty", 0) + 2
        elif emoji in ["😊", "😄", "😃", "😁"]:
            scores["happy"] = scores.get("happy", 0) + 2
        elif emoji in ["😴", "💤"]:
            scores["tired"] = scores.get("tired", 0) + 2
    if scores:
        return max(scores, key=lambda k: scores.get(k, 0))
    return "normal"


def detect_intent(text: str) -> str:
    for intent, pattern in INTENT_PATTERNS.items():
        if pattern.search(text):
            return intent
    return "normal"


def detect_time_of_day(time_str: str) -> str:
    if not time_str:
        return "normal"
    match = re.search(r"(\d{1,2}):(\d{2})", time_str)
    if not match:
        return "normal"
    hour = int(match.group(1))
    if "pm" in time_str.lower() and hour != 12:
        hour += 12
    if "am" in time_str.lower() and hour == 12:
        hour = 0
    if 5 <= hour < 12:
        return "morning"
    elif 12 <= hour < 17:
        return "afternoon"
    elif 17 <= hour < 21:
        return "evening"
    return "night"


def detect_mood_shift(mood1: str, mood2: str) -> str:
    if mood1 == mood2 or mood1 == "normal" or mood2 == "normal":
        return "stable"
    return f"{mood1}_to_{mood2}"


def main():
    base = os.path.dirname(os.path.abspath(__file__))
    clean_path = os.path.join(base, "..", "clean_dataset.jsonl")
    out_path = os.path.join(base, "training_data.jsonl")
    stats_path = os.path.join(base, "training_stats.json")

    print("=" * 60)
    print("IMU_Heart Training Data Builder")
    print("=" * 60)

    # Load all messages
    messages = []
    with open(clean_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            msg = json.loads(line)
            messages.append(msg)

    print(f"Loaded {len(messages)} messages from clean_dataset.jsonl")

    # Build training pairs
    pairs = []
    for i in range(len(messages) - 1):
        curr = messages[i]
        nxt = messages[i + 1]

        if curr["speaker"] == nxt["speaker"]:
            continue
        if curr["speaker"] not in ("MALE", "FEMALE") or nxt["speaker"] not in (
            "MALE",
            "FEMALE",
        ):
            continue

        input_text = curr["text"].strip()
        output_text = nxt["text"].strip()

        if not input_text or not output_text:
            continue
        if len(input_text) < 2 or len(output_text) < 2:
            continue

        junk = ["this message was deleted", "waiting for this message", "created by"]
        if any(j in input_text.lower() for j in junk):
            continue
        if any(j in output_text.lower() for j in junk):
            continue

        t1 = curr.get("time", "")
        t2 = nxt.get("time", "")

        input_mood = detect_mood(input_text)
        output_mood = detect_mood(output_text)
        output_intent = detect_intent(output_text)
        time_of_day = detect_time_of_day(t1)
        mood_shift = detect_mood_shift(input_mood, output_mood)

        pairs.append(
            {
                "input_text": input_text,
                "output_text": output_text,
                "input_speaker": curr["speaker"],
                "output_speaker": nxt["speaker"],
                "input_mood": input_mood,
                "output_mood": output_mood,
                "output_intent": output_intent,
                "time_of_day": time_of_day,
                "mood_shift": mood_shift,
                "time_gap_seconds": 300,
                "input_length": len(input_text),
                "output_length": len(output_text),
            }
        )

    print(f"Built {len(pairs)} training pairs")

    with open(out_path, "w", encoding="utf-8") as f:
        for p in pairs:
            f.write(json.dumps(p, ensure_ascii=False) + "\n")

    mood_dist = Counter(p["output_mood"] for p in pairs)
    intent_dist = Counter(p["output_intent"] for p in pairs)
    time_dist = Counter(p["time_of_day"] for p in pairs)

    stats = {
        "total_pairs": len(pairs),
        "mood_distribution": dict(mood_dist),
        "intent_distribution": dict(intent_dist),
        "time_distribution": dict(time_dist),
    }

    with open(stats_path, "w", encoding="utf-8") as f:
        json.dump(stats, f, indent=2, ensure_ascii=False)

    print(f"Saved: {out_path}")
    print(f"Stats: {stats_path}")

    print(f"\n--- Mood Distribution ---")
    for mood, count in mood_dist.most_common():
        print(f"  {mood}: {count} ({count * 100 // len(pairs)}%)")

    print(f"\n--- Intent Distribution ---")
    for intent, count in intent_dist.most_common():
        print(f"  {intent}: {count} ({count * 100 // len(pairs)}%)")

    print("\nDONE")


if __name__ == "__main__":
    main()
