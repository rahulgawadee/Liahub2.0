# 🚀 LiaHub Deployment - Start Here!

## 📚 Documentation Files Created

I've created comprehensive deployment guides for you:

1. **[GIT_SETUP.md](./GIT_SETUP.md)** - Push your code to GitHub (do this first!)
2. **[DEPLOYMENT_QUICK_REFERENCE.md](./DEPLOYMENT_QUICK_REFERENCE.md)** - Quick copy-paste reference
3. **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Complete step-by-step guide with troubleshooting

## ⚡ Quick Start (3 Simple Steps)

### Step 1: Push to GitHub
```powershell
cd "c:\Users\Rahul Gawade\OneDrive\Desktop\Ultranous AI Internship\2026\New liahub\LiaHub"
git add .
git commit -m "Prepare for deployment"
git remote add origin https://github.com/YOUR-USERNAME/liahub.git
git push -u origin main
```
📖 **Detailed instructions**: See [GIT_SETUP.md](./GIT_SETUP.md)

---

### Step 2: Deploy Backend to Render
1. Go to https://render.com/dashboard
2. Click **New +** → **Web Service**
3. Connect your GitHub repo
4. Settings:
   - Root Directory: `Backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Add environment variables (copy from [DEPLOYMENT_QUICK_REFERENCE.md](./DEPLOYMENT_QUICK_REFERENCE.md))
6. Click **Create Web Service**
7. **Copy your Render URL**: `https://your-backend.onrender.com`

---

### Step 3: Deploy Frontend to Vercel
1. Go to https://vercel.com/new
2. Import your GitHub repo
3. Settings should auto-detect (Vite framework)
4. Add environment variable:
   ```
   VITE_API_URL=https://your-backend.onrender.com
   ```
   *(Use the URL from Step 2)*
5. Click **Deploy**
6. **Update Render**: Go back to Render → Environment → Update:
   ```
   FRONTEND_ORIGIN=https://your-app.vercel.app
   ```

---

## ✅ Files Updated for Deployment

I've prepared your codebase for deployment by creating/updating:

- ✅ `.env.production` - Production environment variables template
- ✅ `Backend/.gitignore` - Prevent committing sensitive files
- ✅ `.gitignore` - Updated to exclude uploads and environment files
- ✅ `src/lib/apiClient.js` - Now uses VITE_API_URL environment variable
- ✅ `src/lib/socketClient.js` - Now uses VITE_API_URL for WebSocket connection
- ✅ `Backend/uploads/*/.gitkeep` - Preserve folder structure in git

## 🔐 Security Checklist

Before deploying to production:

- [ ] Generate secure JWT secrets (see [DEPLOYMENT_QUICK_REFERENCE.md](./DEPLOYMENT_QUICK_REFERENCE.md))
- [ ] Update `JWT_ACCESS_SECRET` in Render
- [ ] Update `JWT_REFRESH_SECRET` in Render
- [ ] Verify `.env` files are NOT in git: `git status` should not show `.env`
- [ ] Set `FRONTEND_ORIGIN` to your exact Vercel URL (no trailing slash)

## 🎯 What You Need

- GitHub account
- Render account (free tier: https://render.com)
- Vercel account (free tier: https://vercel.com)
- Your MongoDB Atlas URL (already in Backend/.env)

## 📱 After Deployment

Your live app URLs will be:
- **Frontend**: `https://your-app-name.vercel.app`
- **Backend**: `https://your-backend-name.onrender.com`

## 🆘 Need Help?

Common issues and solutions in [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) under "Troubleshooting" section.

## 🎉 Let's Deploy!

1. Start with **[GIT_SETUP.md](./GIT_SETUP.md)** to push to GitHub
2. Use **[DEPLOYMENT_QUICK_REFERENCE.md](./DEPLOYMENT_QUICK_REFERENCE.md)** for quick copy-paste
3. Follow **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** for detailed explanations

**Good luck! Your app will be live in about 15-20 minutes! 🚀**
