#!/usr/bin/env bash
set -e

echo "Starting Student Data Source of Truth..."

(cd backend && pip install -q -r requirements.txt && uvicorn main:app --reload --port 8000) &
BACKEND_PID=$!

(cd frontend && npm install --silent && npm run dev) &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT

echo "Backend:  http://localhost:8000/docs"
echo "Frontend: http://localhost:3000"

wait
