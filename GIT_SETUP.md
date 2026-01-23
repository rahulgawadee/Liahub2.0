# Git Setup & Push to GitHub

## Step 1: Verify Git Status

```powershell
# Navigate to LiaHub folder
cd "c:\Users\Rahul Gawade\OneDrive\Desktop\Ultranous AI Internship\2026\New liahub\LiaHub"

# Check git status
git status
```

## Step 2: Update .gitignore

Make sure `.gitignore` exists in the root of LiaHub with these entries:

```
# Dependencies
node_modules/
Backend/node_modules/

# Environment variables
.env
.env.local
.env.production.local
Backend/.env

# Build outputs
dist/
build/

# Logs
*.log
npm-debug.log*
Backend/*.log

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Uploads (don't commit user uploads to git)
Backend/uploads/images/
Backend/uploads/posts/
Backend/uploads/contracts/
Backend/uploads/messages/
Backend/uploads/offers/
Backend/uploads/excel/

# Keep the upload folders structure but not the files
!Backend/uploads/.gitkeep
```

## Step 3: Create GitHub Repository

1. Go to https://github.com/new
2. Create a new repository:
   - Name: `liahub` (or your preferred name)
   - Description: "LiaHub - Professional networking platform for students and companies"
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
   - Click "Create repository"

## Step 4: Add Files to Git

```powershell
# Add all files
git add .

# Commit
git commit -m "Initial commit - Prepare for deployment"
```

## Step 5: Connect to GitHub

```powershell
# Add remote (replace YOUR-USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR-USERNAME/liahub.git

# Verify remote
git remote -v

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 6: Verify on GitHub

Visit `https://github.com/YOUR-USERNAME/liahub` and verify your code is there.

## Troubleshooting

### "fatal: remote origin already exists"

```powershell
# Remove existing remote
git remote remove origin

# Add the new one
git remote add origin https://github.com/YOUR-USERNAME/liahub.git
```

### "Support for password authentication was removed"

You need to use a Personal Access Token instead of password:

1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes: `repo` (all sub-items)
4. Generate and copy the token
5. When git asks for password, paste the token

**OR** use GitHub Desktop or GitHub CLI for easier authentication.

### Files are too large

```powershell
# Check for large files
git ls-files -z | xargs -0 du -h | sort -rh | head -20

# If you have large files in node_modules or uploads, they should be in .gitignore
# Remove them from git cache:
git rm -r --cached node_modules/
git rm -r --cached Backend/node_modules/
git rm -r --cached Backend/uploads/
git commit -m "Remove ignored files from git"
```

## Next Steps

After successfully pushing to GitHub:

1. ✅ Code is on GitHub
2. 🚀 Ready to deploy to Render (backend)
3. ⚡ Ready to deploy to Vercel (frontend)

Proceed to `DEPLOYMENT_QUICK_REFERENCE.md` for deployment steps!
