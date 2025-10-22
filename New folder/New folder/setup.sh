#!/bin/bash

echo "🧠 MindMate Setup Script"
echo "========================"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    echo "Please install Python 3 and try again."
    exit 1
fi

echo "✅ Python 3 found"

# Setup backend
echo "📦 Setting up backend..."
cd backend

# Create virtual environment
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv .venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source .venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

echo "✅ Backend setup complete!"

# Start backend in background
echo "🚀 Starting backend server..."
uvicorn app:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Test backend
if curl -s http://localhost:8000/emergency > /dev/null; then
    echo "✅ Backend is running on http://localhost:8000"
else
    echo "❌ Backend failed to start"
    exit 1
fi

# Start frontend
echo "🌐 Starting frontend server..."
cd ../frontend
python3 -m http.server 8080 &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 2

# Test frontend
if curl -s http://localhost:8080 > /dev/null; then
    echo "✅ Frontend is running on http://localhost:8080"
else
    echo "❌ Frontend failed to start"
    exit 1
fi

echo ""
echo "🎉 MindMate is now running!"
echo ""
echo "📱 Open your browser and go to: http://localhost:8080"
echo ""
echo "🔧 Optional: Configure API keys for enhanced AI responses:"
echo "   - OpenRouter (Free): https://openrouter.ai/"
echo "   - Hugging Face (Free): https://huggingface.co/settings/tokens"
echo ""
echo "🛑 To stop the servers, press Ctrl+C"
echo ""

# Keep script running
trap "echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
