#!/usr/bin/env powershell
# EduAI Local Development Setup Script
# Run: .\start_dev.ps1

Write-Host "🧠 EduAI - Starting Local Development Environment" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

# Check .env
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  .env not found - copying from .env.example" -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✏️  Please edit .env and set your OPENAI_API_KEY then re-run." -ForegroundColor Red
    exit 1
}

# Check OPENAI_API_KEY is set
$envContent = Get-Content ".env"
if ($envContent -match "sk-your-openai-api-key-here") {
    Write-Host "❌ ERROR: Please set your real OPENAI_API_KEY in .env" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Choose startup mode:" -ForegroundColor Green
Write-Host "  1) Docker (full stack with PostgreSQL + Redis)"
Write-Host "  2) Local dev (SQLite backend + Vite frontend)"
Write-Host ""
$choice = Read-Host "Enter 1 or 2"

if ($choice -eq "1") {
    Write-Host "🐳 Starting with Docker Compose..." -ForegroundColor Cyan
    docker compose up --build
} else {
    Write-Host "🐍 Starting local dev mode..." -ForegroundColor Cyan

    # Backend
    Write-Host "Setting up Python backend..." -ForegroundColor Yellow
    Set-Location backend
    if (-not (Test-Path "venv")) {
        python -m venv venv
    }
    .\venv\Scripts\activate
    pip install -r requirements.txt -q
    
    # Run DB migrations
    $env:FLASK_APP = "run.py"
    $env:DATABASE_URL = "sqlite:///eduai_dev.db"
    python -c "from app import create_app, db; app=create_app(); ctx=app.app_context(); ctx.push(); db.create_all(); print('DB tables created')"
    
    Write-Host "Starting Flask backend on http://localhost:5000 ..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; .\venv\Scripts\activate; python run.py"
    
    Set-Location ..

    # Frontend
    Write-Host "Starting Vite frontend on http://localhost:3000 ..." -ForegroundColor Green
    Set-Location frontend
    if (-not (Test-Path "node_modules")) {
        npm install
    }
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev -- --port 3000"
    Set-Location ..

    Write-Host ""
    Write-Host "✅ EduAI is starting!" -ForegroundColor Green
    Write-Host "   Frontend: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "   Backend:  http://localhost:5000" -ForegroundColor Cyan
    Write-Host "   API Docs: http://localhost:5000/api/health" -ForegroundColor Cyan
}
