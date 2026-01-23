# Quick Deployment Reference

## 🚀 Render Environment Variables

Copy and paste these into Render Dashboard → Environment:

```
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://rahulgawade360_db_user:rahulgawadee@liahubtest.wv6su1v.mongodb.net/?appName=liahubtest
JWT_ACCESS_SECRET=CHANGE_THIS_TO_SECURE_RANDOM_STRING_32_CHARS_MIN
JWT_REFRESH_SECRET=CHANGE_THIS_TO_ANOTHER_SECURE_RANDOM_STRING
EMAIL_USER=rahulgawade360@gmail.com
EMAIL_PASS=nsok gpan utbm bfny
MAIL_FROM=rahulgawade360@gmail.com
MAIL_MOCK=false
MONGO_TRANSACTIONS=false
ALLOW_CREDENTIALS=true
FRONTEND_ORIGIN=https://your-app-name.vercel.app
```

**⚠️ IMPORTANT**: 
- Replace `your-app-name.vercel.app` with your actual Vercel URL after deployment
- Generate secure JWT secrets using: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

## ⚡ Vercel Environment Variables

Copy and paste these into Vercel Dashboard → Settings → Environment Variables:

```
VITE_API_URL=https://your-backend-name.onrender.com
```

**⚠️ IMPORTANT**: 
- Replace `your-backend-name.onrender.com` with your actual Render URL
- No trailing slash!
- Set for Production, Preview, AND Development environments

---

## 📋 Render Settings

| Setting | Value |
|---------|-------|
| Name | `liahub-backend` |
| Region | `Oregon (US West)` or closest to you |
| Branch | `main` |
| Root Directory | `Backend` |
| Runtime | `Node` |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Instance Type | `Free` |

---

## 📋 Vercel Settings

| Setting | Value |
|---------|-------|
| Framework Preset | `Vite` |
| Root Directory | `./` (leave empty) |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

---

## ✅ Post-Deployment Checklist

1. **Deploy Backend to Render**
   - [ ] Create Web Service
   - [ ] Configure settings above
   - [ ] Add environment variables (use placeholder for FRONTEND_ORIGIN initially)
   - [ ] Wait for deployment to complete
   - [ ] Copy your Render URL: `https://your-backend.onrender.com`

2. **Deploy Frontend to Vercel**
   - [ ] Import GitHub repository
   - [ ] Configure settings above
   - [ ] Add VITE_API_URL environment variable (using Render URL from step 1)
   - [ ] Deploy
   - [ ] Copy your Vercel URL: `https://your-app.vercel.app`

3. **Update Backend CORS**
   - [ ] Go back to Render Dashboard
   - [ ] Update FRONTEND_ORIGIN environment variable with your Vercel URL
   - [ ] Render will auto-redeploy

4. **Test Everything**
   - [ ] Visit your Vercel URL
   - [ ] Open DevTools Console - check for errors
   - [ ] Try to register/login
   - [ ] Check WebSocket connection
   - [ ] Test API calls (create post, upload file, etc.)

---

## 🐛 Common Issues

### "CORS Error"
→ Make sure FRONTEND_ORIGIN in Render exactly matches your Vercel URL (no trailing slash)

### "Network Error" or "Failed to fetch"
→ Make sure VITE_API_URL in Vercel includes full URL with https://

### "WebSocket connection failed"
→ Check that VITE_API_URL is set correctly and backend is running

### Backend is slow to respond (first request)
→ Render free tier "spins down" after inactivity. First request wakes it up (30-60 seconds)

---

## 🔐 Security - CHANGE THESE!

Generate secure JWT secrets:

```bash
# In terminal/PowerShell, run:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run this twice to get two different secrets for JWT_ACCESS_SECRET and JWT_REFRESH_SECRET.

Example output:
```
a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

Use these values in Render environment variables!

---

## 📱 Your Live URLs

After deployment, write down your URLs here:

- **Frontend (Vercel)**: `https://_____________________________.vercel.app`
- **Backend (Render)**: `https://_____________________________.onrender.com`
- **Database (MongoDB Atlas)**: Already configured ✓

---

## 🎉 Done!

Share your app: **https://your-app.vercel.app**
