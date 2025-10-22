# 🚀 MindMate - Quick Start Guide

## ✅ Status: LIVE AND FULLY OPERATIONAL

Your MindMate mental health support application is **running now** with **Google Gemini AI**!

---

## 🎯 Get Started in 3 Steps

### Step 1: Open the App
👉 **Go to:** http://127.0.0.1:8080

### Step 2: Start Chatting
- Type any concern or emotion you want to discuss
- The Gemini-powered AI will provide empathetic, supportive responses
- Get personalized coping strategies

### Step 3: Explore Features
- 🧘 **Exercises**: Try breathing and grounding techniques
- 📊 **Track Health**: Log your mood, sleep, exercise
- 📈 **Analytics**: View your progress and patterns
- 🏆 **Achievements**: Unlock badges for engagement

---

## 🔗 Important URLs

| Feature | URL |
|---------|-----|
| **App Frontend** | http://127.0.0.1:8080 |
| **API Documentation** | http://127.0.0.1:8000/docs |
| **API Base URL** | http://127.0.0.1:8000 |

---

## 🤖 AI Features

✅ **Gemini AI-Powered Chatbot**
- Real, intelligent mental health support
- Crisis detection and safety protocols
- Personalized coping strategies
- Available 24/7

---

## 📋 Available Endpoints

### Chat (Uses Gemini AI)
```bash
POST /chat
Body: {"text": "Your message here"}
```

### Health Tracking
```bash
POST /health
Body: {
  "date": "2025-10-21",
  "mood": 3,
  "sleep_hours": 7,
  "steps": 5000,
  "exercise_minutes": 30,
  "notes": "Had a good day"
}
```

### Exercises
```bash
GET /exercises          # All exercises
GET /exercises/personalized  # Tailored to your needs
POST /exercises/reaction # Provide feedback
```

### More Endpoints
```bash
GET /analytics          # Your statistics
GET /suggestions        # Personalized tips
GET /achievements       # Your badges
GET /emergency          # Crisis resources
GET /faq                # Questions answered
```

---

## 🎯 How to Use

### 1. **Chat with AI**
- Go to the Chat tab
- Type what's on your mind
- Get instant support from Gemini

### 2. **Track Your Mood**
- Go to Health tab
- Log daily: mood (1-5), sleep, exercise
- Track patterns over time

### 3. **Try Exercises**
- Go to Exercises tab
- Select a breathing or grounding technique
- Follow the steps
- Rate how helpful it was

### 4. **View Your Progress**
- Go to Analytics
- See mood trends
- Track engagement
- View achievements earned

### 5. **Emergency Support**
- Click Emergency button anytime
- Get immediate crisis resources
- 988 Lifeline (US) always available

---

## 🔧 Technical Details

### Backend
- **Framework**: FastAPI
- **AI Model**: Google Gemini (`gemini-pro`)
- **Database**: SQLite (local)
- **Server**: Uvicorn
- **Port**: 8000

### Frontend
- **Language**: HTML, CSS, JavaScript
- **Architecture**: Vanilla JS (no frameworks)
- **Server**: Python HTTP Server
- **Port**: 8080

### API Key
- **Provider**: Google Gemini API
- **Status**: ✅ Configured and Active
- **Model**: gemini-pro

---

## 📝 Example: Chat with Gemini

### Request
```json
{
  "text": "I'm feeling anxious about my presentation tomorrow"
}
```

### Response
```json
{
  "reply": "I'm really glad you reached out. I'm here to listen. I can't provide medical advice or replace professional care, but I can offer supportive information and coping strategies.\n\nI hear that you're feeling anxious about your presentation. That's a very human experience. Let's try the 5-4-3-2-1 grounding technique...",
  "unlocked": []
}
```

---

## ⚠️ Important Notes

🔐 **Safety First**
- This is NOT medical care
- Always seek professional help for serious concerns
- Emergency resources available in the app
- Crisis detected automatically and handled safely

📊 **Data Privacy**
- Your data is stored locally
- No external servers store your information
- For demo purposes only

---

## 🆘 Troubleshooting

### "Can't connect to frontend"
- Make sure you're using http:// not https://
- Try http://127.0.0.1:8080 (or localhost:8080)
- Check that port 8080 is not blocked

### "API not responding"
- Frontend won't load properly
- Make sure backend is running on port 8000
- Try http://127.0.0.1:8000/docs

### "Gemini not responding"
- Check internet connection
- Verify API key is valid
- Fallback mode will activate automatically

---

## 📞 Quick Actions

| Action | Go To |
|--------|-------|
| Chat with AI | http://127.0.0.1:8080 → Chat |
| Track Mood | http://127.0.0.1:8080 → Health |
| Try Exercises | http://127.0.0.1:8080 → Exercises |
| View Progress | http://127.0.0.1:8080 → Analytics |
| Emergency Help | http://127.0.0.1:8080 → Emergency |

---

## 🎉 You're All Set!

Everything is running and ready to use. 

**Next Step:** Open http://127.0.0.1:8080 and start chatting! 💚

---

## 📚 More Resources

- **API Docs**: http://127.0.0.1:8000/docs (interactive Swagger UI)
- **Full Setup Guide**: See `GEMINI_INTEGRATION.md`
- **Original README**: See `README.md`

---

**Happy using MindMate! 🌟**
