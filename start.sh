#!/bin/bash
# NepalGo — Start Frontend + Backend
# Double-click this file or run: ./start.sh

DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🏔️  Starting NepalGo..."
echo ""

# ── Backend (FastAPI on port 8080) ──
echo "🐍 Starting backend..."
cd "$DIR/backend"
if [ ! -d "venv" ]; then
    echo "   Creating Python virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt -q
else
    source venv/bin/activate
fi
uvicorn main:app --host 0.0.0.0 --port 8080 --reload &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"

# ── Frontend (Next.js on port 3000) ──
echo "⚛️  Starting frontend..."
cd "$DIR/frontend"
if [ ! -d "node_modules" ]; then
    echo "   Installing dependencies..."
    npm install
fi
npm run dev &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"

echo ""
echo "✅ NepalGo is running!"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8080"
echo "   API Docs: http://localhost:8080/docs"
echo ""
echo "Press Ctrl+C to stop both servers."

# Trap Ctrl+C to kill both
trap "echo ''; echo '🛑 Stopping NepalGo...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM

# Wait for both
wait
