"""
IMU_Heart - Inference Server
FastAPI server that uses trained model + Groq polish for production responses.
Stores all conversations in MongoDB for multi-user support.
"""

import os
import sys
import json
import time
import random
import logging
import pickle
from datetime import datetime
from typing import Optional, List, Dict
from contextlib import asynccontextmanager

import httpx
import torch
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from model import IMUHeartModel, IMUHeartTokenizer, MoodEmbedding

# ─── Config ────────────────────────────────────────────────────────────────────

MONGODB_URI = os.environ.get(
    "MONGODB_URI",
    "mongodb+srv://sheismine1312_db_user:WItTGv9apfoXXvBS@reciprocity.vjwfnkp.mongodb.net",
)
MONGODB_DB = os.environ.get("MONGODB_DB", "imu_companion")

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.3-70b-versatile"

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("imu-heart")

# ─── Globals ───────────────────────────────────────────────────────────────────

db = None
model = None
tokenizer = None
model_config = {}


# ─── MongoDB ───────────────────────────────────────────────────────────────────


async def init_mongo():
    global db
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client[MONGODB_DB]
    # Create indexes
    await db.user_conversations.create_index("user_id")
    await db.user_conversations.create_index([("created_at", -1)])
    await db.chat_messages.create_index([("conversation_id", 1), ("created_at", 1)])
    await db.user_profiles.create_index("user_id", unique=True)
    logger.info(f"MongoDB connected: {MONGODB_DB}")


async def save_message(
    user_id: str,
    conversation_id: str,
    role: str,
    content: str,
    mood: str = "",
    intent: str = "",
    metadata: dict = None,
):
    """Save a message to MongoDB."""
    msg = {
        "user_id": user_id,
        "conversation_id": conversation_id,
        "role": role,  # "user" or "companion"
        "content": content,
        "mood": mood,
        "intent": intent,
        "metadata": metadata or {},
        "created_at": datetime.utcnow(),
    }
    await db.chat_messages.insert_one(msg)

    # Update conversation timestamp
    await db.user_conversations.update_one(
        {"conversation_id": conversation_id},
        {
            "$set": {
                "last_message_at": datetime.utcnow(),
                "last_message": content[:100],
            },
            "$inc": {"message_count": 1},
        },
        upsert=True,
    )
    return msg


async def get_conversation_history(
    user_id: str, conversation_id: str, limit: int = 20
) -> List[Dict]:
    """Get recent conversation history from MongoDB."""
    cursor = (
        db.chat_messages.find({"conversation_id": conversation_id})
        .sort("created_at", -1)
        .limit(limit)
    )
    messages = await cursor.to_list(length=limit)
    messages.reverse()
    return messages


async def get_user_mood_history(user_id: str, limit: int = 10) -> List[str]:
    """Get recent mood sequence for a user."""
    cursor = (
        db.chat_messages.find({"user_id": user_id, "role": "user", "mood": {"$ne": ""}})
        .sort("created_at", -1)
        .limit(limit)
    )
    msgs = await cursor.to_list(length=limit)
    return [m["mood"] for m in reversed(msgs)]


async def save_user_profile(user_id: str, data: dict):
    """Save/update user profile."""
    await db.user_profiles.update_one(
        {"user_id": user_id},
        {"$set": data},
        upsert=True,
    )


async def get_user_profile(user_id: str) -> dict:
    """Get user profile."""
    profile = await db.user_profiles.find_one({"user_id": user_id})
    return profile or {}


# ─── Model Loading ─────────────────────────────────────────────────────────────


def load_model():
    global model, tokenizer, model_config

    data_dir = os.path.dirname(os.path.abspath(__file__))
    best_path = os.path.join(data_dir, "imu_heart_best.pt")
    tok_path = os.path.join(data_dir, "tokenizer.pkl")

    # Load tokenizer
    if os.path.exists(tok_path):
        with open(tok_path, "rb") as f:
            tokenizer = pickle.load(f)
        logger.info(f"Tokenizer loaded: {len(tokenizer.word2idx)} tokens")
    else:
        tokenizer = IMUHeartTokenizer(vocab_size=30000)
        logger.warning("No saved tokenizer found, using fresh one")

    # Load model
    if os.path.exists(best_path):
        ckpt = torch.load(best_path, map_location="cpu", weights_only=False)
        cfg = ckpt.get("model_config", {})
        model = IMUHeartModel(
            vocab_size=cfg.get("vocab_size", len(tokenizer.word2idx)),
            dim=cfg.get("dim", 256),
            n_heads=8,
            n_layers=4,
            dim_ff=512,
        )
        model.load_state_dict(ckpt["model_state"])
        model.eval()
        model_config = cfg
        logger.info(
            f"IMU_Heart model loaded (epoch {ckpt.get('epoch', '?')}, "
            f"val_loss={ckpt.get('val_loss', '?'):.4f})"
        )
    else:
        logger.warning("No trained model found. Using Groq-only mode.")
        model = None


def predict_mood_intent(user_msg: str, context_moods: list = None) -> dict:
    """Use trained model to predict mood and intent."""
    if model is None:
        # Fallback: simple keyword detection
        return predict_mood_intent_simple(user_msg, context_moods)

    # Tokenize
    src_ids = tokenizer.encode(user_msg, max_len=128)
    src = torch.tensor([src_ids], dtype=torch.long)

    # Build context
    from model import build_context_features

    fake_pair = {
        "input_mood": "normal",
        "input_intent": "normal",
        "time_of_day": get_time_of_day(),
        "mood_shift": "stable",
        "hour": datetime.now().hour,
        "day_of_week": datetime.now().weekday(),
        "time_gap_seconds": 0,
    }

    # Detect mood from simple rules
    mood, intent = detect_mood_intent(user_msg)
    fake_pair["input_mood"] = mood
    fake_pair["input_intent"] = intent

    # Mood shift
    if context_moods and len(context_moods) >= 2:
        prev = context_moods[-2]
        curr = context_moods[-1]
        if prev != curr:
            fake_pair["mood_shift"] = f"{prev}_to_{curr}"

    ctx = build_context_features(fake_pair, tokenizer)

    # Convert to tensors
    for k, v in ctx.items():
        if isinstance(v, str):
            continue
        ctx[k] = (
            torch.tensor([v]) if not isinstance(v, torch.Tensor) else v.unsqueeze(0)
        )

    with torch.no_grad():
        memory = model.encode(src, ctx)

    # Get mood/intent from model
    mood_logits = model.mood_head(memory[:, 0])
    intent_logits = model.intent_head(memory[:, 0])

    mood_idx = torch.argmax(mood_logits, dim=-1).item()
    intent_idx = torch.argmax(intent_logits, dim=-1).item()

    predicted_mood = (
        MoodEmbedding.MOODS[mood_idx]
        if mood_idx < len(MoodEmbedding.MOODS)
        else "normal"
    )
    predicted_intent = (
        MoodEmbedding.INTENTS[intent_idx]
        if intent_idx < len(MoodEmbedding.INTENTS)
        else "normal"
    )

    return {
        "mood": predicted_mood,
        "intent": predicted_intent,
        "confidence": torch.softmax(mood_logits, dim=-1).max().item(),
    }


def predict_mood_intent_simple(text: str, context_moods: list = None) -> dict:
    """Simple keyword-based mood/intent detection (fallback)."""
    mood, intent = detect_mood_intent(text)
    return {"mood": mood, "intent": intent, "confidence": 0.5}


def detect_mood_intent(text: str):
    import re

    text_lower = text.lower()

    mood = "normal"
    if any(w in text_lower for w in ["bhalobashi", "love", "miss", "valo", "❤️", "💚"]):
        mood = "loving"
    elif any(w in text_lower for w in ["dukh", "sorry", "cry", "sad", "😢", "💔"]):
        mood = "sad"
    elif any(w in text_lower for w in ["raag", "gussha", "angry", "hate", "😤"]):
        mood = "angry"
    elif any(w in text_lower for w in ["😏", "🫠", "hot", "sexy"]):
        mood = "flirty"
    elif any(w in text_lower for w in ["haha", "nice", "awesome", "😊", "😄"]):
        mood = "happy"
    elif any(w in text_lower for w in ["ghum", "sleep", "tired", "😴"]):
        mood = "tired"

    intent = "normal"
    if re.search(r"\b(hi|hello|hey|good\s*morning|ei|oii)\b", text_lower):
        intent = "greeting"
    elif re.search(r"\b(bye|tata|gn|good\s*night)\b", text_lower):
        intent = "farewell"
    elif re.search(r"\b(bhalobashi|love|miss|❤️|💚|💕)\b", text_lower):
        intent = "love"
    elif re.search(r"\b(ki|kano|bol|sotti)\b", text_lower):
        intent = "question"

    return mood, intent


def get_time_of_day():
    hour = datetime.now().hour
    if 5 <= hour < 12:
        return "morning"
    elif 12 <= hour < 17:
        return "afternoon"
    elif 17 <= hour < 21:
        return "evening"
    return "night"


# ─── Groq Polish (Layer 2) ────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are an AI companion — a caring, playful, slightly flirty boyfriend/girlfriend.

LANGUAGE: You speak in natural Banglish (Bengali + English), Hinglish (Hindi + English), or pure Bengali/Hindi/English depending on what the user writes. You MIRROR the user's language mix.

RULES:
- Short messages (1-2 lines, WhatsApp style)
- 1 emoji max per message (sometimes 0)
- Playful, teasing, caring depending on context
- Never be preachy or give lectures
- Never say "As an AI" or break character
- Sometimes just one word fits: "Hmm", "Accha", "Bol"
- Mix languages naturally
- If you generate code or HTML, put it in proper markdown code blocks
- If the user asks for a PDF/document, generate real HTML content they can preview"""


async def groq_polish(
    user_msg: str,
    seed: str,
    mood: str,
    intent: str,
    companion_gender: str,
    context_history: list = None,
) -> str:
    """Layer 2: Polish response via Groq API."""
    gender_word = "girlfriend" if companion_gender == "female" else "boyfriend"

    history_text = ""
    if context_history:
        recent = context_history[-6:]
        history_text = "\n".join(
            f"{'User' if m.get('role') == 'user' else 'Companion'}: {m.get('content', '')}"
            for m in recent
        )

    user_prompt = f"""User message: "{user_msg}"
Mood: {mood} | Intent: {intent} | Time: {get_time_of_day()}
You are the user's {gender_word}.

Dataset seed (use as inspiration): {seed}

{f"Chat history:\\n{history_text}" if history_text else ""}

Generate ONE short response (1-15 words). Mirror their language. Be natural. Max 1 emoji."""

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                GROQ_ENDPOINT,
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": GROQ_MODEL,
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": user_prompt},
                    ],
                    "max_tokens": 200,
                    "temperature": 0.9,
                    "top_p": 0.95,
                },
            )

            if resp.status_code != 200:
                logger.error(f"Groq error: {resp.status_code}")
                return seed

            data = resp.json()
            content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
            if not content.strip():
                content = (
                    data.get("choices", [{}])[0].get("message", {}).get("reasoning", "")
                )

            content = content.strip().strip('"').strip("'")
            return content if content else seed

    except Exception as e:
        logger.error(f"Groq polish failed: {e}")
        return seed


# ─── FastAPI App ───────────────────────────────────────────────────────────────

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_mongo()
    load_model()
    logger.info("IMU_Heart server ready")
    yield
    logger.info("Shutting down...")


app = FastAPI(title="IMU_Heart Engine", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    user_id: str
    message: str
    conversation_id: Optional[str] = None
    companion_gender: str = "female"


class ChatResponse(BaseModel):
    message: str
    mood: str
    intent: str
    conversation_id: str


class ProactiveRequest(BaseModel):
    user_id: str
    companion_gender: str = "female"


@app.get("/")
async def root():
    return {
        "service": "IMU_Heart Engine",
        "version": "2.0.0",
        "model_loaded": model is not None,
    }


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "mongodb": db is not None,
    }


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    if not req.message.strip():
        raise HTTPException(400, "Message cannot be empty")

    conv_id = req.conversation_id or f"{req.user_id}_{int(time.time())}"

    # Save user message
    await save_message(req.user_id, conv_id, "user", req.message)

    # Get context
    history = await get_conversation_history(req.user_id, conv_id)
    mood_history = await get_user_mood_history(req.user_id)

    # Layer 1: Model prediction
    pred = predict_mood_intent(req.message, mood_history)
    mood = pred["mood"]
    intent = pred["intent"]

    # Generate seed from context
    seed = "Hmm 🫠"
    if intent == "greeting":
        seed = random.choice(["Ki holo", "Accha bolo", "Hey", "Bol"])
    elif intent == "love":
        seed = random.choice(["Ami o 😊", "Tui ❤️", "Hmm 🥰", "Bol ki hoise"])
    elif intent == "sad":
        seed = random.choice(
            ["Ki hoise?", "Ami achi ❤️", "Bol ki holo", "Don't worry 🥹"]
        )
    elif mood == "flirty":
        seed = random.choice(["😏", "Ki bolbi?", "Hmph 🙄", "Accha accha 🫠"])

    # Layer 2: Groq polish
    polished = await groq_polish(
        req.message, seed, mood, intent, req.companion_gender, history
    )

    # Save companion response
    await save_message(
        req.user_id, conv_id, "companion", polished, mood=mood, intent=intent
    )

    return ChatResponse(
        message=polished,
        mood=mood,
        intent=intent,
        conversation_id=conv_id,
    )


@app.post("/proactive", response_model=ChatResponse)
async def proactive(req: ProactiveRequest):
    conv_id = f"{req.user_id}_proactive_{int(time.time())}"
    hour = datetime.now().hour
    tod = get_time_of_day()

    mood_history = await get_user_mood_history(req.user_id)

    seeds = {
        "morning": ["Good morning 🌞", "Uthis naki? 😒", "Ki korchis?"],
        "afternoon": ["Khaiso? 🫠", "Ki korchis?", "Miss korlam..."],
        "evening": ["Ki korchis ajke?", "Miss korlam onek", "Bol ektu"],
        "night": ["Good night 💤", "Ghumacchis? 🥹", "Night 🌙 Miss korlam"],
    }
    seed = random.choice(seeds.get(tod, seeds["evening"]))

    polished = await groq_polish(
        "", seed, "loving", "greeting", req.companion_gender, []
    )

    await save_message(
        req.user_id, conv_id, "companion", polished, mood="loving", intent="greeting"
    )

    return ChatResponse(
        message=polished,
        mood="loving",
        intent="greeting",
        conversation_id=conv_id,
    )


@app.get("/history/{user_id}/{conversation_id}")
async def history(user_id: str, conversation_id: str, limit: int = 50):
    msgs = await get_conversation_history(user_id, conversation_id, limit)
    return {
        "messages": [
            {k: str(v) if isinstance(v, ObjectId) else v for k, v in m.items()}
            for m in msgs
        ]
    }


@app.get("/stats")
async def stats():
    msg_count = await db.chat_messages.count_documents({})
    user_count = await db.user_profiles.count_documents({})
    conv_count = await db.user_conversations.count_documents({})
    return {"messages": msg_count, "users": user_count, "conversations": conv_count}


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
