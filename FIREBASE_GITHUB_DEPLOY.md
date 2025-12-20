# 🚀 Firebase GitHub Deployment Configuration

## Firebase Hosting Settings (GitHub Integration)

Use these settings when configuring Firebase Hosting with your GitHub repository:

### Deployment Configuration

| Setting                | Value                                         |
| ---------------------- | --------------------------------------------- |
| **Repository**         | Your GitHub repo (webaii)                     |
| **Live Branch**        | `main`                                        |
| **App Root Directory** | `TeachAI/TeachAI-`                            |
| **Build Command**      | `cd frontend && npm install && npm run build` |
| **Output Directory**   | `frontend/dist`                               |

### How It Works

1. **Automatic Deployment**: Every push to `main` branch triggers automatic deployment
2. **Build Process**:
   - Firebase navigates to `TeachAI/TeachAI-`
   - Runs build command to compile your frontend
   - Deploys the `frontend/dist` folder to Firebase Hosting
3. **Live URL**: https://try1-7d848.web.app

### Manual Push & Deploy

After making changes:

```powershell
# 1. Stage your changes
git add .

# 2. Commit with message
git commit -m "Update TeachAI app"

# 3. Push to main branch
git push origin main
```

Firebase will automatically build and deploy! ✨

### Environment Variables

Before deploying, make sure to configure these in Firebase Console:

- Go to: Firebase Console → Hosting → GitHub Connection → Secrets
- Add your production environment variables from `.env.production`

### Project Structure

```
webaii/                          ← Repository root
└── TeachAI/
    └── TeachAI-/               ← App root directory
        ├── firebase.json       ← Firebase config
        ├── .firebaserc         ← Project config
        └── frontend/
            ├── package.json    ← Build dependencies
            ├── vite.config.js  ← Build config
            └── dist/           ← Build output (auto-generated)
```

### Troubleshooting

**Build fails?**

- Check that Node.js version is compatible (v16 or higher)
- Verify all dependencies are in `package.json`

**Wrong files deployed?**

- Verify "Output Directory" is `frontend/dist`
- Check `firebase.json` → `public: "frontend/dist"`

**Environment variables missing?**

- Add secrets in Firebase Console
- Prefix with `VITE_` for Vite to include them

---

## ✅ Quick Checklist

- [ ] GitHub repo connected to Firebase
- [ ] Live branch set to `main`
- [ ] App root: `TeachAI/TeachAI-`
- [ ] Build command: `cd frontend && npm install && npm run build`
- [ ] Output directory: `frontend/dist`
- [ ] Environment variables configured
- [ ] Push to main branch to trigger deployment

🎉 Your app is now set up for automatic deployments!
