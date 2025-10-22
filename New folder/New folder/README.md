# MindMate - Mental Health Support Application

A compassionate, ethically-safe mental health support application built with FastAPI and vanilla JavaScript.

## Features

- **Empathetic Chatbot**: AI-powered mental health support with crisis detection
- **Health Tracking**: Mood, sleep, exercise, and wellness metrics
- **Coping Exercises**: Evidence-based breathing and grounding techniques
- **Achievement System**: Gamification to encourage engagement
- **Analytics Dashboard**: Personal insights and progress tracking
- **Crisis Support**: Emergency resources and crisis intervention

## Project Structure

```
├── backend/
│   ├── requirements.txt
│   ├── database.py
│   ├── models.py
│   └── app.py
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
└── README.md
```

## Setup Instructions

### 1. Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure LLM (Optional)

The app can work with different LLM providers:

#### Option A: OpenRouter (Free Tier - Recommended)
```bash
# Get free API key from: https://openrouter.ai/
export OPENROUTER_API_KEY="your-api-key-here"
```

#### Option B: Hugging Face (Free Tier)
```bash
# Get free API key from: https://huggingface.co/settings/tokens
export HUGGINGFACE_API_KEY="your-api-key-here"
```

#### Option C: Local Ollama (Free, runs locally)
```bash
# Install Ollama from: https://ollama.ai/
ollama run llama3.2
export LLM_ENDPOINT="http://localhost:11434/api/chat"
export LLM_MODEL="llama3.2"
```

#### Option D: No LLM (Fallback Mode)
The app will work with intelligent fallback responses if no LLM is configured.

### 3. Start Backend

```bash
cd backend
uvicorn app:app --reload
```

The API will be available at `http://localhost:8000`

### 4. Start Frontend

```bash
cd frontend
python -m http.server 8080
```

The frontend will be available at `http://localhost:8080`

## Usage

1. Open `http://localhost:8080` in your browser
2. Start chatting with the mental health assistant
3. Track your daily health metrics
4. Try the coping exercises
5. View your progress and achievements

## API Endpoints

- `POST /chat` - Chat with the mental health assistant
- `GET /exercises` - Get coping exercises
- `GET /faq` - Get frequently asked questions
- `POST /health` - Log health metrics
- `GET /analytics` - Get user analytics
- `POST /feedback` - Submit feedback
- `GET /suggestions` - Get personalized tips
- `GET /achievements` - Get user achievements
- `GET /emergency` - Get emergency resources

## Safety Features

- **Crisis Detection**: Automatically detects crisis language
- **Ethical Guardrails**: Ensures appropriate responses
- **Emergency Resources**: Provides crisis hotlines and resources
- **Professional Care Reminders**: Encourages professional help when needed

## Important Notes

⚠️ **This is NOT medical care** - It's supportive guidance only. Always seek professional help for mental health concerns.

## Development

The application uses:
- **Backend**: FastAPI, SQLAlchemy, SQLite
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Database**: SQLite (local development)
- **AI**: Configurable LLM integration

## License

This is a hackathon project for educational purposes.
