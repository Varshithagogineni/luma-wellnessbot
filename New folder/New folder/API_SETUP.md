# 🤖 Open Source API Setup Guide

MindMate supports multiple open source AI APIs to provide intelligent mental health support. Here's how to set them up:

## 🆓 Free Options (Recommended)

### 1. OpenRouter (Easiest Setup)
- **Cost**: Free tier available
- **Setup**: 
  1. Go to [https://openrouter.ai/](https://openrouter.ai/)
  2. Sign up for a free account
  3. Get your API key from the dashboard
  4. Set environment variable:
     ```bash
     export OPENROUTER_API_KEY="your-api-key-here"
     ```

### 2. Hugging Face (Free Tier)
- **Cost**: Free tier available
- **Setup**:
  1. Go to [https://huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
  2. Create a free account
  3. Generate a new token
  4. Set environment variable:
     ```bash
     export HUGGINGFACE_API_KEY="your-api-key-here"
     ```

### 3. Local Ollama (Completely Free)
- **Cost**: Free, runs on your computer
- **Setup**:
  1. Install Ollama from [https://ollama.ai/](https://ollama.ai/)
  2. Run a model:
     ```bash
     ollama run llama3.2
     ```
  3. Set environment variables:
     ```bash
     export LLM_ENDPOINT="http://localhost:11434/api/chat"
     export LLM_MODEL="llama3.2"
     ```

## 🔧 Configuration

### Option 1: Environment Variables
```bash
# Choose one of the above options and set the variables
export OPENROUTER_API_KEY="your-key"
# OR
export HUGGINGFACE_API_KEY="your-key"
# OR
export LLM_ENDPOINT="http://localhost:11434/api/chat"
```

### Option 2: Create .env file
Create a `.env` file in the backend directory:
```bash
cd backend
cp config_example.txt .env
# Edit .env with your API keys
```

## 🧪 Testing Your Setup

1. Start the backend:
   ```bash
   cd backend
   source .venv/bin/activate
   uvicorn app:app --reload
   ```

2. Test the chat endpoint:
   ```bash
   curl -X POST http://localhost:8000/chat \
     -H "Content-Type: application/json" \
     -d '{"text": "I feel anxious today"}'
   ```

3. If you get a personalized response, your API is working!

## 🎯 API Comparison

| Provider | Cost | Setup Difficulty | Quality | Privacy |
|----------|------|------------------|--------|---------|
| OpenRouter | Free tier | Easy | High | Cloud |
| Hugging Face | Free tier | Easy | Good | Cloud |
| Ollama | Free | Medium | High | Local |
| Fallback | Free | None | Basic | Local |

## 🚨 Important Notes

- **No API keys required**: The app works with intelligent fallback responses
- **Privacy**: Ollama keeps everything local, others use cloud services
- **Rate limits**: Free tiers have usage limits
- **Backup**: Always have fallback responses for reliability

## 🆘 Troubleshooting

### "API key not working"
- Check your API key is correct
- Ensure you have credits/quota remaining
- Try a different provider

### "Connection timeout"
- Check your internet connection
- Verify the API endpoint is correct
- Try the fallback mode

### "Model not responding"
- The app will automatically use fallback responses
- Check the console for error messages
- Try a different model

## 🎉 Success!

Once configured, your MindMate chatbot will provide:
- ✅ Intelligent, contextual responses
- ✅ Mental health-specific guidance
- ✅ Crisis detection and support
- ✅ Personalized coping strategies

The chatbot will automatically detect emotions and provide appropriate support, whether you're feeling sad, anxious, angry, or just need someone to talk to.
