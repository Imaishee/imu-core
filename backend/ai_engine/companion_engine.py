"""
I'MU AI Companion - Response Engine
Built from clean conversation_pairs.jsonl (names stripped, MALE/FEMALE labels).
Uses Markov chains, intent detection, pattern matching, and emoji frequency.
"""

import re
import json
import random
import os
from collections import defaultdict, Counter
from typing import Optional

# ─── Intent Detection ───────────────────────────────────────────────────────────

GREETINGS = re.compile(
    r"\b(hi|hello|hey|oi|eii|ei|eiee|hlo|hallo|good\s*morning|good\s*night|"
    r"good\s*afternoon|good\s*evening|subho\s*sakal|shubho\s*ratri|kamon\s*acho|"
    r"ki\s*obostha|ki\s*korchis|ki\s*korbi|kothai|eii)\b",
    re.IGNORECASE,
)

FAREWELLS = re.compile(
    r"\b(bye|tata|good\s*night|gn|gnight|chal\s*bye|chal|rakhi|thik\s*ache|accha|"
    r"chol|bari\s*jabi|ghumabo|ghuma|chal\s*ghuma|chal\s*thak|marbo|mar)\b",
    re.IGNORECASE,
)

LOVE = re.compile(
    r"\b(valobashi|bhalobashi|valobasa|bhalobasa|valobaschi|love\s*you|love|"
    r"i\s*like\s*you|miss\s*you|miss\s*korchi|miss|tomake\s*bhalobashi|priyo|"
    r"dil\s*diye|mon|bhalobasa|heart|valobashi)\b",
    re.IGNORECASE,
)

FLIRTY = re.compile(
    r"\b(sundor|sundori|beautiful|pretty|hot|sexy|mon\s*mone|mone\s*hoy|"
    r"kache\s*asho|ektu\s*kache|tor\s*mukh|chokh|ki\s*lagche|jniso)\b",
    re.IGNORECASE,
)

SAD = re.compile(
    r"\b(dukkho|kichu\s*bolte\s*parchi|bhalo\s*lagche\s*na|kosto|mono\s*kharaap|"
    r"kharaap|romanchok|cry|rona|valo\s*lagche\s*na|bore|lonely|ekeko|"
    r"ekla|nekla|nosto|kostu|dard|takle|dukhi)\b",
    re.IGNORECASE,
)

ANGRY = re.compile(
    r"\b(raag|raagchi|raag\s*hoyeche|marbo|hate\s*you|bhalo\s*na|ekdom\s*na|noy|"
    r"raag|khotta|ghissani|pagol|pagli|toke)\b",
    re.IGNORECASE,
)

QUESTIONS = re.compile(
    r"\b(ki|kano|keno|kno|kire|kisher|kothay|kakhon|kemon|jante\s*chai|bol|"
    r"bolchi|bol\s*na|sotti|kotha|bolbi|bolte|bolis|bolchis|bolle|bollo|bolchil)\b",
    re.IGNORECASE,
)

AGREE = re.compile(
    r"\b(ha|hmm|hm|ok|thik\s*ache|accha|theek\s*ache|ji|hyy|hy|yes|tai|"
    r"agree|thik|bujhchi|bujhlam)\b",
    re.IGNORECASE,
)

DISAGREE = re.compile(
    r"\b(na|nah|ekdom\s*na|bujhina|parbo\s*na|noi|nahi|bujhte\s*parchi|"
    r"na\s*re|na\s*bolchi|hobe\s*na|naa|no)\b",
    re.IGNORECASE,
)

FOOD = re.compile(
    r"\b(khabar|khao|khaisi|khaiso|khete|kheye|bhat|mach|mangsho|murgi|"
    r"ranna|pakha|pet|khaddo|nashta|chai|cha|dudh|biscuit)\b",
    re.IGNORECASE,
)

SLEEP = re.compile(
    r"\b(ghum|ghumo|ghuma|ghumiye|ghumacchi|ghumano|nite|soya|soya|"
    r"rat|raat|good\s*night|gn|shute|shuti)\b",
    re.IGNORECASE,
)

STUDY = re.compile(
    r"\b(porishona|porishona|study|padhai|exam|result|marks|class|college|"
    r"school|teacher|mam|sir|assignment|homework|test)\b",
    re.IGNORECASE,
)

MISS = re.compile(
    r"\b(miss|miss\s*korchi|miss\s*kore|miss\s*korte|ichche|mane|"
    r"mane\s*na|mon\s*ache|mon\s*nei|mone\s*ache|mone\s*nei)\b",
    re.IGNORECASE,
)

# ─── Markov Chain ──────────────────────────────────────────────────────────────


class MarkovChain:
    """Word-level Markov chain for natural response generation."""

    def __init__(self, order=2):
        self.order = order
        self.chain: dict[tuple, Counter] = defaultdict(Counter)
        self.starters: list[tuple] = []
        self.word_freq = Counter()

    def train(self, texts: list[str]):
        junk_re = re.compile(
            r"(this message was deleted|<Media omitted>|https?://|"
            r"Media omitted|Message deleted|You deleted this message|"
            r"\d{1,2}/\d{1,2}/\d{2,4},\s\d{1,2}:\d{2}\s?[ap]m)",
            re.IGNORECASE,
        )
        for text in texts:
            if junk_re.search(text):
                continue
            words = text.split()
            if len(words) < self.order + 1:
                continue
            self.starters.append(tuple(words[: self.order]))
            self.word_freq.update(words)
            for i in range(len(words) - self.order):
                key = tuple(words[i : i + self.order])
                if i + self.order < len(words):
                    self.chain[key][words[i + self.order]] += 1

    def generate(self, seed: Optional[tuple] = None, max_words: int = 10) -> str:
        if seed is None:
            seed = random.choice(self.starters) if self.starters else ("ki", "korchis")
        current = list(seed)
        result = list(seed)

        for _ in range(max_words - self.order):
            key = tuple(current[-self.order :])
            if key in self.chain:
                candidates = self.chain[key]
                total = sum(candidates.values())
                r = random.random() * total
                cum = 0
                for word, count in candidates.items():
                    cum += count
                    if r <= cum:
                        result.append(word)
                        current.append(word)
                        break
            else:
                break

        return " ".join(result)

    def get_top_words(self, n=30) -> list[str]:
        return [w for w, _ in self.word_freq.most_common(n)]


# ─── Conversation Pair Index ───────────────────────────────────────────────────


class PairIndex:
    """Index conversation pairs for fast lookup by keyword overlap."""

    def __init__(self):
        self.pairs: list[dict] = []
        self.keyword_index: dict[str, list[int]] = defaultdict(list)
        self.response_by_keyword: dict[str, Counter] = defaultdict(Counter)

    # Junk patterns to filter out
    JUNK_RE = re.compile(
        r"(this message was deleted|<Media omitted>|<This message was edited>|"
        r"https?://|Media omitted|Message deleted|You deleted this message)",
        re.IGNORECASE,
    )
    TIMESTAMP_RE = re.compile(r"\d{1,2}/\d{1,2}/\d{2,4},\s\d{1,2}:\d{2}\s?[ap]m\s*-")
    NAME_RE = re.compile(r"\b(shubham|mallick|aishee|radhee)\b", re.IGNORECASE)

    def load(self, pairs_path: str):
        with open(pairs_path, "r", encoding="utf-8") as f:
            for line in f:
                p = json.loads(line)
                # Filter junk responses
                if (
                    self.JUNK_RE.search(p["ai_reply"])
                    or self.TIMESTAMP_RE.search(p["ai_reply"])
                    or len(p["ai_reply"].strip()) < 1
                    or len(p["ai_reply"]) > 200
                ):
                    continue
                idx = len(self.pairs)
                self.pairs.append(p)

                # Index by keywords in user message
                words = set(p["user_msg"].lower().split())
                for w in words:
                    if len(w) > 2:
                        self.keyword_index[w].append(idx)
                        self.response_by_keyword[w][p["ai_reply"]] += 1

    def find_best_match(self, user_msg: str, top_n=5) -> list[dict]:
        """Find pairs with highest keyword overlap."""
        user_words = set(user_msg.lower().split())
        scores: dict[int, int] = defaultdict(int)

        for w in user_words:
            if w in self.keyword_index:
                for idx in self.keyword_index[w]:
                    scores[idx] += 1

        # Sort by score, return top matches
        sorted_pairs = sorted(scores.items(), key=lambda x: -x[1])[:top_n]
        return [
            {
                "user_msg": self.pairs[idx]["user_msg"],
                "ai_reply": self.pairs[idx]["ai_reply"],
                "score": score,
            }
            for idx, score in sorted_pairs
        ]

    def get_common_reply(self, keyword: str) -> Optional[str]:
        """Get most common reply for a keyword."""
        if keyword in self.response_by_keyword:
            return self.response_by_keyword[keyword].most_common(1)[0][0]
        return None


# ─── Emoji Frequency ───────────────────────────────────────────────────────────

EMOJI_RE = re.compile(
    "["
    "\U0001f600-\U0001f64f\U0001f300-\U0001f5ff\U0001f680-\U0001f6ff"
    "\U0001f1e0-\U0001f1ff\U00002702-\U000027b0\U000024c2-\U0001f251"
    "\U0001f900-\U0001f9ff\U0001fa00-\U0001fa6f\U0001fa70-\U0001faff"
    "\U0000fe0f\U0000200d\U000020e3"
    "]+",
    flags=re.UNICODE,
)

# ─── Response Templates (derived from dataset top patterns) ────────────────────

RESPONSES = {
    "greeting": [
        "Ei",
        "Bol",
        "Ki",
        "Ha",
        "Accha",
        "Hmm",
        "Ei bolo",
        "Ki holo",
        "Accha bolo",
        "Ki korchis",
        "Bol na",
        "Ki",
        "Hmm bol",
    ],
    "farewell": [
        "Accha",
        "Tata",
        "Ghumao",
        "Thak",
        "Hm",
        "Ghumo tui",
        "Ok bye",
        "Accha bye",
        "Hm good night",
        "Tata 🫠",
    ],
    "love": [
        "Ha ha tui bol na ki korbi",
        "😒 Porer kotha bol",
        "Hmm",
        "Ami ki jaani na 😶",
        "Bol na ki lagche",
        "Accha tai?",
        "Valobasa ta toke-i jay",
        "Hm",
        "Na bolbo na",
        "Eta ki holo akta",
    ],
    "flirty": [
        "😏 Ki hoyeche",
        "Tui to ar giye asbi nai tai",
        "😒 Nischoi bolte hobe?",
        "Ooooo",
        "Kiser upor itna confident",
        "Accha tai? 😒",
        "Ami sundori? Toke laglo 😏",
        "Na baba ami normal",
        "Eta ki holo akta? 🙄",
    ],
    "sad": [
        "Ki holo? Bol na",
        "Ami achi ki samasya",
        "Tension koro na",
        "Bol sab ki holo",
        "Rag holeo bol",
        "Ki hobe bolo",
        "Ami ki korte pari",
        "Amake kotha bolo",
    ],
    "angry": [
        "Ki holo suddenly",
        "Rag kano? Bol",
        "Accha karon bol",
        "Ami ki korlam",
        "Kano eto raag",
        "Amake ki dosh",
        "Hmm ki hoyeche",
        "Accha tham ektu bol",
    ],
    "question": [
        "Ami ki korchi",
        "Amake bol",
        "Kano ki holo",
        "Jani na",
        "Accha bolo ki",
        "Hmm amake kotha bolo",
        "Ki obostha",
        "Ami bolchi to",
    ],
    "agree": [
        "Ha tai ki 😒",
        "Hmm thik ache",
        "Accha",
        "Hm bolchi",
        "Tai",
        "Haa",
        "Ok",
        "Hmm",
    ],
    "disagree": [
        "Na",
        "Na re",
        "Na bolchi na",
        "Ekdom na",
        "Hmm na",
        "Bujhina",
        "Na hoye na",
        "Na ei ta hobe na",
    ],
    "food": [
        "Ki kheyechis",
        "Na khetam",
        "Hm khaisi",
        "Ki khabo",
        "Accha ki kheyechis",
        "Ami ki khabo",
        "Bol ki khabo",
        "Bhat kheyechi",
        "Cha khabo",
    ],
    "sleep": [
        "Ghumacchi",
        "Ghumabo",
        "Na ghumacchi na",
        "Ki ghumo tui",
        "Hm ghuma",
        "Ghumano",
        "Na ghumabo",
        "Tumi ki ghumo",
    ],
    "study": [
        "Porishona hocche na",
        "Exam ta kemon gelo",
        "Padhai ki hocche",
        "Accha ki porchis",
        "Hmm study ta thik ache",
        "Ki subject porchis",
        "Exam ta ready",
    ],
    "miss": [
        "Hmm miss kore",
        "Accha tai",
        "Ami ki",
        "Na",
        "Miss korchi na",
        "Hm",
        "Tui ki miss korchis",
    ],
    "normal": [
        "Hmm",
        "Accha",
        "Ki",
        "Bol",
        "Accha bolo",
        "Hmm bol",
        "Ki holo",
        "Hm",
        "Accha tai ki?",
        "Bol na ektu",
        "Ki hobe bol",
        "Amake bol na",
        "Accha tai?",
        "Hmm ki bolbi",
        "Ami ki bolte pari",
        "Bol na",
        "Ki obostha",
        "Hm holo ki?",
        "Amake bol na",
        "Accha ta ki?",
    ],
}

# Time-based emojis
TIME_EMOJIS = {
    "morning": ["🌞", "☀️", "🌅", "☕"],
    "afternoon": ["🫠", "😤", "☀️", "🍵"],
    "evening": ["🌅", "🌇", "✨", "💫"],
    "night": ["🌙", "😴", "💤", "✨"],
}

# Intent → emoji pool
INTENT_EMOJIS = {
    "greeting": ["🙂", "😏", "😊", "💫"],
    "farewell": ["💤", "🌙", "😴", "✨"],
    "love": ["❤️", "💕", "💗", "🫶", "💖", "🥰", "🫠"],
    "flirty": ["😏", "🥰", "😍", "🫠", "🤭", "😘"],
    "sad": ["😢", "😭", "😔", "💔", "😶", "🥺"],
    "angry": ["😒", "😤", "🫤", "😐", "😑"],
    "question": ["🧐", "🤔", "😶", "😏"],
    "food": ["🫠", "😋", "🤤", "🍕", "🍛"],
    "sleep": ["💤", "😴", "🌙", "💤"],
    "miss": ["🥺", "🫠", "❤️", "💕"],
}

DEFAULT_EMOJIS = [
    "😏",
    "🙄",
    "😒",
    "🫠",
    "😶",
    "😌",
    "🧐",
    "😑",
    "🥹",
    "🤭",
    "😐",
    "🙂",
]


# ─── Engine ────────────────────────────────────────────────────────────────────


class CompanionEngine:
    def __init__(self):
        self.markov = MarkovChain(order=2)
        self.pair_index = PairIndex()
        self.loaded = False

    def load(self, data_dir: Optional[str] = None):
        if self.loaded:
            return
        if data_dir is None:
            data_dir = os.path.dirname(os.path.abspath(__file__))

        pairs_path = os.path.join(data_dir, "conversation_pairs.jsonl")
        if not os.path.exists(pairs_path):
            print("[Engine] No dataset found, using templates only")
            self.loaded = True
            return

        # Load pairs
        self.pair_index.load(pairs_path)
        print(f"[Engine] Loaded {len(self.pair_index.pairs)} conversation pairs")

        # Train Markov on all AI replies
        replies = [p["ai_reply"] for p in self.pair_index.pairs]
        self.markov.train(replies)
        print(f"[Engine] Markov chain trained on {len(replies)} replies")

        self.loaded = True

    def detect_intent(self, msg: str) -> str:
        scores = {}
        msg_l = msg.lower().strip()

        for name, pattern in [
            ("greeting", GREETINGS),
            ("farewell", FAREWELLS),
            ("love", LOVE),
            ("flirty", FLIRTY),
            ("sad", SAD),
            ("angry", ANGRY),
            ("question", QUESTIONS),
            ("agree", AGREE),
            ("disagree", DISAGREE),
            ("food", FOOD),
            ("sleep", SLEEP),
            ("study", STUDY),
            ("miss", MISS),
        ]:
            m = pattern.findall(msg_l)
            if m:
                scores[name] = len(m)

        if scores:
            return max(scores, key=lambda k: scores[k])
        return "normal"

    def get_time_of_day(self) -> str:
        from datetime import datetime

        h = datetime.now().hour
        if 5 <= h < 12:
            return "morning"
        elif 12 <= h < 17:
            return "afternoon"
        elif 17 <= h < 21:
            return "evening"
        return "night"

    def _pick_emoji(self, intent: str, time_of_day: str) -> str:
        if random.random() < 0.25:
            return ""
        pool = INTENT_EMOJIS.get(intent, DEFAULT_EMOJIS)
        if intent == "greeting":
            pool = pool + TIME_EMOJIS.get(time_of_day, [])
        return random.choice(pool)

    def _find_dataset_response(self, user_msg: str) -> Optional[str]:
        """Try to find a matching response from the dataset pairs."""
        matches = self.pair_index.find_best_match(user_msg, top_n=5)
        junk_re = re.compile(
            r"(this message was deleted|<Media omitted>|https?://|"
            r"Media omitted|Message deleted|\d{1,2}/\d{1,2}/\d{2,4})",
            re.IGNORECASE,
        )
        if matches:
            # Filter out junk, pick best clean match
            clean = [
                m["ai_reply"]
                for m in matches
                if not junk_re.search(m["ai_reply"]) and len(m["ai_reply"].strip()) > 0
            ]
            if clean:
                return random.choice(clean[:3])
        return None

    def _get_keyword_response(self, user_msg: str) -> Optional[str]:
        """Get most common response for a keyword in the message."""
        words = user_msg.lower().split()
        junk_re = re.compile(
            r"(this message was deleted|<Media omitted>|https?://|"
            r"Media omitted|Message deleted|\d{1,2}/\d{1,2}/\d{2,4})",
            re.IGNORECASE,
        )
        candidates = []
        for w in words:
            reply = self.pair_index.get_common_reply(w)
            if reply and len(reply) > 1 and not junk_re.search(reply):
                candidates.append(reply)
        if candidates:
            return random.choice(candidates)
        return None

    def generate_seed(
        self,
        user_message: str,
        companion_gender: str = "female",
        user_name: Optional[str] = None,
    ) -> dict:
        """
        Layer 1: Generate a structured SEED for the AI polish layer.
        Returns raw intent, mood, direction, and dataset-grounded seed phrases
        that the Groq API will polish into a natural final response.

        Returns: {
            intent, mood, seed_phrases, dataset_match, direction,
            user_name, companion_gender, time_of_day
        }
        """
        if not self.loaded:
            self.load()

        intent = self.detect_intent(user_message)
        time_of_day = self.get_time_of_day()

        # Collect seed phrases from dataset
        seed_phrases = []

        # 1. Dataset pair match (highest quality seed)
        dataset_match = self._find_dataset_response(user_message)
        if dataset_match:
            seed_phrases.append(dataset_match)

        # 2. Keyword-based common replies (secondary seeds)
        keyword_reply = self._get_keyword_response(user_message)
        if keyword_reply and keyword_reply != dataset_match:
            seed_phrases.append(keyword_reply)

        # 3. Template fallback seed
        if not seed_phrases:
            pool = RESPONSES.get(intent, RESPONSES["normal"])
            seed_phrases.append(random.choice(pool))

        # 4. Occasionally add a Markov-generated seed for variety
        if random.random() < 0.2:
            markov_seed = self.markov.generate(max_words=random.randint(3, 6))
            if len(markov_seed) > 3:
                seed_phrases.append(markov_seed)

        # Mood
        mood_map = {
            "greeting": "happy",
            "farewell": "sad",
            "love": "loving",
            "flirty": "playful",
            "sad": "caring",
            "angry": "concerned",
            "question": "normal",
            "agree": "happy",
            "disagree": "annoyed",
            "food": "normal",
            "sleep": "tired",
            "study": "focused",
            "miss": "loving",
            "normal": "normal",
        }

        # Direction hints for the polish layer
        directions = {
            "greeting": "Warm, casual greeting. Match the energy. Short and sweet.",
            "farewell": "Soft goodbye. Slightly sad or caring tone. Keep it brief.",
            "love": "Shy, playful, or warmly deflecting. Never over-the-top. Bengali/Hinglish mix.",
            "flirty": "Tease back, act unbothered, or play along subtly. Use 😒😏🫠.",
            "sad": "Genuine concern. Ask what happened. Be warm and present.",
            "angry": "Calm, ask what went wrong. Don't dismiss feelings.",
            "question": "Answer briefly, maybe with a counter-question. Casual tone.",
            "agree": 'Short agreement. "Ha", "Hmm", "Accha tai".',
            "disagree": 'Gentle but clear. "Na re", "Ekdom na".',
            "food": "Ask what they ate or talk about food. Relatable.",
            "sleepy": "Tired, want to sleep. Gentle and short.",
            "study": "Focused on studies. Ask what they're studying.",
            "miss": "Miss them too, or play shy about it.",
            "normal": "Keep it natural. Match their energy. Short to medium length.",
        }

        return {
            "intent": intent,
            "mood": mood_map.get(intent, "normal"),
            "seed_phrases": seed_phrases[:3],
            "dataset_match": dataset_match,
            "direction": directions.get(intent, directions["normal"]),
            "user_name": user_name,
            "companion_gender": companion_gender,
            "time_of_day": time_of_day,
            "user_message": user_message,
        }

        return {
            "message": response,
            "mood": mood_map.get(intent, "normal"),
            "intent": intent,
            "emoji": emoji,
        }

    def stats(self) -> dict:
        return {
            "pairs": len(self.pair_index.pairs),
            "markov_states": len(self.markov.chain),
            "top_words": dict(self.markov.word_freq.most_common(30)),
        }


# Singleton
_engine: Optional[CompanionEngine] = None


def get_engine() -> CompanionEngine:
    global _engine
    if _engine is None:
        _engine = CompanionEngine()
        _engine.load()
    return _engine
