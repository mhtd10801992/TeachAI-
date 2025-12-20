# 🚀 TeachAI Hosting Setup - Complete!

All hosting configuration files have been created for your TeachAI application.

## 📦 What Was Created

### Configuration Files

- ✅ **firebase.json** - Firebase hosting configuration
- ✅ **storage.rules** - Firebase Storage security rules
- ✅ **.firebaserc** - Firebase project configuration (try1-7d848)
- ✅ **deploy.ps1** - Automated deployment script for Windows
- ✅ **start-dev.ps1** - Local development startup script

### Documentation

- ✅ **DEPLOYMENT_GUIDE.md** - Complete deployment instructions
- ✅ **QUICKSTART_DEPLOY.md** - Quick 5-minute deployment guide

### Backend Deployment Files

- ✅ **backend/Dockerfile** - Docker containerization for backend
- ✅ **backend/.dockerignore** - Docker ignore rules

### Frontend Configuration

- ✅ **frontend/.env.production.template** - Production environment template
- ✅ Updated **frontend/src/api/api.js** - Environment-aware API configuration

---

## 🎯 Quick Start Options

### Option 1: Deploy Frontend Only (Fastest)

```powershell
# Make sure Firebase CLI is installed and you're logged in
firebase login

# Run the deploy script
.\deploy.ps1
```

Your frontend will be live at: **https://try1-7d848.web.app**

### Option 2: Full Development Mode

```powershell
# Start both backend and frontend locally
.\start-dev.ps1
```

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

---

## 🌐 Hosting Architecture

```
┌─────────────────────────────────────────┐
│         Firebase Hosting                │
│   https://try1-7d848.web.app           │
│                                         │
│   • Static Frontend (React + Vite)     │
│   • Auto SSL/HTTPS                      │
│   • Global CDN                          │
└─────────────┬───────────────────────────┘
              │
              │ API Calls
              ▼
┌─────────────────────────────────────────┐
│      Backend Server (Choose One)        │
│                                         │
│  Options:                               │
│  • Railway (easiest)                    │
│  • Render (free tier)                   │
│  • Heroku                               │
│  • Google Cloud Run (recommended)       │
│                                         │
│  • Node.js Express API                  │
│  • Connects to Firebase Storage         │
│  • OpenAI API integration               │
│  • Pinecone vector database             │
└─────────────────────────────────────────┘
```

---

## 📋 Deployment Steps Summary

### 1. Deploy Frontend to Firebase Hosting ✨

```powershell
.\deploy.ps1
```

### 2. Deploy Backend (Choose Platform)

#### Railway (Recommended - Easiest)

1. Visit https://railway.app
2. Sign up with GitHub
3. New Project → Deploy from GitHub
4. Select repository, set root: `backend`
5. Add environment variables
6. Deploy automatically!

#### Render (Free Tier)

1. Visit https://render.com
2. New Web Service
3. Connect repo, root: `backend`
4. Build: `npm install`, Start: `npm start`
5. Add environment variables
6. Deploy!

#### Google Cloud Run (Best Performance)

```bash
cd backend
gcloud builds submit --tag gcr.io/try1-7d848/teachai-backend
gcloud run deploy teachai-backend --image gcr.io/try1-7d848/teachai-backend --platform managed
```

### 3. Configure Frontend with Backend URL

```powershell
# Create production config
cd frontend
Copy-Item .env.production.template .env.production

# Edit .env.production with your backend URL
# VITE_API_URL=https://your-backend-url.com/api

# Rebuild and redeploy frontend
cd ..
.\deploy.ps1
```

---

## 🔐 Required Environment Variables (Backend)

Add these to your hosting platform:

```env
# OpenAI
OPENAI_API_KEY=sk-...

# Pinecone
PINECONE_API_KEY=...
PINECONE_ENVIRONMENT=...
PINECONE_INDEX_NAME=teachai-documents

# Firebase
FIREBASE_PROJECT_ID=try1-7d848
FIREBASE_STORAGE_BUCKET=try1-7d848.firebasestorage.app

# Server
PORT=5000
NODE_ENV=production
```

**Important:** Also upload `backend/config/firebase-admin-key.json` as a secret/file to your hosting platform.

---

## 🧪 Testing Your Deployment

### Test Frontend

1. Visit: https://try1-7d848.web.app
2. Should see the TeachAI interface
3. Check browser console for errors

### Test Backend

```bash
# Health check
curl https://your-backend-url.com/api/health

# Should return: {"status":"OK","message":"Backend is running"}
```

### Test Full Integration

1. Upload a test document via the UI
2. Check if it processes successfully
3. Try asking AI questions about the document

---

## 💡 Tips for Success

### Before Deploying

- ✅ Test locally first with `.\start-dev.ps1`
- ✅ Ensure all environment variables are set
- ✅ Verify Firebase service account JSON is valid
- ✅ Test OpenAI API key works
- ✅ Create Pinecone index if needed

### After Deploying

- 📊 Monitor Firebase Console for hosting stats
- 📊 Check backend logs for errors
- 💰 Set up billing alerts (free tier limits)
- 🔒 Review security rules in Firebase

### Cost Management

- Firebase Hosting: 10GB storage, 360MB/day free
- Firebase Storage: 5GB storage, 1GB/day free
- Backend hosting: Most platforms have free tiers
- OpenAI: Monitor usage carefully!

---

## 🆘 Troubleshooting

### "Cannot connect to backend"

- Check if backend is running
- Verify CORS settings allow your frontend domain
- Confirm `.env.production` has correct backend URL
- Rebuild and redeploy frontend

### "Firebase Storage permission denied"

- Deploy storage rules: `firebase deploy --only storage`
- Check service account has correct permissions
- Verify bucket name in backend config

### "OpenAI API error"

- Check API key is valid and has credits
- Verify environment variable is set correctly
- Check OpenAI dashboard for usage/errors

### Build fails

```powershell
# Clear and rebuild
cd frontend
Remove-Item -Recurse -Force node_modules, dist
npm install
npm run build
```

---

## 📚 Documentation Files

- **DEPLOYMENT_GUIDE.md** - Detailed deployment instructions
- **QUICKSTART_DEPLOY.md** - Fast 5-minute deployment
- **FIREBASE_SETUP_COMPLETE.md** - Firebase configuration info
- **FIREBASE_STORAGE_GUIDE.md** - Storage setup details
- **OPENAI_INTEGRATION_GUIDE.md** - OpenAI integration guide

---

## ✅ Deployment Checklist

### Pre-Deployment

- [ ] Firebase CLI installed (`npm install -g firebase-tools`)
- [ ] Logged into Firebase (`firebase login`)
- [ ] Backend environment variables ready
- [ ] Firebase service account JSON file ready
- [ ] OpenAI API key active
- [ ] Pinecone account and index created

### Deployment

- [ ] Frontend deployed to Firebase Hosting
- [ ] Backend deployed to hosting platform
- [ ] Environment variables configured on backend
- [ ] Frontend `.env.production` updated
- [ ] Frontend redeployed with backend URL

### Testing

- [ ] Frontend loads at https://try1-7d848.web.app
- [ ] Backend health check responds
- [ ] Can upload documents
- [ ] AI processing works
- [ ] Can query documents

### Post-Deployment

- [ ] Set up monitoring/alerts
- [ ] Configure custom domain (optional)
- [ ] Enable analytics (optional)
- [ ] Document production URLs for team

---

## 🎉 Success!

You now have everything needed to host TeachAI!

**Quick Deploy:**

```powershell
.\deploy.ps1
```

**Full Guide:** See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

**Questions?** Check the troubleshooting sections in the documentation files.

---

## 🔗 Quick Links

- Firebase Console: https://console.firebase.google.com/project/try1-7d848
- Your Frontend: https://try1-7d848.web.app
- Railway: https://railway.app
- Render: https://render.com
- OpenAI Dashboard: https://platform.openai.com

---

Happy Deploying! 🚀
