# 🎯 TeachAI Deployment Checklist

Use this checklist to ensure a smooth deployment.

## Phase 1: Pre-Deployment Setup ✅

### Firebase Setup

- [ ] Firebase CLI installed: `npm install -g firebase-tools`
- [ ] Logged into Firebase: `firebase login`
- [ ] Project ID confirmed: `try1-7d848`
- [ ] Firebase Storage bucket active

### Backend Dependencies

- [ ] OpenAI API key obtained and tested
- [ ] Pinecone account created
- [ ] Pinecone index created: `teachai-documents`
- [ ] Firebase service account JSON downloaded
- [ ] All backend dependencies installed: `cd backend && npm install`

### Frontend Dependencies

- [ ] All frontend dependencies installed: `cd frontend && npm install`
- [ ] Frontend builds successfully: `cd frontend && npm run build`

---

## Phase 2: Local Testing ✅

### Test Backend Locally

- [ ] Backend starts without errors: `cd backend && npm start`
- [ ] Health check responds: Visit http://localhost:5000/api/health
- [ ] Firebase Storage connected (check console logs)
- [ ] OpenAI API working (try uploading a test document)

### Test Frontend Locally

- [ ] Frontend starts: `cd frontend && npm run dev`
- [ ] App loads at http://localhost:5173
- [ ] Can navigate all views
- [ ] Can upload a document
- [ ] Document processes successfully
- [ ] AI chat works with uploaded documents

### Full Integration Test

- [ ] Upload a PDF document
- [ ] Verify AI extracts summary and topics
- [ ] Check document appears in history
- [ ] Ask AI a question about the document
- [ ] Verify response is relevant

---

## Phase 3: Deploy Frontend ✅

### Deploy to Firebase Hosting

- [ ] Run deployment script: `.\deploy.ps1`
- [ ] Build completes without errors
- [ ] Deployment succeeds
- [ ] Visit https://try1-7d848.web.app
- [ ] Frontend loads correctly
- [ ] Check browser console for errors

### Initial Frontend Test

- [ ] Homepage loads
- [ ] Navigation buttons work
- [ ] UI displays correctly
- [ ] No console errors

**Note:** API calls will fail until backend is deployed.

---

## Phase 4: Deploy Backend ✅

### Choose Hosting Platform

Select ONE platform:

- [ ] Railway (easiest - recommended)
- [ ] Render (free tier available)
- [ ] Heroku (requires credit card)
- [ ] Google Cloud Run (best performance)

### Deploy Backend

- [ ] Create new project/app on chosen platform
- [ ] Connect GitHub repository (if applicable)
- [ ] Set root directory to `backend`
- [ ] Configure build/start commands if needed

### Configure Environment Variables

Add ALL of these to your hosting platform:

**OpenAI:**

- [ ] `OPENAI_API_KEY=sk-...`

**Pinecone:**

- [ ] `PINECONE_API_KEY=...`
- [ ] `PINECONE_ENVIRONMENT=...`
- [ ] `PINECONE_INDEX_NAME=teachai-documents`

**Firebase:**

- [ ] `FIREBASE_PROJECT_ID=try1-7d848`
- [ ] `FIREBASE_STORAGE_BUCKET=try1-7d848.firebasestorage.app`

**Server:**

- [ ] `PORT=5000` (or platform's PORT variable)
- [ ] `NODE_ENV=production`

**Firebase Admin Key:**

- [ ] Upload `backend/config/firebase-admin-key.json` as secret/file
- [ ] OR set as environment variable (base64 encoded)

### Deploy Backend

- [ ] Trigger deployment
- [ ] Wait for build to complete
- [ ] Check deployment logs for errors
- [ ] Note the deployed URL

---

## Phase 5: Connect Frontend to Backend ✅

### Update Frontend Configuration

- [ ] Copy template: `cd frontend && Copy-Item .env.production.template .env.production`
- [ ] Edit `frontend/.env.production`
- [ ] Set `VITE_API_URL=https://your-backend-url.com/api`
- [ ] Save file

### Redeploy Frontend

- [ ] Return to root: `cd ..`
- [ ] Run deploy script: `.\deploy.ps1`
- [ ] Wait for deployment to complete
- [ ] Visit https://try1-7d848.web.app
- [ ] Check browser console - should connect to new backend

---

## Phase 6: Production Testing ✅

### Backend Tests

- [ ] Health check: `https://your-backend-url.com/api/health`
- [ ] Returns: `{"status":"OK","message":"Backend is running"}`
- [ ] Check platform logs for startup messages
- [ ] Verify Firebase Storage connected
- [ ] No error messages in logs

### Frontend Tests

- [ ] Load https://try1-7d848.web.app
- [ ] No console errors
- [ ] All navigation works
- [ ] UI renders correctly

### Full Integration Tests

Upload Document:

- [ ] Click "Upload Documents"
- [ ] Select a test PDF file
- [ ] Upload succeeds
- [ ] Processing starts
- [ ] Document appears in history

AI Processing:

- [ ] Summary is generated
- [ ] Topics are extracted
- [ ] No errors in validation dashboard

AI Chat:

- [ ] Navigate to "AI Chat"
- [ ] Document appears in list
- [ ] Ask a question about document
- [ ] Receive relevant answer
- [ ] Sources are cited

### Cross-Browser Testing

- [ ] Chrome/Edge - works
- [ ] Firefox - works
- [ ] Safari - works (if on Mac)
- [ ] Mobile browser - works

---

## Phase 7: Post-Deployment Setup ✅

### Monitoring

- [ ] Set up Firebase Hosting usage alerts
- [ ] Set up backend platform monitoring
- [ ] Configure error alerting (if available)
- [ ] Monitor OpenAI API usage
- [ ] Check Pinecone usage

### Security

- [ ] Review Firebase Storage rules
- [ ] Check CORS settings on backend
- [ ] Verify no sensitive data in client logs
- [ ] Confirm environment variables are secure
- [ ] Review Firebase Security Rules

### Documentation

- [ ] Document backend URL for team
- [ ] Save deployment credentials securely
- [ ] Update project README if needed
- [ ] Note any custom configuration

### Billing Alerts

- [ ] Set up Firebase billing alerts
- [ ] Set up OpenAI usage alerts
- [ ] Monitor backend hosting costs
- [ ] Check Pinecone usage limits

---

## Phase 8: Optional Enhancements ✅

### Custom Domain (Optional)

- [ ] Purchase domain
- [ ] Configure in Firebase Hosting
- [ ] Update DNS records
- [ ] SSL certificate auto-provisions
- [ ] Update frontend links

### Authentication (Optional)

- [ ] Enable Firebase Authentication
- [ ] Add login/signup UI
- [ ] Protect backend routes
- [ ] Update Storage rules

### Analytics (Optional)

- [ ] Enable Google Analytics in Firebase
- [ ] Add tracking code to frontend
- [ ] Set up conversion goals
- [ ] Monitor user behavior

### Performance Optimization

- [ ] Enable Firebase Performance Monitoring
- [ ] Optimize images/assets
- [ ] Enable compression on backend
- [ ] Add caching headers

---

## 🆘 Troubleshooting Guide

### Issue: Frontend can't connect to backend

**Checks:**

- [ ] Backend is running (check platform dashboard)
- [ ] Backend URL in `.env.production` is correct
- [ ] Frontend was redeployed after config change
- [ ] CORS settings allow frontend domain
- [ ] Backend health endpoint responds

### Issue: Firebase Storage errors

**Checks:**

- [ ] Storage rules deployed: `firebase deploy --only storage`
- [ ] Service account JSON uploaded correctly
- [ ] Environment variables set properly
- [ ] Bucket name is correct
- [ ] Check Firebase Console logs

### Issue: OpenAI errors

**Checks:**

- [ ] API key is valid
- [ ] Account has credits/billing enabled
- [ ] Environment variable set correctly
- [ ] Check OpenAI usage dashboard
- [ ] Review error messages in logs

### Issue: Build failures

**Fixes:**

```powershell
# Frontend
cd frontend
Remove-Item -Recurse -Force node_modules, dist
npm install
npm run build

# Backend
cd backend
Remove-Item -Recurse -Force node_modules
npm install
```

---

## ✅ Deployment Success Criteria

All of these should be true:

- [ ] Frontend loads at https://try1-7d848.web.app
- [ ] Backend responds to health checks
- [ ] Can upload documents successfully
- [ ] AI processing generates summaries
- [ ] Documents appear in history
- [ ] AI chat answers questions
- [ ] No errors in browser console
- [ ] No errors in backend logs
- [ ] All navigation works
- [ ] Tested on multiple browsers

---

## 🎉 You're Done!

### URLs to Remember:

- **Frontend:** https://try1-7d848.web.app
- **Backend:** https://your-backend-url.com
- **Firebase Console:** https://console.firebase.google.com/project/try1-7d848

### Important Commands:

```powershell
# Deploy frontend
.\deploy.ps1

# Start local dev
.\start-dev.ps1

# View guides
Get-Content QUICKSTART_DEPLOY.md
Get-Content DEPLOYMENT_GUIDE.md
```

### Next Steps:

1. Share URL with users
2. Monitor usage and errors
3. Collect feedback
4. Plan improvements

**Congratulations on deploying TeachAI! 🚀**
