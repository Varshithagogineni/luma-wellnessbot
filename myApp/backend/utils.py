import re
from typing import Dict, Any, List
import google.generativeai as genai
import httpx
import os
from datetime import datetime

class SafetyUtils:
    CRISIS_PATTERNS = [
        r"\b(suicide|kill myself|end my life|self-harm|self harm|want to die)\b",
        r"\b(hurting myself|cutting|overdose)\b",
        r"\b(depression|severe anxiety|panic attack)\b"
    ]

    @staticmethod
    def detect_crisis(text: str) -> bool:
        text_lower = text.lower()
        return any(re.search(p, text_lower) for p in SafetyUtils.CRISIS_PATTERNS)

    @staticmethod
    def get_crisis_response() -> str:
        return (
            "I'm really concerned about what you're sharing and I want to make sure you're safe. "
            "If you're having thoughts of harming yourself, please know that help is available:\n\n"
            "🇺🇸 US: Call or text 988 (24/7 Crisis Lifeline)\n"
            "🌍 International: Your local emergency services\n"
            "🤝 Crisis Text Line: Text HOME to 741741\n\n"
            "Would you be willing to talk to someone right now? These services are free, confidential, and available 24/7."
        )

class AIUtils:
    SYSTEM_PROMPT = """You are Luma, a caring mental health companion. Your responses must be:
    1. SHORT and CLEAR (1-2 sentences maximum)
    2. Warm and supportive
    3. Free of medical advice
    4. Using simple language
    5. Focused on emotional support
    
    Example responses:
    - "I hear how difficult this is for you, and I'm here to listen."
    - "That sounds really challenging, and it's brave of you to share this."
    - "Your feelings are valid, and it's okay to take things one step at a time."
    """

    @staticmethod
    async def get_ai_response(messages: List[Dict[str, str]], safety_check: bool = True) -> str:
        if safety_check and any(SafetyUtils.detect_crisis(m["content"]) for m in messages if m["role"] == "user"):
            return SafetyUtils.get_crisis_response()

        # Try Gemini API first
        try:
            gemini_key = os.getenv("GEMINI_API_KEY")
            if gemini_key:
                genai.configure(api_key=gemini_key)
                model = genai.GenerativeModel("gemini-pro")
                
                # Combine messages into a single prompt
                prompt = AIUtils.SYSTEM_PROMPT + "\n\n"
                for msg in messages:
                    prompt += f"{msg['role'].upper()}: {msg['content']}\n"
                
                response = model.generate_content(prompt)
                if response and response.text:
                    return response.text.strip()
        except Exception as e:
            print(f"Gemini API error: {str(e)}")

        # Fallback responses based on keywords
        user_text = messages[-1]["content"].lower()
        
        if any(word in user_text for word in ["sad", "depressed", "down"]):
            return "I hear you, and it's okay to feel this way. You're not alone in this moment."
        elif any(word in user_text for word in ["anxious", "worried", "scared"]):
            return "Those feelings of anxiety are real, and I'm here to listen. Take a deep breath with me."
        elif any(word in user_text for word in ["angry", "mad", "frustrated"]):
            return "Your feelings of frustration are valid. I'm here to listen without judgment."
        else:
            return "I'm here to listen and support you. Would you like to tell me more?"

class ExerciseUtils:
    @staticmethod
    def get_personalized_exercises(mood: int, anxiety_level: int = 0) -> List[Dict[str, Any]]:
        base_exercises = [
            {
                "name": "Deep Breathing",
                "steps": ["Inhale for 4", "Hold for 4", "Exhale for 4"],
                "duration": "2 minutes"
            },
            {
                "name": "Grounding Exercise",
                "steps": ["Name 5 things you see", "4 things you feel", "3 things you hear"],
                "duration": "3 minutes"
            }
        ]

        if mood <= 3:
            base_exercises.append({
                "name": "Mood Lifter",
                "steps": ["Stand up", "Stretch gently", "Take 10 steps", "Look out a window"],
                "duration": "1 minute"
            })

        if anxiety_level > 5:
            base_exercises.append({
                "name": "Quick Calm",
                "steps": ["Close eyes", "Count to 10", "Focus on feet on ground"],
                "duration": "1 minute"
            })

        return base_exercises