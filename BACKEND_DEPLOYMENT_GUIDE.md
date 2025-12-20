# 🚀 Backend Deployment Guide - Firebase App Hosting

## ✅ Configuration Complete!

Your backend is ready to deploy with Firebase App Hosting (Cloud Run).

### Files Created/Updated:

- ✅ `apphosting.yaml` - Backend deployment configuration
- ✅ `backend/Dockerfile` - Updated for Cloud Run (PORT=8080)
- ✅ `backend/server.js` - Dynamic port support
- ✅ `.env` - OpenAI API key configured

---

## 📋 Deploy Backend via Firebase Console

### Step 1: Go to Firebase Console

https://console.firebase.google.com/project/try1-7d848/apphosting

### Step 2: Create New Backend

1. Click **"Create Backend"** or **"Add Backend"**
2. Choose **"Connect to GitHub repository"**
3. Select repository: **`mhtd10801992/TeachAI-`**
4. Branch: **`main`**
5. Root directory: **`.`** (leave blank or enter dot)

### Step 3: Configure Build

- **Build method:** Dockerfile
- **Dockerfile path:** `backend/Dockerfile`
- **Build context:** `backend`

### Step 4: Set Environment Variables (IMPORTANT!)

Click "Add Secret" and add:

| Secret Name      | Value                                    |
| ---------------- | ---------------------------------------- |
| `openai-api-key` | Your OpenAI API key (already configured) |

The following variables are auto-configured in `apphosting.yaml`:

- ✅ FIREBASE_PROJECT_ID
- ✅ FIREBASE_STORAGE_BUCKET
- ✅ FIREBASE_DATABASE_URL
- ✅ NODE_ENV=production

### Step 5: Review & Deploy

- Service name: `teachai-api` (or your choice)
- Region: Choose closest to your users (e.g., `us-central1`)
- Click **"Deploy"**

---

## 🔗 After Deployment

Once deployed, you'll get a backend URL like:

```
https://teachai-api-<random-id>.run.app
```

### Update Frontend to Use Deployed Backend:

1. Edit `frontend/src/api/api.js`
2. Update the API URL:

   ```javascript
   const API_URL = "https://teachai-api-<your-id>.run.app";
   ```

3. Rebuild and redeploy frontend:
   ```powershell
   cd frontend
   npm run build
   cd ..
   firebase deploy --only hosting
   ```

---

## ✨ Alternative: Deploy Backend via CLI

```powershell
# Make sure you're logged in
firebase login

# Deploy backend
firebase apphosting:backends:create teachai-api \\
  --location=us-central1 \\
  --repo=mhtd10801992/TeachAI- \\
  --branch=main \\
  --root-directory=.
```

---

## 🎯 Summary

**Current Status:**

- ✅ Frontend: https://try1-7d848.web.app (deployed, needs backend URL update)
- ⏳ Backend: Ready to deploy to Firebase App Hosting

**Next Steps:**

1. Deploy backend via Firebase Console (5 minutes)
2. Get backend URL from deployment
3. Update frontend with backend URL
4. Redeploy frontend

🚀 Your full-stack app will be live!
