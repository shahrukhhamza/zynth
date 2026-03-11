@echo off
echo ============================================
echo  MT5 Trade Analysis Service
echo ============================================
echo.

cd /d "%~dp0mt5_service"

:: Check if venv exists, create if not
if not exist ".venv" (
    echo Creating Python virtual environment...
    python -m venv .venv
)

:: Activate venv
call .venv\Scripts\activate.bat

:: Install / upgrade dependencies
echo Installing dependencies...
pip install -r requirements.txt --quiet

echo.
echo Starting FastAPI service on http://localhost:8000
echo Press Ctrl+C to stop.
echo.
python main.py
