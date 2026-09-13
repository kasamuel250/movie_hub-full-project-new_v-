@echo off
echo Starting Ka_samuel@250 Filmz...
echo.

echo [1/2] Starting backend server on port 5000...
start "Filmz Server" cmd /c "cd /d "%~dp0server" && node index.js"

echo [2/2] Starting frontend dev server on port 5173...
cd /d "%~dp0client"
npx vite

pause
