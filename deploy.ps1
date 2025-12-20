# TeachAI Deployment Script for Firebase Hosting
# This script builds the frontend and deploys to Firebase

Write-Host "🚀 TeachAI Deployment Script" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if Firebase CLI is installed
Write-Host "📦 Checking Firebase CLI..." -ForegroundColor Yellow
$firebaseInstalled = Get-Command firebase -ErrorAction SilentlyContinue
if (-not $firebaseInstalled) {
    Write-Host "❌ Firebase CLI not found. Installing..." -ForegroundColor Red
    Write-Host "Run: npm install -g firebase-tools" -ForegroundColor Yellow
    Write-Host "Then login: firebase login" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Firebase CLI found" -ForegroundColor Green
Write-Host ""

# Navigate to frontend directory
Write-Host "📁 Building frontend..." -ForegroundColor Yellow
Set-Location frontend

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
    npm install
}

# Build the frontend
Write-Host "🔨 Building production bundle..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Frontend build complete" -ForegroundColor Green
Write-Host ""

# Go back to root directory
Set-Location ..

# Deploy to Firebase
Write-Host "🚀 Deploying to Firebase..." -ForegroundColor Yellow
firebase deploy --only hosting

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Your app is now live!" -ForegroundColor Cyan
    Write-Host "View your app at: https://try1-7d848.web.app" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "⚠️  Remember to deploy your backend separately to a cloud platform:" -ForegroundColor Yellow
    Write-Host "   - Heroku: https://heroku.com" -ForegroundColor White
    Write-Host "   - Railway: https://railway.app" -ForegroundColor White
    Write-Host "   - Render: https://render.com" -ForegroundColor White
    Write-Host "   - Google Cloud Run: https://cloud.google.com/run" -ForegroundColor White
} else {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    exit 1
}
