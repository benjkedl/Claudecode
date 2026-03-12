#!/bin/bash
set -e

echo "=== LLM Learning Platform ==="
echo ""

# Check for ANTHROPIC_API_KEY
if [ -z "$ANTHROPIC_API_KEY" ]; then
  if [ -f backend/.env ]; then
    export $(cat backend/.env | xargs)
  else
    echo "ERROR: ANTHROPIC_API_KEY not set. Create backend/.env or set the env var."
    exit 1
  fi
fi

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
pip install -r requirements.txt -q
cd ..

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install --silent
cd ..

echo ""
echo "Starting services..."
echo "  Backend: http://localhost:8000"
echo "  Frontend: http://localhost:3000"
echo "  API Docs: http://localhost:8000/docs"
echo ""

# Start backend in background
cd backend
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

# Start frontend
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait for both
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
