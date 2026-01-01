# Local Development Start Script
# This script starts both backend and frontend in development mode

Write-Host "Starting TeachAI Development Environment" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if a command exists
function Test-Command {
    param($Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

# Check Node.js installation
if (-not (Test-Command "node")) {
    Write-Host "❌ Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Node.js version: $(node --version)" -ForegroundColor Green

# Start Backend
Write-Host ""
Write-Host "Starting Backend Server..." -ForegroundColor Yellow
Write-Host "   Port: 5000" -ForegroundColor Gray
Write-Host "   URL: http://localhost:5000" -ForegroundColor Gray

$backendPath = Join-Path $PSScriptRoot "backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host 'Backend Server' -ForegroundColor Cyan; npm start"

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start Frontend
Write-Host ""
Write-Host "Starting Frontend Dev Server..." -ForegroundColor Yellow
Write-Host "   Port: 5173" -ForegroundColor Gray
Write-Host "   URL: http://localhost:5173" -ForegroundColor Gray

$frontendPath = Join-Path $PSScriptRoot "frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; Write-Host 'Frontend Dev Server' -ForegroundColor Cyan; npm run dev"

Write-Host ""
Write-Host "Development environment started!" -ForegroundColor Green
Write-Host ""
Write-Host "Access the application:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "   Backend:  http://localhost:5000" -ForegroundColor White
Write-Host ""
Write-Host "Two PowerShell windows opened:" -ForegroundColor Yellow
Write-Host "   1. Backend (Node.js server)" -ForegroundColor White
Write-Host "   2. Frontend (Vite dev server)" -ForegroundColor White
Write-Host ""
Write-Host "To stop: Close both PowerShell windows or press Ctrl+C in each" -ForegroundColor Yellow
