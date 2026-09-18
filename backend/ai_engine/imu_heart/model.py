"""
IMU_Heart - Neural Response Model
Transformer-based model that learns conversation patterns, mood shifts, and style.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
import math
from typing import Dict, Optional, Tuple


class MoodEmbedding(nn.Module):
    """Learnable mood + intent + time embeddings."""

    MOODS = [
        "happy",
        "sad",
        "angry",
        "loving",
        "flirty",
        "tired",
        "hungry",
        "excited",
        "caring",
        "normal",
        "annoyed",
        "focused",
        "unknown",
    ]
    INTENTS = [
        "greeting",
        "farewell",
        "love",
        "flirty",
        "sad",
        "angry",
        "question",
        "food",
        "sleep",
        "study",
        "miss",
        "normal",
    ]
    TIMES = ["morning", "afternoon", "evening", "night"]
    SHIFTS = [
        "stable",
        "happy_to_sad",
        "sad_to_happy",
        "normal_to_loving",
        "happy_to_angry",
        "angry_to_sad",
        "sad_to_loving",
        "loving_to_sad",
        "flirty_to_loving",
        "normal_to_tired",
        "unknown",
    ]

    def __init__(self, dim: int):
        super().__init__()
        self.mood_emb = nn.Embedding(len(self.MOODS), dim)
        self.intent_emb = nn.Embedding(len(self.INTENTS), dim)
        self.time_emb = nn.Embedding(len(self.TIMES), dim)
        self.shift_emb = nn.Embedding(len(self.SHIFTS), dim)
        self.hour_emb = nn.Embedding(24, dim)
        self.day_emb = nn.Embedding(7, dim)

    def _idx(self, lst, val, default=None):
        try:
            return lst.index(val)
        except (ValueError, AttributeError):
            return default if default is not None else len(lst) - 1

    def forward(self, mood, intent, time_of_day, mood_shift, hour, day_of_week):
        batch = mood.shape[0] if isinstance(mood, torch.Tensor) else 1
        device = next(self.parameters()).device

        if not isinstance(mood, torch.Tensor):
            mood = torch.tensor(
                [self._idx(self.MOODS, m) for m in mood], device=device
            ).unsqueeze(-1)
            intent = torch.tensor(
                [self._idx(self.INTENTS, i) for i in intent], device=device
            ).unsqueeze(-1)
            time_of_day = torch.tensor(
                [self._idx(self.TIMES, t) for t in time_of_day], device=device
            ).unsqueeze(-1)
            mood_shift = torch.tensor(
                [self._idx(self.SHIFTS, s) for s in mood_shift], device=device
            ).unsqueeze(-1)
            hour = torch.tensor(
                hour if isinstance(hour, list) else [hour], device=device
            ).unsqueeze(-1)
            day_of_week = torch.tensor(
                day_of_week if isinstance(day_of_week, list) else [day_of_week],
                device=device,
            ).unsqueeze(-1)

        return (
            self.mood_emb(mood)
            + self.intent_emb(intent)
            + self.time_emb(time_of_day)
            + self.shift_emb(mood_shift)
            + self.hour_emb(hour)
            + self.day_emb(day_of_week)
        )


class PositionalEncoding(nn.Module):
    pe: torch.Tensor

    def __init__(self, dim: int, max_len: int = 512):
        super().__init__()
        pe = torch.zeros(max_len, dim)
        pos = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
        div = torch.exp(torch.arange(0, dim, 2).float() * (-math.log(10000.0) / dim))
        pe[:, 0::2] = torch.sin(pos * div)
        pe[:, 1::2] = torch.cos(pos * div)
        self.register_buffer("pe", pe.unsqueeze(0))

    def forward(self, x):
        pe: torch.Tensor = self.pe  # type: ignore[assignment]
        return x + pe[:, : x.size(1)]


class IMUHeartModel(nn.Module):
    """
    IMU_Heart: Transformer-based companion response model.

    Architecture:
    - Token embeddings + positional encoding
    - Mood/intent/time context embedding (added to first token)
    - Transformer encoder-decoder
    - Output: response token logits + mood/intent classification heads

    Input: tokenized user message + context features
    Output: response token logits, mood prediction, intent prediction
    """

    def __init__(
        self,
        vocab_size: int = 30000,
        dim: int = 256,
        n_heads: int = 8,
        n_layers: int = 4,
        dim_ff: int = 512,
        dropout: float = 0.1,
        max_len: int = 512,
    ):
        super().__init__()
        self.dim = dim
        self.vocab_size = vocab_size

        # Token embeddings
        self.token_emb = nn.Embedding(vocab_size, dim)
        self.pos_enc = PositionalEncoding(dim, max_len)

        # Context embeddings (mood, intent, time, etc.)
        self.context_mood = MoodEmbedding(dim)
        self.context_proj = nn.Linear(dim, dim)

        # Transformer
        encoder_layer = nn.TransformerEncoderLayer(
            dim, n_heads, dim_ff, dropout, batch_first=True
        )
        self.encoder = nn.TransformerEncoder(encoder_layer, n_layers)

        decoder_layer = nn.TransformerDecoderLayer(
            dim, n_heads, dim_ff, dropout, batch_first=True
        )
        self.decoder = nn.TransformerDecoder(decoder_layer, n_layers)

        # Output heads
        self.output_proj = nn.Linear(dim, vocab_size)
        self.mood_head = nn.Linear(dim, len(MoodEmbedding.MOODS))
        self.intent_head = nn.Linear(dim, len(MoodEmbedding.INTENTS))

        # Time gap embedding (continuous value)
        self.time_gap_proj = nn.Sequential(
            nn.Linear(1, dim // 4),
            nn.ReLU(),
            nn.Linear(dim // 4, dim),
        )

        self.dropout = nn.Dropout(dropout)

    def encode(
        self,
        src: torch.Tensor,
        context: Dict[str, torch.Tensor],
    ) -> torch.Tensor:
        """Encode user message + context."""
        # Token embeddings
        x = self.dropout(self.pos_enc(self.token_emb(src)))

        # Add context to first position
        ctx = self.context_mood(
            context["mood"],
            context["intent"],
            context["time_of_day"],
            context["mood_shift"],
            context["hour"],
            context["day_of_week"],
        )
        ctx = self.context_proj(ctx)

        # Time gap feature
        tg = self.time_gap_proj(context["time_gap"].float().unsqueeze(-1))

        # Inject context
        x[:, 0:1] = x[:, 0:1] + ctx + tg

        # Encode
        memory = self.encoder(x)
        return memory

    def decode(
        self,
        tgt: torch.Tensor,
        memory: torch.Tensor,
    ) -> torch.Tensor:
        """Decode response tokens."""
        x = self.dropout(self.pos_enc(self.token_emb(tgt)))
        # Causal mask
        sz = x.size(1)
        mask = nn.Transformer.generate_square_subsequent_mask(sz, device=x.device)
        x = self.decoder(x, memory, tgt_mask=mask)
        return x

    def forward(
        self,
        src: torch.Tensor,
        tgt: torch.Tensor,
        context: Dict[str, torch.Tensor],
    ) -> Dict[str, torch.Tensor]:
        """
        Full forward pass.

        Returns:
            logits: (batch, seq_len, vocab_size)
            mood_logits: (batch, num_moods)
            intent_logits: (batch, num_intents)
        """
        memory = self.encode(src, context)
        decoded = self.decode(tgt, memory)

        logits = self.output_proj(decoded)

        # Use first token for classification
        mood_logits = self.mood_head(memory[:, 0])
        intent_logits = self.intent_head(memory[:, 0])

        return {
            "logits": logits,
            "mood_logits": mood_logits,
            "intent_logits": intent_logits,
        }

    def count_parameters(self) -> int:
        return sum(p.numel() for p in self.parameters() if p.requires_grad)


class IMUHeartTokenizer:
    """Simple tokenizer for Bengali/Hindi/English mixed text."""

    def __init__(self, vocab_size: int = 30000):
        self.vocab_size = vocab_size
        self.word2idx = {"<pad>": 0, "<sos>": 1, "<eos>": 2, "<unk>": 3}
        self.idx2word = {v: k for k, v in self.word2idx.items()}
        self.word_freq = {}

    def fit(self, texts: list):
        """Build vocabulary from texts."""
        for text in texts:
            words = self._tokenize(text)
            for w in words:
                self.word_freq[w] = self.word_freq.get(w, 0) + 1

        # Sort by frequency, take top vocab_size
        sorted_words = sorted(self.word_freq.items(), key=lambda x: -x[1])
        for word, _ in sorted_words[: self.vocab_size - 4]:
            idx = len(self.word2idx)
            self.word2idx[word] = idx
            self.idx2word[idx] = word

    def _tokenize(self, text: str) -> list:
        """Tokenize mixed Bengali/Hindi/English text."""
        import re

        # Split on whitespace and punctuation, keep emojis
        tokens = re.findall(r"[\w]+|[^\s\w]", text.lower())
        return tokens

    def encode(self, text: str, max_len: int = 128) -> list:
        tokens = self._tokenize(text)
        ids = [self.word2idx.get(t, 3) for t in tokens]  # 3 = <unk>
        ids = ids[:max_len]
        # Pad
        ids += [0] * (max_len - len(ids))
        return ids

    def decode(self, ids: list) -> str:
        words = []
        for idx in ids:
            if idx == 2:  # <eos>
                break
            if idx in (0, 1, 3):  # <pad>, <sos>, <unk>
                continue
            word = self.idx2word.get(idx, "")
            if word:
                words.append(word)
        return " ".join(words)


def build_context_features(pair: dict, tokenizer: IMUHeartTokenizer) -> dict:
    """Convert a training pair to model input context features."""
    return {
        "mood": pair.get("input_mood", "normal"),
        "intent": pair.get("input_intent", "normal"),
        "time_of_day": pair.get("time_of_day", "normal"),
        "mood_shift": pair.get("mood_shift", "stable"),
        "hour": pair.get("hour", 12),
        "day_of_week": pair.get("day_of_week", 0),
        "time_gap": min(
            pair.get("time_gap_seconds", 0) / 3600.0, 24.0
        ),  # hours, capped at 24
    }
