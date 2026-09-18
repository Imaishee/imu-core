"""
IMU_Heart Inference Module
Loads the trained Transformer model and generates seed responses.
"""

import os
import re
import json
import pickle
import random
import logging
from typing import Optional, Dict, List
from datetime import datetime

logger = logging.getLogger("imu-heart")

# Model file paths
MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "imu_heart")
BEST_MODEL_PATH = os.path.join(MODEL_DIR, "imu_heart_best.pt")
FINAL_MODEL_PATH = os.path.join(MODEL_DIR, "imu_heart_final.pt")
TOKENIZER_PATH = os.path.join(MODEL_DIR, "tokenizer.pkl")


class IMUHeartInference:
    """Inference wrapper for the trained IMU_Heart model."""

    def __init__(self):
        self.model = None
        self.tokenizer = None
        self.device = "cpu"
        self.loaded = False

    def load(self) -> bool:
        """Load the trained model and tokenizer."""
        try:
            import torch
            from imu_heart.model import IMUHeartModel, IMUHeartTokenizer

            # Determine device
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
            logger.info(f"Using device: {self.device}")

            # Load tokenizer
            if not os.path.exists(TOKENIZER_PATH):
                logger.warning(f"Tokenizer not found at {TOKENIZER_PATH}")
                return False

            with open(TOKENIZER_PATH, "rb") as f:
                self.tokenizer = pickle.load(f)

            vocab_size = self.tokenizer.vocab_size
            logger.info(f"Tokenizer loaded: vocab_size={vocab_size}")

            # Load model
            model_path = (
                BEST_MODEL_PATH if os.path.exists(BEST_MODEL_PATH) else FINAL_MODEL_PATH
            )
            if not os.path.exists(model_path):
                logger.warning(f"Model not found at {model_path}")
                return False

            # Create model with same architecture as training
            self.model = IMUHeartModel(
                vocab_size=vocab_size,
                dim=256,
                n_heads=8,
                n_layers=4,
                dim_ff=512,
                dropout=0.1,
                max_len=512,
            )

            # Load weights
            state_dict = torch.load(
                model_path, map_location=self.device, weights_only=True
            )
            self.model.load_state_dict(state_dict)
            self.model.to(self.device)
            self.model.eval()

            self.loaded = True
            logger.info(
                f"IMU_Heart model loaded: {self.model.count_parameters():,} params"
            )
            return True

        except Exception as e:
            logger.error(f"Failed to load IMU_Heart model: {e}")
            return False

    def _detect_intent(self, msg: str) -> str:
        """Quick intent detection for model context."""
        msg_l = msg.lower()

        patterns = {
            "greeting": r"\b(hi|hello|hey|oi|eii|eiee|good\s*morning|good\s*night|kamon\s*acho|ki\s*korchis)\b",
            "farewell": r"\b(bye|tata|good\s*night|gn|chal\s*bye|ghumabo|ghuma)\b",
            "love": r"\b(valobashi|bhalobashi|love\s*you|love|miss\s*you|miss\s*korchi|bhalobasa|priyo)\b",
            "flirty": r"\b(sundor|sundori|beautiful|pretty|hot|sexy|mone\s*hoy|kache\s*asho)\b",
            "sad": r"\b(dukkho|kichu\s*bolte\s*parchi|bhalo\s*lagche\s*na|kosto|cry|rona|lonely)\b",
            "angry": r"\b(raag|raagchi|marbo|hate\s*you|bhalo\s*na|ekdom\s*na|khotta|pagol)\b",
            "question": r"\b(ki|kano|keno|kire|kisher|kothay|kakhon|kemon|bol\s*na)\b",
            "food": r"\b(khabar|khao|khaisi|khaiso|khete|bhat|mangsho|ranna|chai|cha)\b",
            "sleep": r"\b(ghum|ghumo|ghuma|ghumacchi|ghumano|nite|soya|rat|shute)\b",
            "study": r"\b(porishona|study|padhai|exam|result|class|college|school|assignment)\b",
            "miss": r"\b(miss|miss\s*korchi|miss\s*kore|ichche|mane\s*na|mone\s*ache)\b",
        }

        scores = {}
        for intent, pattern in patterns.items():
            matches = re.findall(pattern, msg_l, re.IGNORECASE)
            if matches:
                scores[intent] = len(matches)

        return max(scores, key=scores.get) if scores else "normal"

    def _detect_mood(self, msg: str) -> str:
        """Quick mood detection."""
        msg_l = msg.lower()
        if re.search(r"(dukkho|sad|cry|rona|bhalo\s*lagche\s*na|lonely|kosto)", msg_l):
            return "sad"
        if re.search(r"(valobashi|bhalobashi|love|miss\s*you|bhalobasa)", msg_l):
            return "loving"
        if re.search(r"(raag|angry|hate|marbo|khotta)", msg_l):
            return "angry"
        if re.search(r"(sundor|beautiful|hot|sexy|mone\s*hoy)", msg_l):
            return "flirty"
        if re.search(r"(hii?|hello|hey|good\s*morning|kamon)", msg_l):
            return "happy"
        return "normal"

    def _get_time_features(self) -> Dict:
        """Get time-based context features."""
        now = datetime.now()
        hour = now.hour
        day_of_week = now.weekday()

        if 5 <= hour < 12:
            time_of_day = "morning"
        elif 12 <= hour < 17:
            time_of_day = "afternoon"
        elif 17 <= hour < 21:
            time_of_day = "evening"
        else:
            time_of_day = "night"

        return {
            "time_of_day": time_of_day,
            "hour": hour,
            "day_of_week": day_of_week,
        }

    @torch.no_grad()
    def generate(
        self, user_message: str, max_len: int = 50, temperature: float = 0.8
    ) -> Optional[str]:
        """
        Generate a response seed from the trained model.

        Args:
            user_message: The user's input message
            max_len: Maximum response length in tokens
            temperature: Sampling temperature

        Returns:
            Generated response text, or None if generation fails
        """
        if not self.loaded:
            logger.warning("Model not loaded, cannot generate")
            return None

        import torch

        try:
            # Detect context
            intent = self._detect_intent(user_message)
            mood = self._detect_mood(user_message)
            time_features = self._get_time_features()

            # Tokenize input
            src_ids = self.tokenizer.encode(user_message, max_len=128)
            src_tensor = torch.tensor([src_ids], dtype=torch.long, device=self.device)

            # Build context
            context = {
                "mood": [mood],
                "intent": [intent],
                "time_of_day": [time_features["time_of_day"]],
                "mood_shift": ["stable"],
                "hour": [time_features["hour"]],
                "day_of_week": [time_features["day_of_week"]],
                "time_gap": torch.tensor(
                    [[0.0]], device=self.device
                ),  # No time gap for fresh message
            }

            # Start with <sos> token
            tgt_ids = [1]  # <sos>
            tgt_tensor = torch.tensor([tgt_ids], dtype=torch.long, device=self.device)

            # Autoregressive generation
            for _ in range(max_len):
                tgt_tensor = torch.tensor(
                    [tgt_ids], dtype=torch.long, device=self.device
                )

                output = self.model(src_tensor, tgt_tensor, context)
                logits = output["logits"][:, -1, :] / temperature

                # Sample from top-k
                top_k = 20
                top_vals, top_idx = torch.topk(logits, top_k)
                probs = torch.softmax(top_vals, dim=-1)
                chosen = torch.multinomial(probs, 1)
                next_id = top_idx[0, chosen[0]].item()

                if next_id == 2:  # <eos>
                    break

                tgt_ids.append(next_id)

            # Decode
            response = self.tokenizer.decode(tgt_ids[1:])  # Skip <sos>

            # Clean up
            response = response.strip()
            if not response or len(response) < 2:
                return None

            return response

        except Exception as e:
            logger.error(f"IMU_Heart generation failed: {e}")
            return None


# Singleton
_inference: Optional[IMUHeartInference] = None


def get_inference() -> IMUHeartInference:
    global _inference
    if _inference is None:
        _inference = IMUHeartInference()
    return _inference


def load_model() -> bool:
    """Load the IMU_Heart model. Returns True if successful."""
    inference = get_inference()
    if inference.loaded:
        return True
    return inference.load()
