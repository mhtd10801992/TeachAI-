# Quick Start: Deploy TeachAI to Production

## 🚀 Quick Deploy (5 minutes)

### Step 1: Install Firebase CLI (if not already installed)

```powershell
npm install -g firebase-tools
firebase login
```

### Step 2: Deploy Frontend

```powershell
# Just run the deploy script!
.\deploy.ps1
```

Your frontend will be live at: `https://try1-7d848.web.app`

---

## ⚙️ Configure Backend URL

### For Production Deployment:

1. Create `.env.production` in frontend folder:

```powershell
cd frontend
Copy-Item .env.production.template .env.production
```

2. Edit `frontend/.env.production` with your backend URL:

```env
VITE_API_URL=https://your-backend-url.com/api
```

3. Rebuild and redeploy:

```powershell
.\deploy.ps1
```

---

## 🖥️ Deploy Backend

Choose one platform (all have free tiers):

### Option 1: Railway (Easiest - 5 minutes)

1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Set root directory: `backend`
6. Add environment variables (see DEPLOYMENT_GUIDE.md)
7. Click Deploy!

### Option 2: Render (Free tier available)

1. Go to https://render.com
2. Create "New Web Service"
3. Connect GitHub repository
4. Root directory: `backend`
5. Build: `npm install`
6. Start: `npm start`
7. Add environment variables
8. Deploy!

### Option 3: Heroku

```bash
cd backend
heroku login
heroku create teachai-backend
# Add environment variables in Heroku dashboard
git push heroku main
```

---

## 📋 Required Environment Variables (for backend)

Add these to your hosting platform:

```env
OPENAI_API_KEY=sk-...
PINECONE_API_KEY=...
PINECONE_ENVIRONMENT=...
PINECONE_INDEX_NAME=teachai-documents
FIREBASE_PROJECT_ID=try1-7d848
FIREBASE_STORAGE_BUCKET=try1-7d848.firebasestorage.app
PORT=5000
```

Also upload `backend/config/firebase-admin-key.json` (see platform docs for secrets/file uploads)

---

## ✅ Verify Deployment

1. Frontend: Visit `https://try1-7d848.web.app`
2. Backend: Visit `https://your-backend-url.com/api/health`
3. Test upload: Upload a document and check if it processes

---

## 🆘 Need Help?

See detailed guide: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

---

## 🎯 Status Checklist

- [ ] Firebase CLI installed and logged in
- [ ] Frontend deployed (`.\deploy.ps1`)
- [ ] Backend deployed to platform
- [ ] Environment variables configured
- [ ] Frontend `.env.production` updated with backend URL
- [ ] Frontend redeployed with correct backend URL
- [ ] Tested upload functionality
- [ ] Tested AI processing

**You're done! 🎉**
