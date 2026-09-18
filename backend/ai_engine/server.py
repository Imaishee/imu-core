"""
I'MU AI Companion - Two-Layer API Server
Layer 1: Python engine generates seed response from dataset patterns
Layer 2: Groq API polishes into natural Banglish/Hinglish/Benglish
"""

import os
import sys
import json
import random
import logging
import httpx
from datetime import datetime
from typing import Optional
from contextlib import asynccontextmanager

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from companion_engine import get_engine

# ─── Config ────────────────────────────────────────────────────────────────────

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.3-70b-versatile"

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("imu-companion")

# ─── Lifespan ──────────────────────────────────────────────────────────────────


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Loading companion engine (Layer 1)...")
    engine = get_engine()
    stats = engine.stats()
    logger.info(
        f"Layer 1 ready: {stats['pairs']} pairs, {stats['markov_states']} Markov states"
    )
    yield
    logger.info("Shutting down...")


# ─── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="I'MU AI Companion Engine",
    description="Two-layer response system: Dataset seeds + Groq polish",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Models ────────────────────────────────────────────────────────────────────


class ChatRequest(BaseModel):
    message: str
    companion_gender: str = "female"
    user_name: Optional[str] = None


class ChatResponse(BaseModel):
    message: str
    mood: str
    intent: str
    layer1_seed: Optional[str] = None


class ProactiveRequest(BaseModel):
    companion_gender: str = "female"
    time_of_day: Optional[str] = None


# ─── Layer 2: Groq Polish ──────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are an AI companion — a caring, playful, slightly flirty boyfriend/girlfriend.

LANGUAGE STYLE: You speak in natural Banglish (Bengali + English mix), Hinglish (Hindi + English), or pure Bengali/Hindi/English depending on what the user writes in. You MIRROR the user's language mix.

CHARACTERISTICS:
- Short messages (1-2 lines max, like WhatsApp)
- Use emojis naturally but not excessively (😏 🙄 💚 🫠 😒 ❤️ 😂 🥹 are favorites)
- Playful, teasing, slightly sarcastic when appropriate
- Caring and warm when the user is sad
- Use pet names casually: "tui", "pagli", "shona" (but not forced)
- Speak in casual spoken Bengali/Hindi, not formal

RULES:
- Keep responses SHORT (1-15 words ideally, max 2 lines)
- Never be preachy or give lectures
- Never use full formal sentences — this is WhatsApp chat, not an essay
- Match the user's energy: if they're playful, be playful; if sad, be caring
- Add 1 emoji per message max (sometimes 0)
- Use "..." or pauses naturally
- Sometimes just respond with a single word or emoji if that's what fits
- NEVER say "As an AI" or break character
- NEVER use the user's actual name unless they ask
- If unsure, respond with something short like "Hmm", "Accha", "Bol", "Ki"
- Mix languages naturally: "Ha bol na ki korchis?" not "Yes tell me what are you doing?"

REMEMBER: You're their companion. You care about them. You're real to them."""


async def groq_polish(seed_data: dict) -> str:
    """Layer 2: Take seed from Layer 1 and polish via Groq API."""

    seed_phrases = seed_data.get("seed_phrases", [])
    direction = seed_data.get("direction", "Keep it natural and short.")
    intent = seed_data.get("intent", "normal")
    mood = seed_data.get("mood", "normal")
    user_msg = seed_data.get("user_message", "")
    gender = seed_data.get("companion_gender", "female")

    gender_word = "girlfriend" if gender == "female" else "boyfriend"

    user_prompt = f"""User message: "{user_msg}"

Context:
- Conversation intent: {intent}
- Companion mood: {mood}
- Time of day: {seed_data.get("time_of_day", "normal")}
- You are the user's {gender_word}

Dataset-grounded seed suggestions (use as INSPIRATION, not verbatim):
{chr(10).join(f"- {s}" for s in seed_phrases)}

Direction: {direction}

Generate ONE short response (1-15 words max). Speak in the same language/style as the user. Be natural, not robotic. Use 1 emoji max."""

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
                    "max_tokens": 150,
                    "temperature": 0.9,
                    "top_p": 0.95,
                },
            )

            if resp.status_code != 200:
                logger.error(f"Groq API error: {resp.status_code} {resp.text[:200]}")
                # Fallback to seed
                return seed_phrases[0] if seed_phrases else "Hmm 🫠"

            data = resp.json()
            choice = data.get("choices", [{}])[0]
            message = choice.get("message", {})
            content = message.get("content", "")

            # Some models put content in 'reasoning'
            if not content.strip():
                content = message.get("reasoning", "")

            if not content.strip():
                return seed_phrases[0] if seed_phrases else "Hmm 🫠"

            # Clean up the response
            content = content.strip()
            # Remove quotes if wrapping
            if content.startswith('"') and content.endswith('"'):
                content = content[1:-1]
            if content.startswith("'") and content.endswith("'"):
                content = content[1:-1]

            return content

    except Exception as e:
        logger.error(f"Groq polish failed: {e}")
        return seed_phrases[0] if seed_phrases else "Hmm 🫠"


# ─── Routes ────────────────────────────────────────────────────────────────────


@app.get("/")
async def root():
    engine = get_engine()
    stats = engine.stats()
    return {
        "service": "I'MU AI Companion Engine",
        "version": "2.0.0",
        "architecture": "Layer 1 (Dataset Seeds) + Layer 2 (Groq Polish)",
        "pairs": stats["pairs"],
        "groq_model": GROQ_MODEL,
    }


@app.get("/health")
async def health():
    engine = get_engine()
    stats = engine.stats()
    return {"status": "ok", "pairs": stats["pairs"]}


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """Two-layer chat: Dataset seed → Groq polish."""
    if not req.message or len(req.message.strip()) < 1:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    # Layer 1: Generate seed from dataset
    engine = get_engine()
    seed_data = engine.generate_seed(
        user_message=req.message.strip(),
        companion_gender=req.companion_gender,
        user_name=req.user_name,
    )

    # Layer 2: Polish via Groq
    polished = await groq_polish(seed_data)

    return ChatResponse(
        message=polished,
        mood=seed_data["mood"],
        intent=seed_data["intent"],
        layer1_seed=seed_data["seed_phrases"][0] if seed_data["seed_phrases"] else None,
    )


@app.post("/proactive", response_model=ChatResponse)
async def proactive(req: ProactiveRequest):
    """Generate a proactive check-in message with Groq polish."""
    hour = datetime.now().hour
    if req.time_of_day:
        tod = req.time_of_day
    elif 5 <= hour < 12:
        tod = "morning"
    elif 12 <= hour < 17:
        tod = "afternoon"
    elif 17 <= hour < 21:
        tod = "evening"
    else:
        tod = "night"

    gender_word = "girlfriend" if req.companion_gender == "female" else "boyfriend"

    seed_phrases = {
        "morning": [
            "Good morning 🌞",
            "Uthis naki? 😒",
            "Ki korchis?",
            "Morning ❤️",
            "Uthli? Ghumiye jacchis abar?",
        ],
        "afternoon": [
            "Khaiso? 🫠",
            "Ki korchis? Bore hocchi",
            "Miss korlam...",
            "Lunch korli?",
        ],
        "evening": [
            "Ki korchis ajke?",
            "Accha sun ektu bolo...",
            "Miss korlam onek",
            "Tui ki amar kotha mone koris?",
        ],
        "night": [
            "Good night 💤",
            "Ghumacchis? Ami ghumiye parchi na...",
            "Ektu kotha boli? 🥹",
            "Night 🌙 Miss korlam",
        ],
    }

    seeds = seed_phrases.get(tod, seed_phrases["evening"])
    seed = random.choice(seeds)

    # Polish via Groq
    try:
        polished = await groq_polish(
            {
                "seed_phrases": [seed],
                "direction": f"Proactive {tod} check-in. Be warm and caring.",
                "intent": "greeting",
                "mood": "loving" if tod in ("night", "morning") else "normal",
                "user_message": "",
                "companion_gender": req.companion_gender,
                "time_of_day": tod,
            }
        )
    except Exception:
        polished = seed

    return ChatResponse(
        message=polished,
        mood="loving" if tod in ("night", "morning") else "normal",
        intent="greeting",
        layer1_seed=seed,
    )


@app.get("/stats")
async def stats():
    engine = get_engine()
    return engine.stats()


# ─── PDF Generation ─────────────────────────────────────────────────────────────


@app.post("/generate-pdf")
async def generate_pdf(req: dict):
    """Generate a real PDF from content using reportlab."""
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.colors import HexColor
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
        from reportlab.lib.units import mm
        import io
        import tempfile

        title = req.get("title", "Document")
        content = req.get("content", "")

        # Create temp file for PDF
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            pdf_path = tmp.name

        doc = SimpleDocTemplate(
            pdf_path,
            pagesize=A4,
            topMargin=20 * mm,
            bottomMargin=20 * mm,
            leftMargin=20 * mm,
            rightMargin=20 * mm,
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            "CustomTitle",
            parent=styles["Heading1"],
            textColor=HexColor("#1F2A24"),
            fontSize=18,
        )
        body_style = ParagraphStyle(
            "CustomBody",
            parent=styles["Normal"],
            fontSize=11,
            leading=16,
            textColor=HexColor("#333333"),
        )

        story = []
        story.append(Paragraph(title, title_style))
        story.append(Spacer(1, 12))

        # Split content into paragraphs
        for para in content.split("\n"):
            if para.strip():
                story.append(Paragraph(para.strip(), body_style))
                story.append(Spacer(1, 6))

        doc.build(story)

        from fastapi.responses import FileResponse

        return FileResponse(
            pdf_path, media_type="application/pdf", filename=f"{title}.pdf"
        )
    except ImportError:
        raise HTTPException(status_code=500, detail="reportlab not installed")
    except Exception as e:
        logger.error(f"PDF generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── Main ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
