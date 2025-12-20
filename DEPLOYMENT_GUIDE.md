# 🚀 TeachAI Deployment Guide

This guide covers how to deploy the TeachAI application to production.

## 📋 Prerequisites

### 1. Firebase CLI Installation

```powershell
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login
```

### 2. Required Accounts

- ✅ Firebase account (already configured: try1-7d848)
- ✅ OpenAI API key (for AI processing)
- ✅ Pinecone account (for vector storage)

---

## 🌐 Frontend Deployment (Firebase Hosting)

### Automated Deployment

```powershell
# Run the deployment script
.\deploy.ps1
```

### Manual Deployment Steps

```powershell
# 1. Navigate to frontend
cd frontend

# 2. Install dependencies
npm install

# 3. Build production bundle
npm run build

# 4. Deploy to Firebase
cd ..
firebase deploy --only hosting
```

### Frontend Configuration

The frontend will be hosted at: `https://try1-7d848.web.app`

Update the API base URL in the frontend to point to your hosted backend:

**File:** `frontend/src/api/api.js`

```javascript
const API_BASE_URL = "https://your-backend-url.com/api";
```

---

## 🖥️ Backend Deployment Options

The backend is a Node.js Express server that needs to be deployed separately. Choose one option:

### Option 1: Google Cloud Run (Recommended)

```bash
# 1. Build Docker container
docker build -t gcr.io/try1-7d848/teachai-backend ./backend

# 2. Push to Google Container Registry
docker push gcr.io/try1-7d848/teachai-backend

# 3. Deploy to Cloud Run
gcloud run deploy teachai-backend \
  --image gcr.io/try1-7d848/teachai-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Option 2: Heroku

```bash
# 1. Login to Heroku
heroku login

# 2. Create app
heroku create teachai-backend

# 3. Set environment variables
heroku config:set OPENAI_API_KEY=your_key
heroku config:set PINECONE_API_KEY=your_key
# ... add all other env vars

# 4. Deploy
cd backend
git init
heroku git:remote -a teachai-backend
git add .
git commit -m "Deploy backend"
git push heroku main
```

### Option 3: Railway

1. Go to https://railway.app
2. Create new project
3. Connect your GitHub repository
4. Select the `backend` directory as root
5. Add environment variables
6. Deploy automatically

### Option 4: Render

1. Go to https://render.com
2. Create new Web Service
3. Connect repository
4. Set root directory to `backend`
5. Build command: `npm install`
6. Start command: `npm start`
7. Add environment variables
8. Deploy

---

## 🔐 Environment Variables Setup

### Backend Environment Variables

Create these on your hosting platform:

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-...

# Pinecone Configuration
PINECONE_API_KEY=...
PINECONE_ENVIRONMENT=...
PINECONE_INDEX_NAME=teachai-documents

# Firebase (use service account JSON)
FIREBASE_PROJECT_ID=try1-7d848
FIREBASE_STORAGE_BUCKET=try1-7d848.firebasestorage.app

# Server Configuration
PORT=5000
NODE_ENV=production
```

### Firebase Service Account

For backend deployment, upload `firebase-admin-key.json` securely:

- For Cloud Run: Use Secret Manager
- For Heroku: Use config vars (base64 encode the JSON)
- For Railway/Render: Use environment variables

---

## 🔄 Update Frontend API URL

After deploying backend, update the frontend configuration:

**File:** `frontend/src/api/api.js`

```javascript
// Change from localhost to your deployed backend URL
const API_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://your-backend-url.com/api"
    : "http://localhost:5000/api";
```

Then rebuild and redeploy frontend:

```powershell
cd frontend
npm run build
cd ..
firebase deploy --only hosting
```

---

## 📊 Deployment Checklist

### Before Deployment

- [ ] Backend environment variables configured
- [ ] Firebase service account JSON uploaded securely
- [ ] OpenAI API key active and has credits
- [ ] Pinecone index created and configured
- [ ] CORS settings updated for production domains
- [ ] Frontend API URL points to production backend

### After Deployment

- [ ] Test file upload functionality
- [ ] Test AI processing
- [ ] Test document retrieval
- [ ] Test AI chat/question answering
- [ ] Verify Firebase Storage is working
- [ ] Check logs for errors
- [ ] Test from different devices/browsers

---

## 🔍 Testing Deployment

### Frontend Test

```
https://try1-7d848.web.app
```

- Upload a test document
- Check if UI loads correctly
- Verify all routes work

### Backend Test

```bash
# Health check
curl https://your-backend-url.com/api/health

# Test endpoint
curl https://your-backend-url.com/api/test
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. CORS Errors

Update backend CORS configuration:

```javascript
app.use(
  cors({
    origin: [
      "https://try1-7d848.web.app",
      "https://try1-7d848.firebaseapp.com",
    ],
    credentials: true,
  })
);
```

#### 2. Firebase Storage Access Denied

- Check `storage.rules` are deployed
- Verify service account has correct permissions
- Ensure bucket name is correct

#### 3. Environment Variables Not Loading

- Check variable names match exactly
- Restart the backend service
- Verify they're set in the hosting platform

#### 4. Build Failures

```powershell
# Clear cache and rebuild
cd frontend
Remove-Item -Recurse -Force node_modules, dist
npm install
npm run build
```

---

## 💰 Cost Considerations

### Free Tier Limits

- **Firebase Hosting**: 10GB storage, 360MB/day bandwidth
- **Firebase Storage**: 5GB storage, 1GB/day download
- **OpenAI**: Pay-per-use (monitor usage)
- **Pinecone**: Free tier available

### Monitoring Costs

- Set up billing alerts in Firebase Console
- Monitor OpenAI API usage dashboard
- Track backend hosting costs

---

## 🔄 Continuous Deployment

### GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Firebase

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Setup Node
        uses: actions/setup-node@v2
        with:
          node-version: "18"

      - name: Install dependencies
        working-directory: ./frontend
        run: npm install

      - name: Build
        working-directory: ./frontend
        run: npm run build

      - name: Deploy to Firebase
        uses: w9jds/firebase-action@master
        with:
          args: deploy --only hosting
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
```

---

## 📞 Support

If you encounter issues:

1. Check Firebase Console logs
2. Review backend service logs
3. Test endpoints individually
4. Verify environment variables
5. Check CORS configuration

---

## 🎉 Success!

Once deployed:

- ✅ Frontend accessible at: `https://try1-7d848.web.app`
- ✅ Backend running on your chosen platform
- ✅ Users can upload and process documents
- ✅ AI features fully functional

**Next Steps:**

- Set up monitoring and alerts
- Configure custom domain (optional)
- Implement authentication (if needed)
- Add analytics tracking
