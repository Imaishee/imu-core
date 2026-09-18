"""
IMU_Heart - Training Pipeline
Trains the neural model on processed conversation data.
Looped training with validation, checkpointing, and mood shift learning.
"""

import os
import sys
import json
import time
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader, random_split
from typing import Dict, List, Optional

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from model import (
    IMUHeartModel,
    IMUHeartTokenizer,
    build_context_features,
    MoodEmbedding,
)


# ─── Dataset ───────────────────────────────────────────────────────────────────


class IMUHeartDataset(Dataset):
    """Dataset for IMU_Heart training."""

    def __init__(
        self,
        data_path: str,
        tokenizer: IMUHeartTokenizer,
        max_src_len: int = 128,
        max_tgt_len: int = 64,
    ):
        self.tokenizer = tokenizer
        self.max_src_len = max_src_len
        self.max_tgt_len = max_tgt_len
        self.pairs = []

        with open(data_path, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    pair = json.loads(line.strip())
                    self.pairs.append(pair)
                except json.JSONDecodeError:
                    continue

    def __len__(self):
        return len(self.pairs)

    def __getitem__(self, idx) -> Dict[str, torch.Tensor]:
        pair = self.pairs[idx]

        src_ids = self.tokenizer.encode(pair["input_text"], self.max_src_len)
        tgt_text = pair.get("output_text", "")
        tgt_ids = self.tokenizer.encode(tgt_text, self.max_tgt_len)

        context = build_context_features(pair, self.tokenizer)

        # Convert context to tensors
        ctx_tensors = {}
        mood_list = MoodEmbedding.MOODS
        intent_list = MoodEmbedding.INTENTS
        time_list = MoodEmbedding.TIMES
        shift_list = MoodEmbedding.SHIFTS

        def safe_idx(lst, val):
            try:
                return lst.index(val)
            except (ValueError, AttributeError):
                return len(lst) - 1

        ctx_tensors["mood"] = torch.tensor(
            safe_idx(mood_list, context["mood"]), dtype=torch.long
        )
        ctx_tensors["intent"] = torch.tensor(
            safe_idx(intent_list, context["intent"]), dtype=torch.long
        )
        ctx_tensors["time_of_day"] = torch.tensor(
            safe_idx(time_list, context["time_of_day"]), dtype=torch.long
        )
        ctx_tensors["mood_shift"] = torch.tensor(
            safe_idx(shift_list, context["mood_shift"]), dtype=torch.long
        )
        ctx_tensors["hour"] = torch.tensor(context["hour"], dtype=torch.long)
        ctx_tensors["day_of_week"] = torch.tensor(
            context["day_of_week"], dtype=torch.long
        )
        ctx_tensors["time_gap"] = torch.tensor(context["time_gap"], dtype=torch.float32)

        # Output mood/intent targets
        ctx_tensors["target_mood"] = torch.tensor(
            safe_idx(mood_list, pair.get("output_mood", "normal")), dtype=torch.long
        )
        ctx_tensors["target_intent"] = torch.tensor(
            safe_idx(intent_list, pair.get("output_intent", "normal")), dtype=torch.long
        )

        return {
            "src_ids": torch.tensor(src_ids, dtype=torch.long),
            "tgt_ids": torch.tensor(tgt_ids, dtype=torch.long),
            **ctx_tensors,
        }


# ─── Collate ───────────────────────────────────────────────────────────────────


def collate_fn(batch):
    """Stack batch items."""
    return {key: torch.stack([item[key] for item in batch]) for key in batch[0].keys()}


# ─── Trainer ───────────────────────────────────────────────────────────────────


class IMUHeartTrainer:
    """Trains the IMU_Heart model with looped training."""

    def __init__(
        self,
        model: IMUHeartModel,
        tokenizer: IMUHeartTokenizer,
        lr: float = 3e-4,
        device: str = "cpu",
    ):
        self.model = model.to(device)
        self.tokenizer = tokenizer
        self.device = device
        self.optimizer = optim.AdamW(model.parameters(), lr=lr, weight_decay=0.01)
        self.scheduler = optim.lr_scheduler.CosineAnnealingLR(self.optimizer, T_max=10)
        self.crit_lm = nn.CrossEntropyLoss(ignore_index=0)  # ignore padding
        self.crit_mood = nn.CrossEntropyLoss()
        self.crit_intent = nn.CrossEntropyLoss()

    def train_epoch(self, dataloader: DataLoader) -> Dict[str, float]:
        self.model.train()
        total_loss = 0
        total_lm = 0
        total_mood = 0
        total_intent = 0
        n_batches = 0

        for batch in dataloader:
            src = batch["src_ids"].to(self.device)
            tgt = batch["tgt_ids"].to(self.device)

            context = {
                "mood": batch["mood"].to(self.device),
                "intent": batch["intent"].to(self.device),
                "time_of_day": batch["time_of_day"].to(self.device),
                "mood_shift": batch["mood_shift"].to(self.device),
                "hour": batch["hour"].to(self.device),
                "day_of_week": batch["day_of_week"].to(self.device),
                "time_gap": batch["time_gap"].to(self.device),
            }

            # Teacher forcing: use tgt[:, :-1] as decoder input
            tgt_input = tgt[:, :-1]
            tgt_output = tgt[:, 1:]

            outputs = self.model(src, tgt_input, context)

            # Language model loss
            lm_loss = self.crit_lm(
                outputs["logits"].reshape(-1, outputs["logits"].size(-1)),
                tgt_output.reshape(-1),
            )

            # Mood classification loss
            mood_loss = self.crit_mood(
                outputs["mood_logits"], batch["target_mood"].to(self.device)
            )

            # Intent classification loss
            intent_loss = self.crit_intent(
                outputs["intent_logits"], batch["target_intent"].to(self.device)
            )

            # Combined loss
            loss = lm_loss + 0.3 * mood_loss + 0.3 * intent_loss

            self.optimizer.zero_grad()
            loss.backward()
            torch.nn.utils.clip_grad_norm_(self.model.parameters(), 1.0)
            self.optimizer.step()

            total_loss += loss.item()
            total_lm += lm_loss.item()
            total_mood += mood_loss.item()
            total_intent += intent_loss.item()
            n_batches += 1

        return {
            "loss": total_loss / max(n_batches, 1),
            "lm_loss": total_lm / max(n_batches, 1),
            "mood_loss": total_mood / max(n_batches, 1),
            "intent_loss": total_intent / max(n_batches, 1),
        }

    @torch.no_grad()
    def validate(self, dataloader: DataLoader) -> Dict[str, float]:
        self.model.eval()
        total_loss = 0
        total_lm = 0
        n_batches = 0

        for batch in dataloader:
            src = batch["src_ids"].to(self.device)
            tgt = batch["tgt_ids"].to(self.device)

            context = {
                "mood": batch["mood"].to(self.device),
                "intent": batch["intent"].to(self.device),
                "time_of_day": batch["time_of_day"].to(self.device),
                "mood_shift": batch["mood_shift"].to(self.device),
                "hour": batch["hour"].to(self.device),
                "day_of_week": batch["day_of_week"].to(self.device),
                "time_gap": batch["time_gap"].to(self.device),
            }

            tgt_input = tgt[:, :-1]
            tgt_output = tgt[:, 1:]

            outputs = self.model(src, tgt_input, context)
            lm_loss = self.crit_lm(
                outputs["logits"].reshape(-1, outputs["logits"].size(-1)),
                tgt_output.reshape(-1),
            )

            total_loss += lm_loss.item()
            total_lm += lm_loss.item()
            n_batches += 1

        return {
            "val_loss": total_loss / max(n_batches, 1),
        }

    def train(
        self,
        train_loader: DataLoader,
        val_loader: DataLoader,
        epochs: int = 10,
        save_dir: str = ".",
        patience: int = 3,
    ):
        """Full training loop with early stopping and checkpointing."""
        best_val_loss = float("inf")
        patience_counter = 0
        history = []

        print(f"\n{'=' * 60}")
        print(f"IMU_Heart Training - {epochs} epochs")
        print(f"Model params: {self.model.count_parameters():,}")
        print(f"Device: {self.device}")
        print(f"{'=' * 60}\n")

        for epoch in range(1, epochs + 1):
            start = time.time()

            # Train
            train_metrics = self.train_epoch(train_loader)

            # Validate
            val_metrics = self.validate(val_loader)

            # LR scheduler
            self.scheduler.step()

            elapsed = time.time() - start

            print(
                f"Epoch {epoch:3d}/{epochs} | "
                f"Loss: {train_metrics['loss']:.4f} | "
                f"LM: {train_metrics['lm_loss']:.4f} | "
                f"Mood: {train_metrics['mood_loss']:.4f} | "
                f"Intent: {train_metrics['intent_loss']:.4f} | "
                f"Val: {val_metrics['val_loss']:.4f} | "
                f"Time: {elapsed:.1f}s"
            )

            history.append(
                {
                    "epoch": epoch,
                    **train_metrics,
                    **val_metrics,
                    "lr": self.optimizer.param_groups[0]["lr"],
                    "time": elapsed,
                }
            )

            # Checkpoint
            if val_metrics["val_loss"] < best_val_loss:
                best_val_loss = val_metrics["val_loss"]
                patience_counter = 0
                ckpt_path = os.path.join(save_dir, "imu_heart_best.pt")
                torch.save(
                    {
                        "epoch": epoch,
                        "model_state": self.model.state_dict(),
                        "optimizer_state": self.optimizer.state_dict(),
                        "val_loss": best_val_loss,
                        "model_config": {
                            "vocab_size": self.model.vocab_size,
                            "dim": self.model.dim,
                        },
                    },
                    ckpt_path,
                )
                print(f"  -> Saved best model (val_loss={best_val_loss:.4f})")
            else:
                patience_counter += 1
                if patience_counter >= patience:
                    print(
                        f"\nEarly stopping at epoch {epoch} (no improvement for {patience} epochs)"
                    )
                    break

        # Save final
        final_path = os.path.join(save_dir, "imu_heart_final.pt")
        torch.save(
            {
                "epoch": epoch,
                "model_state": self.model.state_dict(),
                "model_config": {
                    "vocab_size": self.model.vocab_size,
                    "dim": self.model.dim,
                },
            },
            final_path,
        )

        # Save history
        hist_path = os.path.join(save_dir, "training_history.json")
        with open(hist_path, "w") as f:
            json.dump(history, f, indent=2)

        print(f"\nTraining complete. Best val_loss: {best_val_loss:.4f}")
        print(f"Final model: {final_path}")
        return history


# ─── Main ──────────────────────────────────────────────────────────────────────


def main():
    data_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(data_dir, "training_data.jsonl")

    if not os.path.exists(data_path):
        print("ERROR: training_data.jsonl not found. Run preprocessor.py first.")
        return

    print("Loading training data...")
    print("Building tokenizer...")

    # Read all texts for tokenizer fitting
    all_src = []
    all_tgt = []
    with open(data_path, "r", encoding="utf-8") as f:
        for line in f:
            pair = json.loads(line)
            all_src.append(pair["input_text"])
            all_tgt.append(pair["output_text"])

    tokenizer = IMUHeartTokenizer(vocab_size=30000)
    tokenizer.fit(all_src + all_tgt)
    print(f"Vocabulary: {len(tokenizer.word2idx)} tokens")

    # Create dataset
    dataset = IMUHeartDataset(data_path, tokenizer)
    print(f"Dataset: {len(dataset)} pairs")

    # Split train/val
    val_size = min(int(len(dataset) * 0.1), 2000)
    train_size = len(dataset) - val_size
    train_dataset, val_dataset = random_split(dataset, [train_size, val_size])
    print(f"Train: {train_size} | Val: {val_size}")

    # DataLoaders
    train_loader = DataLoader(
        train_dataset, batch_size=32, shuffle=True, collate_fn=collate_fn, num_workers=0
    )
    val_loader = DataLoader(
        val_dataset, batch_size=32, shuffle=False, collate_fn=collate_fn, num_workers=0
    )

    # Model
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Device: {device}")

    model = IMUHeartModel(
        vocab_size=len(tokenizer.word2idx),
        dim=256,
        n_heads=8,
        n_layers=4,
        dim_ff=512,
        dropout=0.1,
    )
    print(f"Model parameters: {model.count_parameters():,}")

    # Train
    trainer = IMUHeartTrainer(model, tokenizer, lr=3e-4, device=device)
    history = trainer.train(
        train_loader,
        val_loader,
        epochs=15,
        save_dir=data_dir,
        patience=5,
    )

    # Save tokenizer
    import pickle

    tok_path = os.path.join(data_dir, "tokenizer.pkl")
    with open(tok_path, "wb") as f:
        pickle.dump(tokenizer, f)
    print(f"Tokenizer saved: {tok_path}")

    print("\nIMU_Heart training complete!")


if __name__ == "__main__":
    main()
