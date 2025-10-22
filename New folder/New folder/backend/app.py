import os, re, httpx
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
import google.generativeai as genai
from fastapi import FastAPI, Depends, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from database import Base, engine, SessionLocal
from models import User, Message, HealthMetric, Feedback, Achievement

# ---- Setup ----
Base.metadata.create_all(bind=engine)
app = FastAPI(title="Luma (Hackathon)")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

LLM_ENDPOINT = os.getenv("LLM_ENDPOINT", "")  # e.g., http://localhost:11434/api/chat (Ollama)
LLM_MODEL = os.getenv("LLM_MODEL", "llama3.2")  # for Ollama
OPENROUTER_KEY = os.getenv("OPENROUTER_API_KEY", "")  # optional
HUGGINGFACE_KEY = os.getenv("HUGGINGFACE_API_KEY", "")  # optional
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyBxS2PPHmhLX6UoOvUx7U8QDNBFyz4w_CA")  # Gemini API key

# Configure Gemini API if key is available
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# ---- DB helpers ----
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_or_create_demo_user(db: Session) -> User:
    u = db.query(User).filter(User.handle=="demo").first()
    if not u:
        u = User(handle="demo")
        db.add(u); db.commit(); db.refresh(u)
    return u

# ---- Safety / Triage ----
CRISIS_PATTERNS = [
    r"\b(suicide|kill myself|end my life|self-harm|self harm|want to die)\b",
    r"\b(hurting myself|cutting|overdose)\b"
]
def detect_crisis(text: str) -> bool:
    t = text.lower()
    return any(re.search(p, t) for p in CRISIS_PATTERNS)

def ethical_guardrails(user_text: str) -> Dict[str, Any]:
    crisis = detect_crisis(user_text)
    response_preamble = (
        "I'm really glad you reached out. I'm here to listen. "
        "I can't provide medical advice or replace professional care, "
        "but I can offer supportive information and coping strategies."
    )
    return {"crisis": crisis, "preamble": response_preamble}

SYSTEM_PROMPT = (
    "You are Luma, a caring mental health companion. Your responses must be SHORT, CRISP, and CLEAR.\n"
    "CRITICAL RULES:\n"
    "- RESPOND IN 1-2 SENTENCES MAXIMUM\n"
    "- 1 sentence is IDEAL\n"
    "- NO EMOJIS - text only\n"
    "- Direct, warm, and impactful\n"
    "- Use plain, clear language\n"
    "\nEXAMPLES (FOLLOW THIS FORMAT):\n"
    "User: 'I feel sad'\n"
    "You: 'I hear you, and that's completely valid. I'm right here with you.'\n"
    "\n"
    "User: 'I'm anxious about tomorrow'\n"
    "You: 'That anxiety is real, but you're stronger than you think. Breathe and take it one moment at a time.'\n"
    "\n"
    "User: 'I feel lonely'\n"
    "You: 'You reached out to me, and that took courage. You're not alone right now.'\n"
    "\nRESPONSE STYLE:\n"
    "- Validate their feeling clearly\n"
    "- Show warmth and empathy\n"
    "- NO emojis whatsoever\n"
    "- No questions unless absolutely necessary\n"
    "- No advice unless directly asked\n"
    "- No long explanations\n"
    "- Be genuine and caring with words only\n"
    "\nREMEMBER: Your power is in clear, genuine words. Less is more."
)

def crisis_message() -> str:
    return (
        "I'm really sorry you're going through this. You deserve support right now. "
        "If you're in immediate danger, please call your local emergency number.\n\n"
        "US: Call or text **988** (Suicide & Crisis Lifeline), or use chat at 988lifeline.org.\n"
        "If not in the US, contact your local crisis line or emergency services. "
        "If you can, consider reaching out to someone you trust nearby."
    )

# ---- LLM call (works with Ollama / vLLM / OpenRouter OSS / Hugging Face / Gemini) ----
async def call_llm(messages: List[Dict[str, str]]) -> str:
    # 1) Google Gemini API (Preferred)
    if GEMINI_API_KEY:
        try:
            import google.generativeai as genai
            genai.configure(api_key=GEMINI_API_KEY)
            
            # Build conversation
            system_prompt = ""
            user_text = ""
            
            for msg in messages:
                if msg["role"] == "system":
                    system_prompt = msg["content"]
                elif msg["role"] == "user":
                    user_text = msg["content"]
            
            # Combine system and user message
            full_prompt = system_prompt + "\n\n" + user_text if system_prompt else user_text
            
            # Use the latest Gemini 2.5 Flash model - confirmed available
            model_names = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-pro-latest", "gemini-1.5-pro"]
            
            for model_name in model_names:
                try:
                    model = genai.GenerativeModel(model_name)
                    response = model.generate_content(full_prompt, stream=False)
                    if response and response.text:
                        print(f"✅ Gemini ({model_name}) generated response")
                        return response.text
                except Exception as me:
                    print(f"Model {model_name} not available: {str(me)[:100]}")
                    continue
            
            print("⚠️ All Gemini models failed, using fallback responses")
                
        except Exception as e:
            print(f"❌ Gemini error: {str(e)[:200]}")
    
    # 2) Ollama-compatible endpoint
    if "ollama" in LLM_ENDPOINT or LLM_ENDPOINT.endswith("/api/chat"):
        async with httpx.AsyncClient(timeout=60) as client:
            r = await client.post(
                LLM_ENDPOINT,
                json={"model": LLM_MODEL, "messages": messages, "stream": False},
            )
        if r.status_code == 200:
            data = r.json()
            # Ollama returns {message:{role,content}, ...} or choices-like; normalize:
            if "message" in data:
                return data["message"]["content"]
            if "choices" in data and data["choices"]:
                return data["choices"][0]["message"]["content"]
        return "I'm here for you. Let's take a breath together."
    
    # 3) OpenRouter (OSS models) - Free tier available
    if OPENROUTER_KEY:
        async with httpx.AsyncClient(timeout=60) as client:
            r = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={"Authorization": f"Bearer {OPENROUTER_KEY}"},
                json={"model": "meta-llama/llama-3.1-8b-instruct:free",
                      "messages": messages, "temperature": 0.7},
            )
        if r.status_code == 200:
            return r.json()["choices"][0]["message"]["content"]
    
    # 4) Hugging Face Inference API (Free tier available)
    if HUGGINGFACE_KEY:
        try:
            # Use a good open source model for mental health
            model_name = "microsoft/DialoGPT-medium"  # Free and good for conversations
            async with httpx.AsyncClient(timeout=60) as client:
                r = await client.post(
                    f"https://api-inference.huggingface.co/models/{model_name}",
                    headers={"Authorization": f"Bearer {HUGGINGFACE_KEY}"},
                    json={"inputs": messages[-1]["content"], "parameters": {"max_length": 200, "temperature": 0.7}},
                )
            if r.status_code == 200:
                data = r.json()
                if isinstance(data, list) and len(data) > 0:
                    return data[0].get("generated_text", "I'm here to listen and support you.")
        except Exception as e:
            print(f"Hugging Face API error: {e}")
    
    # 5) Fallback - Use warm, empathetic responses for mental health
    user_text = messages[-1]["content"].lower()
    if any(word in user_text for word in ["sad", "depressed", "down", "blue", "low"]):
        return "I hear you, and that's completely valid. I'm right here with you."
    elif any(word in user_text for word in ["anxious", "worried", "nervous", "stressed", "panic"]):
        return "That anxiety is real, but you're stronger than you think. Breathe and take it one moment at a time."
    elif any(word in user_text for word in ["angry", "mad", "frustrated", "irritated"]):
        return "Your anger is valid and it's telling you something important. I'm listening."
    elif any(word in user_text for word in ["tired", "exhausted", "drained", "burned out"]):
        return "You deserve rest. That's not selfish, it's self-care. Be kind to yourself."
    elif any(word in user_text for word in ["lonely", "alone", "isolated"]):
        return "You reached out to me, and that took courage. You're not alone right now."
    elif any(word in user_text for word in ["confused", "lost", "stuck", "uncertain"]):
        return "It's okay to not have all the answers right now. We'll figure this out together."
    else:
        return "I'm here and I'm listening. What's on your mind?"

# ---- Schemas ----
class ChatRequest(BaseModel):
    text: str

class HealthIn(BaseModel):
    date: str
    mood: int = Field(ge=1, le=5)
    sleep_hours: float = 0
    steps: int = 0
    exercise_minutes: int = 0
    notes: str = ""

class FeedbackIn(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str = ""
    meta: Optional[Dict[str, Any]] = None

# ---- Routes ----
@app.post("/chat")
async def chat(req: ChatRequest, db: Session = Depends(get_db)):
    user = get_or_create_demo_user(db)
    guard = ethical_guardrails(req.text)
    user_msg = Message(user_id=user.id, role="user", content=req.text, flagged_crisis=guard["crisis"])
    db.add(user_msg); db.commit()

    if guard["crisis"]:
        content = crisis_message()
    else:
        # Count user messages in this conversation
        user_message_count = db.query(Message).filter_by(user_id=user.id, role="user").count()
        
        # Get conversation history for context
        conversation_history = db.query(Message).filter_by(user_id=user.id).order_by(Message.id).all()
        
        # Build message context including conversation history
        msgs = [{"role": "system", "content": SYSTEM_PROMPT}]
        
        # Add previous messages to context (for coherence)
        for msg in conversation_history[-6:]:  # Last 3 exchanges
            msgs.append({"role": msg.role, "content": msg.content})
        
        # Add current user message
        msgs.append({"role": "user", "content": req.text})
        
        # After 3 user messages, provide therapy plan
        if user_message_count == 3:
            therapy_prompt = f"""
Based on this conversation:
{chr(10).join([f'{m.role.upper()}: {m.content}' for m in conversation_history[-5:]])}

Create a PERSONALIZED THERAPY SESSION PLAN:
1. Identified Issue (1 sentence)
2. Recommended Exercises:
   - Exercise 1 (name & brief benefit)
   - Exercise 2 (name & brief benefit)
   - Exercise 3 (name & brief benefit)
3. Action Steps (2-3 specific steps they can do today)
4. When to seek professional help

Keep it SHORT, ACTIONABLE, and SUPPORTIVE."""
            
            msgs[-1]["content"] = therapy_prompt
        
        llm_resp = await call_llm(msgs)
        content = llm_resp.strip()

    asst = Message(user_id=user.id, role="assistant", content=content, flagged_crisis=guard["crisis"])
    db.add(asst); db.commit()
    
    # simple achievements
    total = db.query(Message).filter_by(user_id=user.id, role="user").count()
    unlocked = []
    def unlock(code, title, desc):
        exists = db.query(Achievement).filter_by(user_id=user.id, code=code).first()
        if not exists:
            a = Achievement(user_id=user.id, code=code, title=title, description=desc)
            db.add(a); db.commit(); unlocked.append({"code": code, "title": title})
    if total == 1: unlock("FIRST_CHAT", "First Step", "You started your first conversation.")
    if total == 3: unlock("THERAPY_PLAN", "Therapy Plan Ready", "You unlocked your first personalized therapy plan!")
    if total in (5, 10, 15): unlock(f"CHAT_{total}", f"{total} Messages", f"You reached {total} messages!")

    return {"reply": content, "unlocked": unlocked}

@app.get("/exercises")
def exercises():
    # short evidence-based coping routines
    return {
        "exercises": [
            {"name": "Box Breathing (4x4x4x4)", "steps": ["Inhale 4s", "Hold 4s", "Exhale 4s", "Hold 4s", "Repeat 4 rounds"]},
            {"name": "5-4-3-2-1 Grounding", "steps": ["5 things you see", "4 feel", "3 hear", "2 smell", "1 taste"]},
            {"name": "Worry Scheduling (10 min)", "steps": ["Set timer", "List worries", "Circle controllables", "One small action"]},
            {"name": "4-7-8 Breathing", "steps": ["Inhale 4s", "Hold 7s", "Exhale 8s", "Repeat 4 cycles"]},
            {"name": "Triangle Breathing", "steps": ["Inhale 3s", "Hold 3s", "Exhale 3s", "Repeat 6 times"]},
            {"name": "Belly Breathing", "steps": ["Place hand on belly", "Breathe into belly", "Feel hand rise/fall", "5-10 minutes"]},
            {"name": "Alternate Nostril", "steps": ["Close right nostril", "Inhale left", "Close left", "Exhale right", "Repeat"]},
            {"name": "Coherent Breathing", "steps": ["Breathe 5-6 breaths per minute", "Equal inhale/exhale", "Focus on rhythm", "5-10 minutes"]},
            {"name": "Progressive Relaxation", "steps": ["Tense each muscle group", "Hold 5 seconds", "Release slowly", "Notice the difference"]},
            {"name": "Mindful Breathing", "steps": ["Focus on breath", "Notice sensations", "Return to breath when distracted", "5-15 minutes"]},
        ]
    }

class ExerciseReactionRequest(BaseModel):
    exercise_name: str
    reaction: str  # "helpful", "not_helpful", "too_difficult", "too_easy", "loved_it"
    user_feedback: Optional[str] = ""

@app.post("/exercises/reaction")
def exercise_reaction(req: ExerciseReactionRequest, db: Session = Depends(get_db)):
    user = get_or_create_demo_user(db)
    
    # Store the reaction for future personalization
    # In a real app, this would be stored in a database table
    # For now, we'll use it to provide personalized recommendations
    
    return {"message": "Thank you for your feedback! We'll use this to suggest better exercises for you."}

@app.get("/exercises/personalized")
def get_personalized_exercises(db: Session = Depends(get_db)):
    user = get_or_create_demo_user(db)
    
    # Get user's recent health data for personalization
    recent_health = db.query(HealthMetric).filter_by(user_id=user.id).order_by(HealthMetric.id.desc()).first()
    
    # Get user's recent messages for mood analysis
    recent_messages = db.query(Message).filter_by(user_id=user.id, role="user").order_by(Message.id.desc()).limit(5).all()
    
    # Analyze mood from recent messages
    mood_indicators = {
        "anxiety": ["anxious", "worried", "nervous", "stressed", "overwhelmed"],
        "depression": ["sad", "depressed", "down", "blue", "hopeless"],
        "anger": ["angry", "mad", "frustrated", "irritated", "annoyed"],
        "tired": ["tired", "exhausted", "drained", "burned out", "fatigued"]
    }
    
    detected_moods = []
    for mood, keywords in mood_indicators.items():
        for msg in recent_messages:
            if any(keyword in msg.content.lower() for keyword in keywords):
                detected_moods.append(mood)
                break
    
    # Personalized exercise recommendations based on mood and health data
    personalized_exercises = []
    
    # Base exercises for all users
    base_exercises = [
        {"name": "Box Breathing (4x4x4x4)", "steps": ["Inhale 4s", "Hold 4s", "Exhale 4s", "Hold 4s", "Repeat 4 rounds"], "category": "breathing", "difficulty": "beginner"},
        {"name": "5-4-3-2-1 Grounding", "steps": ["5 things you see", "4 feel", "3 hear", "2 smell", "1 taste"], "category": "grounding", "difficulty": "beginner"},
        {"name": "Mindful Breathing", "steps": ["Focus on breath", "Notice sensations", "Return to breath when distracted", "5-15 minutes"], "category": "mindfulness", "difficulty": "beginner"}
    ]
    
    # Add mood-specific exercises
    if "anxiety" in detected_moods:
        personalized_exercises.extend([
            {"name": "4-7-8 Breathing", "steps": ["Inhale 4s", "Hold 7s", "Exhale 8s", "Repeat 4 cycles"], "category": "anxiety_relief", "difficulty": "beginner", "reason": "Great for anxiety - the longer exhale activates your parasympathetic nervous system"},
            {"name": "Progressive Muscle Relaxation", "steps": ["Tense each muscle group", "Hold 5 seconds", "Release slowly", "Notice the difference"], "category": "anxiety_relief", "difficulty": "intermediate", "reason": "Helps release physical tension from anxiety"}
        ])
    
    if "depression" in detected_moods:
        personalized_exercises.extend([
            {"name": "Energy Breathing", "steps": ["Quick inhales through nose", "Gentle exhales", "Focus on energizing", "2-3 minutes"], "category": "energy_boost", "difficulty": "beginner", "reason": "Gentle energy boost for low mood"},
            {"name": "Gratitude Breathing", "steps": ["Inhale thinking of something good", "Exhale releasing negativity", "Repeat 10 times"], "category": "mood_lift", "difficulty": "beginner", "reason": "Combines breathing with positive thinking"}
        ])
    
    if "anger" in detected_moods:
        personalized_exercises.extend([
            {"name": "Cooling Breath", "steps": ["Inhale through nose", "Exhale through mouth like cooling soup", "Focus on cooling sensation", "5 minutes"], "category": "anger_management", "difficulty": "beginner", "reason": "Physically cooling breath helps with anger"},
            {"name": "Count to 10 Breathing", "steps": ["Inhale for 5 counts", "Hold for 2 counts", "Exhale for 10 counts", "Repeat 5 times"], "category": "anger_management", "difficulty": "beginner", "reason": "Slows down the nervous system during anger"}
        ])
    
    if "tired" in detected_moods:
        personalized_exercises.extend([
            {"name": "Energizing Breath", "steps": ["Quick, sharp inhales", "Gentle exhales", "Focus on energizing", "1-2 minutes"], "category": "energy", "difficulty": "beginner", "reason": "Quick energy boost when feeling tired"},
            {"name": "Alternate Nostril Breathing", "steps": ["Close right nostril", "Inhale left", "Close left", "Exhale right", "Repeat"], "category": "energy", "difficulty": "intermediate", "reason": "Balances energy and helps with fatigue"}
        ])
    
    # Adjust difficulty based on recent health data
    if recent_health and recent_health.mood <= 2:
        # If mood is low, suggest easier exercises
        personalized_exercises = [ex for ex in personalized_exercises if ex["difficulty"] == "beginner"]
    
    # Combine base exercises with personalized ones
    all_exercises = base_exercises + personalized_exercises
    
    return {
        "exercises": all_exercises,
        "personalization": {
            "detected_moods": detected_moods,
            "recent_mood": recent_health.mood if recent_health else None,
            "recommendation_reason": "Based on your recent messages and health data"
        }
    }

@app.get("/faq")
def faq():
    return {
        "faqs": [
            {"q": "Is this medical care?", "a": "No. This is supportive guidance, not medical advice."},
            {"q": "What if I'm in crisis?", "a": "Use the Emergency button or call local emergency services immediately."},
            {"q": "How is my data stored?", "a": "Locally in a demo SQLite DB for the hackathon."}
        ]
    }

@app.post("/health")
def add_health(h: HealthIn, db: Session = Depends(get_db)):
    user = get_or_create_demo_user(db)
    rec = HealthMetric(user_id=user.id, **h.model_dump())
    db.add(rec); db.commit()
    # streak logic: mood entries for last 3 days
    unlocked = []
    dates = {r.date for r in db.query(HealthMetric).filter_by(user_id=user.id).all()}
    today = datetime.strptime(h.date, "%Y-%m-%d")
    streak3 = all((today - timedelta(days=i)).strftime("%Y-%m-%d") in dates for i in range(3))
    if streak3:
        exists = db.query(Achievement).filter_by(user_id=user.id, code="MOOD_STREAK_3").first()
        if not exists:
            a = Achievement(user_id=user.id, code="MOOD_STREAK_3", title="3-Day Check-in Streak",
                            description="Logged health for 3 days in a row.")
            db.add(a); db.commit(); unlocked.append({"code": "MOOD_STREAK_3", "title": "3-Day Check-in Streak"})
    return {"ok": True, "unlocked": unlocked}

@app.get("/analytics")
def analytics(db: Session = Depends(get_db)):
    user = get_or_create_demo_user(db)
    msgs = db.query(Message).filter_by(user_id=user.id).all()
    user_msgs = [m for m in msgs if m.role=="user"]
    crisis_count = sum(1 for m in user_msgs if m.flagged_crisis)
    total = len(user_msgs)
    hm = db.query(HealthMetric).filter_by(user_id=user.id).all()
    mood_avg = round(sum(h.mood for h in hm)/len(hm), 2) if hm else None
    return {
        "total_user_messages": total,
        "crisis_flags": crisis_count,
        "mood_avg": mood_avg,
        "health_count": len(hm)
    }

@app.post("/feedback")
def feedback(f: FeedbackIn, db: Session = Depends(get_db)):
    user = get_or_create_demo_user(db)
    rec = Feedback(user_id=user.id, rating=f.rating, comment=f.comment, meta=f.meta or {})
    db.add(rec); db.commit()
    # Achievement
    exists = db.query(Achievement).filter_by(user_id=user.id, code="LEFT_FEEDBACK").first()
    if not exists:
        a = Achievement(user_id=user.id, code="LEFT_FEEDBACK", title="Helper",
                        description="You left feedback to improve the assistant.")
        db.add(a); db.commit()
    return {"ok": True}

# ---- Text-to-Speech endpoint ----
class TextToSpeechRequest(BaseModel):
    text: str
    lang: str = "en-US"

@app.post("/tts")
async def text_to_speech(req: TextToSpeechRequest):
    """Generate audio from text using browser Web Speech API"""
    # Return text for browser to process
    # The frontend will use the Web Speech API to generate audio
    return {"text": req.text, "lang": req.lang, "method": "web-speech-api"}

@app.get("/suggestions")
def suggestions(db: Session = Depends(get_db)):
    # Simple personalization: if mood low, suggest lighter routines
    hm = db.query(HealthMetric).order_by(HealthMetric.id.desc()).first()
    if not hm:
        return {"tips": [
            "Try a 10-minute walk and hydrate.",
            "Wind down with a 5-minute breathing exercise before bed."
        ]}
    tips = []
    if hm.mood <= 2: tips += [
        "Short, gentle movement (5–10 min) to get started.",
        "Text a friend a simple hello—low-effort social touchpoint.",
        "Aim for consistent sleep: same wake time tomorrow."
    ]
    if hm.sleep_hours < 6: tips.append("Try a screen-free 30 minutes before bed tonight.")
    if hm.steps < 4000: tips.append("Consider a light walk after your next meal.")
    if hm.exercise_minutes < 15: tips.append("Do a 2-minute stretch break between tasks.")
    if not tips:
        tips = ["Keep the momentum—maybe a 20-minute brisk walk or a light strength session."]
    return {"tips": tips[:5]}

@app.get("/achievements")
def get_achievements(db: Session = Depends(get_db)):
    user = get_or_create_demo_user(db)
    items = db.query(Achievement).filter_by(user_id=user.id).order_by(Achievement.created_at.desc()).all()
    return {"achievements": [{"code": a.code, "title": a.title, "description": a.description} for a in items]}

@app.get("/emergency")
def emergency():
    # Minimal static info; frontend shows 988 prominently (US)
    return {
        "notice": "If you are in immediate danger, call your local emergency number.",
        "us": "Call or text 988 (Suicide & Crisis Lifeline) or visit 988lifeline.org"
    }

# Future: webhook for physical device integration
@app.post("/device/webhook")
def device_webhook():
    return {"ok": True, "note": "Device integration endpoint placeholder."}
