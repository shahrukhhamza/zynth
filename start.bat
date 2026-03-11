@echo off
echo ========================================
echo Starting Financial Dashboard
echo ========================================
echo.

REM Kill any existing Node processes
echo Stopping any existing servers...
taskkill /F /IM node.exe >nul 2>&1

REM Wait a moment
timeout /t 2 /nobreak >nul

REM Start backend server
echo Starting backend server on port 5000...
start "Backend Server" cmd /k "cd /d "%~dp0server" && "C:\Program Files\nodejs\node.exe" server.js"

REM Wait for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend server
echo Starting frontend server...
start "Frontend Server" cmd /k "cd /d "%~dp0client" && set PATH=C:\Program Files\nodejs;%PATH% && npm run dev"

REM Wait for frontend to start
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo Dashboard is starting!
echo ========================================
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo Press any key to open dashboard in browser...
pause >nul

REM Open browser
start http://localhost:5173

echo.
echo Dashboard is running!
echo Close this window when you're done.
echo.
pause
