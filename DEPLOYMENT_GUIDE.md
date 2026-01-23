# LiaHub Deployment Guide

## 🚀 Deployment Architecture
- **Backend**: Render (Node.js Web Service)
- **Frontend**: Vercel (Static Site)
- **Database**: MongoDB Atlas (already configured)

---

## 📋 Prerequisites

1. **GitHub Account** (for both Render and Vercel)
2. **Render Account** (https://render.com)
3. **Vercel Account** (https://vercel.com)
4. **Git Repository** - Push your code to GitHub first

---

## STEP 1: Prepare Your Code for Deployment

### 1.1 Push to GitHub

```bash
# Navigate to project root
cd "c:\Users\Rahul Gawade\OneDrive\Desktop\Ultranous AI Internship\2026\New liahub\LiaHub"

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Prepare for deployment"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR-USERNAME/liahub.git
git branch -M main
git push -u origin main
```

### 1.2 Create `.gitignore` in Backend folder

Create `Backend/.gitignore`:
```
node_modules/
.env
uploads/
*.log
.DS_Store
```

### 1.3 Update Backend Environment Variables

The backend `.env` file should NOT be committed. You'll add these as environment variables in Render.

---

## STEP 2: Deploy Backend to Render 🔧

### 2.1 Create New Web Service

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Select the **LiaHub** repository

### 2.2 Configure Web Service

Fill in these settings:

| Setting | Value |
|---------|-------|
| **Name** | `liahub-backend` (or your preferred name) |
| **Region** | Choose closest to your users |
| **Branch** | `main` |
| **Root Directory** | `Backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` (or paid if needed) |

### 2.3 Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"** and add these:

```env
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://rahulgawade360_db_user:rahulgawadee@liahubtest.wv6su1v.mongodb.net/?appName=liahubtest
JWT_ACCESS_SECRET=your-super-secret-access-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
EMAIL_USER=rahulgawade360@gmail.com
EMAIL_PASS=nsok gpan utbm bfny
MAIL_FROM=rahulgawade360@gmail.com
MAIL_MOCK=false
MONGO_TRANSACTIONS=false
ALLOW_CREDENTIALS=true
```

**⚠️ IMPORTANT**: After Vercel deployment, come back and add:
```env
FRONTEND_ORIGIN=https://your-app.vercel.app
```

### 2.4 Deploy

1. Click **"Create Web Service"**
2. Wait for deployment to complete (5-10 minutes)
3. Note your backend URL: `https://liahub-backend.onrender.com` (or similar)

### 2.5 Test Backend

Visit: `https://your-backend-url.onrender.com/api/v1/health` (if you have a health endpoint)

---

## STEP 3: Deploy Frontend to Vercel ⚡

### 3.1 Update API Configuration

First, update the frontend to use environment variables for API URL:

Create `LiaHub/.env.production`:
```env
VITE_API_URL=https://your-backend-url.onrender.com
```

### 3.2 Update API Client

If not already done, ensure your API calls use the environment variable.

Check `src/lib/apiClient.js` or `src/config/api.js` - it should use:
```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
```

### 3.3 Update Socket Client

Check `src/lib/socketClient.js` and ensure it uses:
```javascript
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
```

### 3.4 Deploy to Vercel

#### Option A: Using Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Navigate to LiaHub folder
cd "c:\Users\Rahul Gawade\OneDrive\Desktop\Ultranous AI Internship\2026\New liahub\LiaHub"

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

#### Option B: Using Vercel Dashboard

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure project:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (or leave empty if repo root is LiaHub)
   - **Build Command**: `npm run build` (should auto-detect)
   - **Output Directory**: `dist` (should auto-detect)
   - **Install Command**: `npm install`

### 3.5 Add Environment Variables in Vercel

In Vercel Dashboard → Your Project → Settings → Environment Variables:

```env
VITE_API_URL=https://your-backend-url.onrender.com
```

Make sure to set for **Production**, **Preview**, and **Development**.

### 3.6 Redeploy

After adding environment variables:
1. Go to **Deployments** tab
2. Click on the latest deployment
3. Click **"Redeploy"**

---

## STEP 4: Update Backend CORS 🔐

Now that you have your Vercel URL, update Render environment variables:

1. Go to Render Dashboard → Your Web Service
2. Go to **Environment**
3. Update/Add:
   ```env
   FRONTEND_ORIGIN=https://your-app.vercel.app
   ```
4. Click **"Save Changes"**
5. Render will automatically redeploy

---

## STEP 5: Verify Deployment ✅

### 5.1 Test Backend
- Visit: `https://your-backend-url.onrender.com/api/v1/` 
- Should return API response (not 404)

### 5.2 Test Frontend
- Visit: `https://your-app.vercel.app`
- Open browser DevTools → Console
- Check for connection errors
- Try to login/register

### 5.3 Test WebSocket
- Check browser console for WebSocket connection
- Should connect to `wss://your-backend-url.onrender.com`

---

## 🐛 Troubleshooting

### Issue: CORS Errors

**Solution**: Ensure `FRONTEND_ORIGIN` in Render matches your exact Vercel URL (no trailing slash):
```env
FRONTEND_ORIGIN=https://your-app.vercel.app
```

### Issue: API calls fail with 404

**Solution**: Check that `VITE_API_URL` in Vercel includes full URL:
```env
VITE_API_URL=https://your-backend-url.onrender.com
```

### Issue: WebSocket connection fails

**Solution**: 
1. Ensure Render backend supports WebSocket (it does by default)
2. Check socket client uses `wss://` for production
3. Update socket client to use environment variable

### Issue: Environment variables not working

**Solution**:
- Vercel: Variables must start with `VITE_` to be exposed to client
- Render: Redeploy after adding/changing variables
- Clear cache and rebuild

### Issue: Render deployment slow/times out

**Solution**:
- Free tier on Render spins down after inactivity
- First request may take 30-60 seconds
- Consider upgrading to paid tier for always-on service

---

## 📝 Post-Deployment Checklist

- [ ] Backend deployed successfully on Render
- [ ] Frontend deployed successfully on Vercel
- [ ] Environment variables configured in both platforms
- [ ] CORS settings updated with Vercel URL
- [ ] API calls working from frontend
- [ ] WebSocket connection working
- [ ] Authentication flow working
- [ ] File uploads working
- [ ] Database operations working
- [ ] Email notifications working (if applicable)

---

## 🔒 Security Recommendations

1. **Change all secret keys** in production
2. **Use strong JWT secrets** (generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
3. **Enable HTTPS only** (both platforms do this by default)
4. **Restrict CORS** to only your Vercel domain
5. **Use environment variables** for all sensitive data
6. **Enable rate limiting** in backend (if not already)
7. **Review MongoDB Atlas** network access and security

---

## 📱 Custom Domains (Optional)

### For Vercel:
1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed

### For Render:
1. Go to Settings → Custom Domains
2. Add your custom domain
3. Update DNS records as instructed
4. **Update FRONTEND_ORIGIN** with new domain

---

## 🔄 Continuous Deployment

Both platforms support automatic deployments:

- **Vercel**: Auto-deploys on push to `main` branch
- **Render**: Auto-deploys on push to `main` branch

To disable: Check respective platform settings.

---

## 📊 Monitoring

### Render:
- View logs: Dashboard → Logs tab
- Monitor metrics: Dashboard → Metrics tab

### Vercel:
- View deployment logs: Dashboard → Deployments → Click deployment
- Monitor analytics: Dashboard → Analytics tab

---

## 💰 Cost Considerations

### Render Free Tier:
- ✅ 750 hours/month free
- ⚠️ Spins down after 15 min inactivity
- ⚠️ 512 MB RAM limit
- ⚠️ Shared CPU

### Vercel Free Tier:
- ✅ 100 GB bandwidth/month
- ✅ Unlimited deployments
- ✅ Always on

**Recommendation**: Start with free tiers, upgrade Render if you need always-on backend.

---

## 🎉 Your App is Live!

- **Frontend**: https://your-app.vercel.app
- **Backend**: https://your-backend-url.onrender.com
- **Database**: MongoDB Atlas (managed)

Share your app with users and enjoy! 🚀
