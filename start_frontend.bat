@echo off
cd /d "%~dp0frontend"
echo Installing Node.js dependencies...
npm install
echo.
echo Starting Plant Tracker frontend on http://localhost:5173
npm run dev
