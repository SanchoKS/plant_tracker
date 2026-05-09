@echo off
cd /d "%~dp0backend"
echo Installing Python dependencies...
pip install -r requirements.txt
echo.
echo Starting Plant Tracker backend on http://localhost:8000
uvicorn main:app --reload --host 127.0.0.1 --port 8000
