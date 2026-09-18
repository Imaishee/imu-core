"""
IMU_Heart Inference Module
Loads the trained Transformer model and generates seed responses.
Model files are bundled via Git LFS in the Docker build.
"""

import os
import re
import sys
import pickle
import logging
from typing import Optional, Dict
from datetime import datetime

logger = logging.getLogger("imu-heart")

# Paths relative to this file
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(SCRIPT_DIR, "imu_heart")

TOKENIZER_PATH = os.path.join(MODEL_DIR, "tokenizer.pkl")
BEST_MODEL_PATH = os.path.join(MODEL_DIR, "imu_heart_best.pt")

# Model architecture config (must match training)
MODEL_CONFIG = {
    "dim": 256,
    "n_heads": 8,
    "n_layers": 4,
    "dim_ff": 512,
    "dropout": 0.1,
    "max_len": 512,
}


class IMUHeartInference:
    """Inference wrapper for the trained IMU_Heart model."""

    def __init__(self):
        self.model = None
        self.tokenizer = None
        self.device = "cpu"
        self.loaded = False

    def load(self) -> bool:
        """Load the trained model and tokenizer from local files."""
        try:
            import torch

            # Add imu_heart dir to path so pickle can find IMUHeartTokenizer
            sys.path.insert(0, MODEL_DIR)
            from model import IMUHeartModel

            self.device = "cuda" if torch.cuda.is_available() else "cpu"
            logger.info(f"Using device: {self.device}")

            # Load tokenizer
            if not os.path.exists(TOKENIZER_PATH):
                logger.warning(f"Tokenizer not found: {TOKENIZER_PATH}")
                return False

            with open(TOKENIZER_PATH, "rb") as f:
                self.tokenizer = pickle.load(f)

            vocab_size = self.tokenizer.vocab_size
            logger.info(f"Tokenizer loaded: vocab_size={vocab_size}")

            # Load model
            if not os.path.exists(BEST_MODEL_PATH):
                logger.warning(f"Model not found: {BEST_MODEL_PATH}")
                return False

            self.model = IMUHeartModel(
                vocab_size=vocab_size,
                dim=MODEL_CONFIG["dim"],
                n_heads=MODEL_CONFIG["n_heads"],
                n_layers=MODEL_CONFIG["n_layers"],
                dim_ff=MODEL_CONFIG["dim_ff"],
                dropout=MODEL_CONFIG["dropout"],
                max_len=MODEL_CONFIG["max_len"],
            )

            # Load checkpoint (may contain full training state or just state_dict)
            checkpoint = torch.load(
                BEST_MODEL_PATH, map_location=self.device, weights_only=True
            )

            if isinstance(checkpoint, dict) and "model_state" in checkpoint:
                state_dict = checkpoint["model_state"]
                logger.info(f"Loaded full checkpoint (epoch={checkpoint.get('epoch')})")
            else:
                state_dict = checkpoint
                logger.info("Loaded raw state_dict")

            self.model.load_state_dict(state_dict)
            self.model.to(self.device)
            self.model.eval()

            self.loaded = True
            param_count = sum(p.numel() for p in self.model.parameters())
            logger.info(f"IMU_Heart loaded: {param_count:,} params, {self.device}")
            return True

        except Exception as e:
            logger.error(f"Failed to load IMU_Heart: {e}")
            import traceback

            traceback.print_exc()
            return False

    def _detect_intent(self, msg: str) -> str:
        msg_l = msg.lower()
        patterns = {
            "greeting": r"\b(hi|hello|hey|oi|eii|good\s*morning|good\s*night|kamon|ki\s*korchis)\b",
            "farewell": r"\b(bye|tata|good\s*night|gn|chal\s*bye|ghumabo|ghuma)\b",
            "love": r"\b(valobashi|bhalobashi|love\s*you|love|miss\s*you|bhalobasa|priyo)\b",
            "flirty": r"\b(sundor|sundori|beautiful|pretty|hot|sexy|mone\s*hoy|kache\s*asho)\b",
            "sad": r"\b(dukkho|kichu\s*bolte\s*parchi|bhalo\s*lagche\s*na|kosto|cry|rona|lonely)\b",
            "angry": r"\b(raag|raagchi|marbo|hate\s*you|ekdom\s*na|khotta|pagol)\b",
            "question": r"\b(ki|kano|keno|kire|kisher|kothay|kakhon|kemon|bol\s*na)\b",
            "food": r"\b(khabar|khao|khaisi|khaiso|khete|bhat|mangsho|ranna|chai|cha)\b",
            "sleep": r"\b(ghum|ghumo|ghuma|ghumacchi|ghumano|nite|soya|rat|shute)\b",
            "study": r"\b(porishona|study|padhai|exam|result|class|college|school|assignment)\b",
            "miss": r"\b(miss|miss\s*korchi|miss\s*kore|ichche|mone\s*ache)\b",
        }
        scores = {}
        for intent, pattern in patterns.items():
            matches = re.findall(pattern, msg_l, re.IGNORECASE)
            if matches:
                scores[intent] = len(matches)
        return max(scores, key=scores.get) if scores else "normal"

    def _detect_mood(self, msg: str) -> str:
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
        now = datetime.now()
        hour = now.hour
        if 5 <= hour < 12:
            tod = "morning"
        elif 12 <= hour < 17:
            tod = "afternoon"
        elif 17 <= hour < 21:
            tod = "evening"
        else:
            tod = "night"
        return {"time_of_day": tod, "hour": hour, "day_of_week": now.weekday()}

    def generate(
        self, user_message: str, max_len: int = 50, temperature: float = 0.8
    ) -> Optional[str]:
        if not self.loaded:
            return None

        import torch

        try:
            intent = self._detect_intent(user_message)
            mood = self._detect_mood(user_message)
            tf = self._get_time_features()

            src_ids = self.tokenizer.encode(user_message, max_len=128)
            src_tensor = torch.tensor([src_ids], dtype=torch.long, device=self.device)

            context = {
                "mood": [mood],
                "intent": [intent],
                "time_of_day": [tf["time_of_day"]],
                "mood_shift": ["stable"],
                "hour": [tf["hour"]],
                "day_of_week": [tf["day_of_week"]],
                "time_gap": torch.tensor([[0.0]], device=self.device),
            }

            tgt_ids = [1]  # <sos>

            with torch.no_grad():
                for _ in range(max_len):
                    tgt_tensor = torch.tensor(
                        [tgt_ids], dtype=torch.long, device=self.device
                    )
                    output = self.model(src_tensor, tgt_tensor, context)
                    logits = output["logits"][:, -1, :] / temperature

                    top_k = 20
                    top_vals, top_idx = torch.topk(logits, top_k)
                    probs = torch.softmax(top_vals, dim=-1)
                    chosen = torch.multinomial(probs, 1)
                    next_id = top_idx[0, chosen[0]].item()

                    if next_id == 2:  # <eos>
                        break
                    tgt_ids.append(next_id)

            response = self.tokenizer.decode(tgt_ids[1:])
            response = response.strip()
            return response if response and len(response) >= 2 else None

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
    inference = get_inference()
    if inference.loaded:
        return True
    return inference.load()
