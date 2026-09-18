"""
I'MU AI Companion - Dataset Cleaner
Strips all real names from WhatsApp chat export.
Replaces with MALE/FEMALE labels.
Outputs clean JSONL dataset for the response engine.
"""

import re
import json
import os
from typing import Optional

TIMESTAMP_RE = re.compile(
    r"^(\d{1,2}/\d{1,2}/\d{2,4}),\s(\d{1,2}:\d{2}\s?[ap]m)\s-\s(.+?):\s(.+)$"
)
MEDIA_RE = re.compile(r"<Media omitted>")
EDITED_RE = re.compile(r"<This message was edited>")
LINK_RE = re.compile(r"https?://\S+")
# Detect emoji-only or very short messages
EMOJI_ONLY = re.compile(
    r"^[\U0001F600-\U0001F64F\U0001F300-\U0001F5FF\U0001F680-\U0001F6FF"
    r"\U0001F1E0-\U0001F1FF\U00002702-\U000027B0\U000024C2-\U0001F251"
    r"\U0001F900-\U0001F9FF\U0001FA00-\U0001FA6F\U0001FA70-\U0001FAFF"
    r"\s\U0000FE0F\U0000200D\U000020E3]+$"
)

# Known speakers (from the dataset)
MALE_SPEAKER = "SHUBHAM MALLICK"
FEMALE_SPEAKER = "Aishee♥️Radhee💫✨"

# Names/words to strip from text (not the speaker labels — those are handled separately)
PERSON_NAMES = [
    "shubham",
    "mallick",
    "aishee",
    "radhee",
    "aisheeradhee",
    "shubh",
    "shubham mallick",
]


# Convert to clean dataset
def clean_dataset(input_path: str, output_jsonl: str, output_pairs: str):
    """
    Parse WhatsApp chat and output:
    1. output_jsonl — every message as {speaker, text, time}
    2. output_pairs — conversation pairs as {user_msg, ai_reply}
    """
    messages = []

    with open(input_path, "r", encoding="utf-8", errors="ignore") as f:
        current_speaker = None
        current_text = ""
        current_time = ""

        for line in f:
            line = line.strip()
            match = TIMESTAMP_RE.match(line)
            if match:
                if current_speaker and current_text:
                    messages.append(
                        {
                            "speaker": current_speaker,
                            "text": current_text,
                            "time": current_time,
                        }
                    )
                date_str, time_str, speaker, text = match.groups()
                current_speaker = speaker
                current_text = text
                current_time = f"{date_str} {time_str}"
            elif current_speaker:
                current_text += " " + line

        if current_speaker and current_text:
            messages.append(
                {
                    "speaker": current_speaker,
                    "text": current_text,
                    "time": current_time,
                }
            )

    print(f"Parsed {len(messages)} total messages")

    # Write full clean dataset (JSONL)
    clean_count = 0
    with open(output_jsonl, "w", encoding="utf-8") as out:
        for msg in messages:
            text = msg["text"]
            # Skip media, links, empty
            if MEDIA_RE.search(text) or LINK_RE.search(text):
                continue
            text = EDITED_RE.sub("", text).strip()
            if not text or len(text) < 1:
                continue
            # Normalize speaker
            speaker = "FEMALE" if msg["speaker"] == FEMALE_SPEAKER else "MALE"
            out.write(
                json.dumps(
                    {
                        "speaker": speaker,
                        "text": text,
                        "time": msg["time"],
                    },
                    ensure_ascii=False,
                )
                + "\n"
            )
            clean_count += 1

    print(f"Wrote {clean_count} clean messages to {output_jsonl}")

    # Write conversation pairs (MALE→FEMALE = user→AI)
    pairs = []
    for i in range(len(messages) - 1):
        curr = messages[i]
        nxt = messages[i + 1]

        curr_speaker = "FEMALE" if curr["speaker"] == FEMALE_SPEAKER else "MALE"
        nxt_speaker = "FEMALE" if nxt["speaker"] == FEMALE_SPEAKER else "MALE"

        if curr_speaker == "MALE" and nxt_speaker == "FEMALE":
            user_text = EDITED_RE.sub("", curr["text"]).strip()
            ai_text = EDITED_RE.sub("", nxt["text"]).strip()
            if (
                user_text
                and ai_text
                and not MEDIA_RE.search(user_text)
                and not LINK_RE.search(user_text)
                and not MEDIA_RE.search(ai_text)
                and not LINK_RE.search(ai_text)
                and len(user_text) >= 2
                and len(ai_text) >= 1
            ):
                pairs.append(
                    {
                        "user_msg": user_text,
                        "ai_reply": ai_text,
                    }
                )

    with open(output_pairs, "w", encoding="utf-8") as out:
        for p in pairs:
            out.write(json.dumps(p, ensure_ascii=False) + "\n")

    print(f"Wrote {len(pairs)} conversation pairs to {output_pairs}")

    return clean_count, len(pairs)


# ─── Stats Builder ─────────────────────────────────────────────────────────────


def build_stats(jsonl_path: str, pairs_path: str, stats_path: str):
    """Build frequency stats from clean dataset."""
    from collections import Counter

    female_words = Counter()
    male_words = Counter()
    female_emojis = Counter()
    male_emojis = Counter()
    all_words = Counter()
    pair_keys = Counter()  # first 2 words of user msg → reply

    EMOJI_RE = re.compile(
        "["
        "\U0001f600-\U0001f64f\U0001f300-\U0001f5ff\U0001f680-\U0001f6ff"
        "\U0001f1e0-\U0001f1ff\U00002702-\U000027b0\U000024c2-\U0001f251"
        "\U0001f900-\U0001f9ff\U0001fa00-\U0001fa6f\U0001fa70-\U0001faff"
        "\U0000fe0f\U0000200d\U000020e3]+",
        flags=re.UNICODE,
    )

    # Process messages
    with open(jsonl_path, "r", encoding="utf-8") as f:
        for line in f:
            entry = json.loads(line)
            words = entry["text"].split()
            emojis = EMOJI_RE.findall(entry["text"])

            if entry["speaker"] == "FEMALE":
                female_words.update(words)
                female_emojis.update(emojis)
            else:
                male_words.update(words)
                male_emojis.update(emojis)
            all_words.update(words)

    # Process pairs for pattern matching
    user_msg_patterns = Counter()
    with open(pairs_path, "r", encoding="utf-8") as f:
        for line in f:
            p = json.loads(line)
            key = p["user_msg"].lower().strip()
            user_msg_patterns[key] += 1

    stats = {
        "total_unique_words": len(all_words),
        "female_unique_words": len(female_words),
        "male_unique_words": len(male_words),
        "top_female_words": dict(female_words.most_common(100)),
        "top_male_words": dict(male_words.most_common(100)),
        "top_emojis": dict((female_emojis + male_emojis).most_common(30)),
        "top_female_emojis": dict(female_emojis.most_common(20)),
        "top_male_emojis": dict(male_emojis.most_common(20)),
        "common_user_messages": dict(user_msg_patterns.most_common(100)),
        "female_response_patterns": dict(female_words.most_common(200)),
    }

    with open(stats_path, "w", encoding="utf-8") as out:
        json.dump(stats, out, ensure_ascii=False, indent=2)

    print(f"Stats written to {stats_path}")
    print(f"Female unique words: {len(female_words)}")
    print(f"Male unique words: {len(male_words)}")
    print(f"Top female words: {dict(female_words.most_common(20))}")
    print(f"Top female emojis: {dict(female_emojis.most_common(10))}")

    return stats


if __name__ == "__main__":
    base = os.path.dirname(os.path.abspath(__file__))
    chat_path = os.path.join(
        base,
        "..",
        "..",
        "chat sampple dataset",
        "WhatsApp Chat with Aishee♥️Radhee💫✨",
        "WhatsApp Chat with Aishee♥️Radhee💫✨.txt",
    )
    jsonl_path = os.path.join(base, "clean_dataset.jsonl")
    pairs_path = os.path.join(base, "conversation_pairs.jsonl")
    stats_path = os.path.join(base, "dataset_stats.json")

    if os.path.exists(chat_path):
        clean_dataset(chat_path, jsonl_path, pairs_path)
        build_stats(jsonl_path, pairs_path, stats_path)
    else:
        print(f"Chat file not found: {chat_path}")
