# Financial Dashboard Startup Script
# This script starts both backend and frontend servers

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Financial Dashboard Startup" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

# Kill any existing Node and Python server processes
Write-Host "Stopping any existing servers..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
@(5000, 5173) | ForEach-Object {
    $port = $_
    $pids = (netstat -ano 2>$null) | Select-String "LISTENING" | Select-String ":$port " |
        ForEach-Object { ($_ -split '\s+')[-1] } | Sort-Object -Unique
    foreach ($p in $pids) {
        if ($p -match '^\d+$') {
            taskkill /PID $p /F 2>$null | Out-Null
        }
    }
}
Start-Sleep -Seconds 2

# Start backend server
Write-Host "`nStarting backend server on port 5000..." -ForegroundColor Yellow
$backendPath = Join-Path $PSScriptRoot "server"
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$backendPath'; & 'C:\Program Files\nodejs\node.exe' server.js"
) -WindowStyle Normal

Start-Sleep -Seconds 3

# Start frontend server
Write-Host "Starting frontend server..." -ForegroundColor Yellow
$clientPath = Join-Path $PSScriptRoot "client"
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "`$env:Path = 'C:\Program Files\nodejs;' + `$env:Path; cd '$clientPath'; & 'C:\Program Files\nodejs\npm.cmd' run dev"
) -WindowStyle Normal

Write-Host "`nWaiting for servers to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Dashboard is ready!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nBackend:  " -NoNewline -ForegroundColor White
Write-Host "http://localhost:5000" -ForegroundColor Green
Write-Host "Frontend: " -NoNewline -ForegroundColor White
Write-Host "http://localhost:5173" -ForegroundColor Green
Write-Host "`n========================================`n" -ForegroundColor Cyan

# Check API key status
Write-Host "Checking API configuration..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

try {
    $stats = Invoke-RestMethod -Uri "http://localhost:5000/api/key-stats" -TimeoutSec 5
    Write-Host "`n✓ Backend running" -ForegroundColor Green
    Write-Host "✓ API Keys loaded: $($stats.totalKeys)" -ForegroundColor Green
    
    if ($stats.totalKeys -gt 0) {
        Write-Host "`nAPI Key Status:" -ForegroundColor Cyan
        foreach ($key in $stats.stats) {
            $statusColor = if ($key.available) { "Green" } else { "Red" }
            Write-Host "  Key #$($key.index): $($key.key) - " -NoNewline
            Write-Host "Available" -ForegroundColor $statusColor
        }
    }
} catch {
    Write-Host "`n⚠ Backend may still be starting..." -ForegroundColor Yellow
}

Write-Host "`n`nOpening dashboard in browser..." -ForegroundColor Cyan
Start-Sleep -Seconds 2
Start-Process "http://localhost:5173"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Dashboard is running!" -ForegroundColor Green
Write-Host "Keep the server windows open." -ForegroundColor Yellow
Write-Host "Press any key to exit..." -ForegroundColor White
Write-Host "========================================`n" -ForegroundColor Cyan

$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
