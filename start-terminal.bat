@echo off
SET PATH=C:\Program Files\nodejs;C:\Users\hp\AppData\Roaming\npm;%PATH%
cd /d "D:\US DATA"
pm2 resurrect
IF %ERRORLEVEL% NEQ 0 (
    pm2 start ecosystem.config.cjs
)
pm2 save
