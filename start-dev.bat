@echo off
echo Starting Crypto Trade Tracker Development Environment...
echo.

echo Starting Backend (FastAPI)...
start "Backend" cmd /k "cd backend && uvicorn main:app --reload"

timeout /t 4 /nobreak >nul

echo Starting Frontend (React + Vite)...
start "Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers are starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo.
echo Press any key to exit...
pause >nul
