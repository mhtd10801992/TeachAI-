# Firebase Admin Setup Guide

## 📥 How to Get Your Service Account Key

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your project**: `try1-7d848`
3. **Navigate to Project Settings**:
   - Click the gear icon ⚙️ next to "Project Overview"
   - Select "Project settings"
4. **Go to Service Accounts tab**
5. **Generate new private key**:
   - Click "Generate new private key"
   - Confirm by clicking "Generate key"
6. **Download the JSON file**
7. **Replace the content** of `backend/config/firebase-admin-key.json` with the downloaded file

## ⚠️ Important Security Notes

- **NEVER commit** this file to git (already in .gitignore)
- The file contains sensitive credentials
- Keep it secure and private

## ✅ What's Already Configured

Your Firebase project details:

- **Project ID**: `try1-7d848`
- **Database URL**: `https://try1-7d848-default-rtdb.firebaseio.com`
- **Storage Bucket**: `try1-7d848.firebasestorage.app`

## 🔄 After Adding the Key

Restart your backend server:

```bash
cd backend
npm start
```

You should see:

```
✅ Firebase Admin initialized with service account
✅ Firebase Storage bucket initialized
```
