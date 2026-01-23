# ✅ Deployment Checklist

Use this checklist to track your deployment progress. Check off each item as you complete it!

---

## 📦 Pre-Deployment Preparation

- [ ] Read [DEPLOYMENT_START_HERE.md](./DEPLOYMENT_START_HERE.md)
- [ ] Read [DEPLOYMENT_WORKFLOW.md](./DEPLOYMENT_WORKFLOW.md) to understand the flow
- [ ] Create GitHub account (if you don't have one)
- [ ] Create Render account at https://render.com
- [ ] Create Vercel account at https://vercel.com
- [ ] Generate secure JWT secrets (run command from DEPLOYMENT_QUICK_REFERENCE.md)

---

## 🐙 Git & GitHub Setup

- [ ] Navigate to LiaHub folder in terminal
- [ ] Run `git status` to check current state
- [ ] Review `.gitignore` to ensure sensitive files are excluded
- [ ] Run `git add .`
- [ ] Run `git commit -m "Prepare for deployment"`
- [ ] Create new GitHub repository (name: liahub)
- [ ] Copy your GitHub repo URL
- [ ] Run `git remote add origin https://github.com/YOUR-USERNAME/liahub.git`
- [ ] Run `git push -u origin main`
- [ ] Verify code is on GitHub by visiting the repository URL
- [ ] Check that `.env` files are NOT visible on GitHub

---

## 🔧 Render Backend Deployment

### Create Web Service
- [ ] Go to https://dashboard.render.com
- [ ] Click "New +" → "Web Service"
- [ ] Click "Connect a repository" and authorize GitHub
- [ ] Select your liahub repository
- [ ] Fill in settings:
  - [ ] Name: `liahub-backend`
  - [ ] Region: Choose closest to you
  - [ ] Branch: `main`
  - [ ] Root Directory: `Backend`
  - [ ] Runtime: `Node`
  - [ ] Build Command: `npm install`
  - [ ] Start Command: `npm start`
  - [ ] Instance Type: `Free`

### Add Environment Variables
- [ ] Click "Advanced" → "Add Environment Variable"
- [ ] Add `NODE_ENV=production`
- [ ] Add `PORT=10000`
- [ ] Add `MONGODB_URI=` (copy from Backend/.env)
- [ ] Add `JWT_ACCESS_SECRET=` (use generated secure secret)
- [ ] Add `JWT_REFRESH_SECRET=` (use different generated secret)
- [ ] Add `EMAIL_USER=` (copy from Backend/.env)
- [ ] Add `EMAIL_PASS=` (copy from Backend/.env)
- [ ] Add `MAIL_FROM=` (copy from Backend/.env)
- [ ] Add `MAIL_MOCK=false`
- [ ] Add `MONGO_TRANSACTIONS=false`
- [ ] Add `ALLOW_CREDENTIALS=true`
- [ ] Add `FRONTEND_ORIGIN=https://placeholder.com` (will update later)

### Deploy & Verify
- [ ] Click "Create Web Service"
- [ ] Wait for deployment to complete (5-10 minutes)
- [ ] Check deployment logs for errors
- [ ] Copy your Render URL: `https://____________.onrender.com`
- [ ] Save this URL - you'll need it for Vercel!
- [ ] Test backend by visiting: `https://your-backend.onrender.com/api/v1/`

---

## ⚡ Vercel Frontend Deployment

### Create Project
- [ ] Go to https://vercel.com/new
- [ ] Click "Import Git Repository"
- [ ] Select your liahub repository
- [ ] Configure project settings:
  - [ ] Framework Preset: `Vite` (should auto-detect)
  - [ ] Root Directory: `./` (leave empty)
  - [ ] Build Command: `npm run build` (should auto-detect)
  - [ ] Output Directory: `dist` (should auto-detect)
  - [ ] Install Command: `npm install` (should auto-detect)

### Add Environment Variables
- [ ] Click "Environment Variables"
- [ ] Add variable name: `VITE_API_URL`
- [ ] Add value: `https://your-backend-url.onrender.com` (use URL from Render)
- [ ] Select: Production, Preview, AND Development
- [ ] Click "Add"

### Deploy & Verify
- [ ] Click "Deploy"
- [ ] Wait for deployment to complete (3-5 minutes)
- [ ] Check build logs for errors
- [ ] Copy your Vercel URL: `https://____________.vercel.app`
- [ ] Visit your Vercel URL in browser
- [ ] Open DevTools Console (F12) and check for errors

---

## 🔄 Update Backend CORS

- [ ] Go back to Render Dashboard
- [ ] Select your liahub-backend service
- [ ] Click "Environment" in left sidebar
- [ ] Find `FRONTEND_ORIGIN` variable
- [ ] Update value to your Vercel URL: `https://your-app.vercel.app`
- [ ] Click "Save Changes"
- [ ] Wait for automatic redeploy (~2-3 minutes)

---

## 🧪 Testing Your Deployed App

### Basic Functionality
- [ ] Visit your Vercel URL
- [ ] Check browser console - no CORS errors
- [ ] Check browser console - WebSocket connected
- [ ] Try to register a new account
- [ ] Verify registration email received
- [ ] Try to login with new account
- [ ] Login successful and redirected

### API Calls
- [ ] Network tab shows API calls to Render URL
- [ ] No "ERR_CONNECTION_REFUSED" errors
- [ ] API responses are successful (200, 201 status codes)

### WebSocket
- [ ] WebSocket connection shows in Network tab
- [ ] Connection status: "101 Switching Protocols"
- [ ] Real-time features work (notifications, messages)

### Dashboard Features
- [ ] Can view dashboard
- [ ] Can view students/teachers/managers tables
- [ ] Can edit education manager (if you have permission)
- [ ] Can create/view posts
- [ ] Can upload images

### File Uploads
- [ ] Profile picture upload works
- [ ] Post image upload works
- [ ] Document upload works

---

## 🐛 Troubleshooting

If you encounter issues, check these:

### CORS Error
- [ ] `FRONTEND_ORIGIN` in Render exactly matches Vercel URL (no trailing slash)
- [ ] `ALLOW_CREDENTIALS=true` is set in Render
- [ ] Backend redeployed after updating `FRONTEND_ORIGIN`

### Network Error / Connection Refused
- [ ] `VITE_API_URL` in Vercel is correct
- [ ] `VITE_API_URL` includes `https://` (not `http://`)
- [ ] `VITE_API_URL` has no trailing slash
- [ ] Frontend redeployed after adding environment variable

### WebSocket Connection Failed
- [ ] Backend is running (check Render dashboard)
- [ ] `VITE_API_URL` is set correctly in Vercel
- [ ] WebSocket connections not blocked by firewall

### 500 Internal Server Error
- [ ] Check Render logs for errors
- [ ] Verify all environment variables are set correctly
- [ ] Check MongoDB connection (MONGODB_URI correct)

### Slow Backend Response
- [ ] Normal for Render free tier (spins down after inactivity)
- [ ] First request takes 30-60 seconds to wake up
- [ ] Subsequent requests are fast
- [ ] Consider upgrading to paid tier if unacceptable

---

## 🎉 Success Criteria

Your deployment is successful when:

- [ ] ✅ Frontend loads at Vercel URL without errors
- [ ] ✅ Backend responds at Render URL
- [ ] ✅ Database connection working (can see data)
- [ ] ✅ Authentication flow working (register, login, logout)
- [ ] ✅ WebSocket connection established
- [ ] ✅ API calls successful (no CORS errors)
- [ ] ✅ File uploads working
- [ ] ✅ Real-time features working
- [ ] ✅ No errors in browser console
- [ ] ✅ No errors in Render logs

---

## 📝 Post-Deployment

- [ ] Update README.md with live URLs
- [ ] Share app URL with team/users
- [ ] Set up monitoring (optional)
- [ ] Set up custom domain (optional)
- [ ] Enable auto-deploy on push (already enabled by default)
- [ ] Document any custom configuration
- [ ] Create backup of MongoDB database
- [ ] Test on mobile devices
- [ ] Test on different browsers

---

## 🔐 Security Post-Deployment

- [ ] Verify `.env` files not in GitHub repository
- [ ] Confirm JWT secrets are strong and unique
- [ ] Check MongoDB Atlas network access settings
- [ ] Review Render/Vercel access permissions
- [ ] Enable 2FA on GitHub, Render, Vercel accounts
- [ ] Monitor for unusual activity

---

## 📊 Live App URLs

Write your URLs here for easy reference:

- **Frontend (Vercel)**: https://_______________________________.vercel.app
- **Backend (Render)**: https://_______________________________.onrender.com
- **GitHub Repo**: https://github.com/_____________/liahub
- **MongoDB Atlas**: (Already configured)

---

## 🎊 Congratulations!

If you've checked all the boxes, your app is successfully deployed! 🚀

**Share your live app**: https://your-app.vercel.app
