# 🚀 DEPLOYMENT GUIDE - GITHUB & VERCEL

## STEP 1: CREATE GITHUB REPOSITORY ✅ (COMPLETED)
Your local Git is ready with your first commit!

---

## STEP 2: CREATE GITHUB REPOSITORY (Online)

### Do This Now:
1. Go to: https://github.com/new
2. Fill in:
   - **Repository name**: `closed-loop-intervention-system`
   - **Description**: "Real-time student intervention system with automated mentorship"
   - **Visibility**: Public
   - **Don't initialize** with README (you already have one)
3. Click **"Create repository"**

### You'll see:
```
Quick setup — if you've done this kind of thing before
```

Copy the **HTTPS URL** that appears (looks like: `https://github.com/YOUR_USERNAME/closed-loop-intervention-system.git`)

---

## STEP 3: PUSH TO GITHUB

Run this in PowerShell in your project folder:

```powershell
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/closed-loop-intervention-system.git
git push -u origin main
```

**Replace `YOUR_USERNAME` with your actual GitHub username!**

**Expected output:**
```
Enumerating objects: ...
Counting objects: 100%
Writing objects: 100%
Compressing objects: 100%
...
To https://github.com/YOUR_USERNAME/closed-loop-intervention-system.git
 * [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

✅ Your code is now on GitHub!

---

## STEP 4: DEPLOY FRONTEND TO VERCEL

### 4.1 Go to Vercel
- Visit: https://vercel.com
- Click **"Sign up"** (or Sign in if you have account)
- Choose **"Continue with GitHub"**
- Authorize Vercel

### 4.2 Import Your Repository
1. Click **"New Project"** (or **"Add New"** → **"Project"**)
2. Select **"Import Git Repository"**
3. Paste your GitHub URL: `https://github.com/YOUR_USERNAME/closed-loop-intervention-system.git`
4. Click **"Import"**

### 4.3 Configure Frontend
1. **Framework**: Select **"Vite"** (Vercel auto-detects, confirm it's Vite)
2. **Root Directory**: Select **"./frontend"** from dropdown
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`

### 4.4 Add Environment Variables
Before clicking Deploy, add these:

| Key | Value |
|---|---|
| `VITE_API_URL` | `https://your-railway-url.railway.app/api` |
| `VITE_SOCKET_URL` | `https://your-railway-url.railway.app` |

**Note**: You'll get Railway URL after deploying backend. Come back and update this!

For now, you can use:
- `VITE_API_URL` = `http://localhost:5000/api` (for testing)
- `VITE_SOCKET_URL` = `http://localhost:5000` (for testing)

Update after Railway deployment.

### 4.5 Deploy
Click **"Deploy"** 🚀

**Wait 2-3 minutes...**

You'll get a URL like: `https://closed-loop-intervention-system.vercel.app`

✅ Frontend is live!

---

## STEP 5: DEPLOY BACKEND TO RAILWAY

### 5.1 Go to Railway
- Visit: https://railway.app
- Click **"Start New Project"**
- Select **"Deploy from GitHub repo"**
- Authorize Railway

### 5.2 Select Your Repository
1. Find and select: `closed-loop-intervention-system`
2. Click **"Deploy Now"**

### 5.3 Configure Backend
Railway auto-detects it's Node.js. Configure:

1. **Build Command**: `npm install`
2. **Start Command**: `node backend/server.js`

### 5.4 Add Environment Variables
In Railway Dashboard → Variables → Add:

| Key | Value |
|---|---|
| `DATABASE_URL` | `postgresql://user:pass@host/dbname` |
| `PORT` | `5000` |
| `FRONTEND_URL` | `https://your-vercel-url.vercel.app` |
| `N8N_WEBHOOK_URL` | `https://your-n8n-url/webhook/intervention` |
| `NODE_ENV` | `production` |

**Where to get DATABASE_URL**: See Step 6 below

### 5.5 Deploy
Railway auto-deploys. Wait 2-3 minutes.

Get your URL: Railway Dashboard → Your Project → "View Logs" shows deployment URL

URL looks like: `https://your-project-xxxx.railway.app`

✅ Backend is live!

---

## STEP 6: SETUP DATABASE (SUPABASE)

### 6.1 Create Supabase Project
1. Go to: https://supabase.com
2. Sign in with GitHub
3. Click **"New Project"**
4. Fill in:
   - **Name**: `closed-loop-db`
   - **Database Password**: Create strong password (save it!)
   - **Region**: Choose closest to you
5. Click **"Create new project"**

**Wait 2-3 minutes for setup...**

### 6.2 Get Connection String
1. Click **"Settings"** (bottom left)
2. Click **"Database"**
3. Under "Connection String" → Copy **"Connection Pooler"** (not regular connection)
4. It looks like:
```
postgresql://postgres.xxxx:password@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```

**Use this value for DATABASE_URL** in Railway!

### 6.3 Create Database Tables
1. In Supabase, click **"SQL Editor"** (left menu)
2. Click **"New Query"**
3. Open file: `backend/migrations/001_create_tables.sql`
4. Copy ALL the SQL code
5. Paste into Supabase SQL editor
6. Click **"Run"** (execute the query)

✅ Database tables created!

---

## STEP 7: SETUP n8n AUTOMATION

### 7.1 Go to n8n Cloud
- Visit: https://n8n.cloud
- Sign up with email or GitHub
- Click **"New Workflow"**

### 7.2 Import Workflow
1. Click **"File"** → **"Open from File"**
2. Select: `n8n-workflows/mentor-dispatcher.json`
3. Click **"Import"**

### 7.3 Configure Nodes
In the workflow editor:

1. **Webhook Node** (first node):
   - Copy the **Webhook URL** at the top
   - Save it for later (use in Railway N8N_WEBHOOK_URL)

2. **Email Node** (adjust for your email service):
   - Configure your email provider (Gmail, SendGrid, etc.)
   - Test sending

3. **Slack Node** (optional):
   - Add your Slack workspace
   - Choose channel

4. **HTTP Callback Node**:
   - URL: `https://your-railway-url/api/interventions/:id/callback`

### 7.4 Activate Workflow
Click **"Activate"** (toggle to ON)

✅ n8n workflow is live!

---

## STEP 8: UPDATE ENVIRONMENT VARIABLES

Go back and update:

### Vercel
Update these with actual values:
- `VITE_API_URL` = `https://your-railway-url.railway.app/api`
- `VITE_SOCKET_URL` = `https://your-railway-url.railway.app`

Redeploy: Click **"Redeploy"** in Vercel

### Railway
Update these:
- `DATABASE_URL` = Your Supabase connection string
- `FRONTEND_URL` = Your Vercel URL
- `N8N_WEBHOOK_URL` = Your n8n webhook URL

Redeploy: Railway auto-redeploys

---

## STEP 9: TEST YOUR SYSTEM

### 9.1 Test Frontend
Visit: `https://your-vercel-url.vercel.app`

You should see:
- ✅ Timer with quiz
- ✅ Focus tracking
- ✅ Submit button

### 9.2 Test Backend
Visit: `https://your-railway-url.railway.app/health`

You should see:
```json
{"status":"OK","timestamp":"2025-11-24T..."}
```

### 9.3 Test Full Flow
1. Go to your Vercel URL with parameter:
   `?student_id=550e8400-e29b-41d4-a716-446655440000`

2. Submit a poor quiz (score < 5)

3. Check:
   - ✅ Frontend shows "Locked" state
   - ✅ n8n workflow triggers
   - ✅ Mentor gets email notification

---

## ✅ DEPLOYMENT COMPLETE!

### What You Have Now
```
✅ GitHub Repository: code backed up
✅ Frontend: Live on Vercel
✅ Backend: Live on Railway
✅ Database: Set up on Supabase
✅ Automation: Running on n8n Cloud
✅ Real-time: WebSocket working
✅ Fail-safe: 12-hour timeout active
```

### Your System URLs
- **Frontend**: https://your-vercel-url.vercel.app
- **Backend API**: https://your-railway-url.railway.app/api
- **Dashboard**: https://n8n.cloud (your workflow)

### Cost
- **Vercel**: Free
- **Railway**: Free (free tier)
- **Supabase**: Free (free tier)
- **n8n Cloud**: Free (free tier)

**Total: $0/month** 🎉

---

## 🆘 TROUBLESHOOTING

### Frontend shows "Cannot connect to API"
- Check `VITE_API_URL` in Vercel matches Railway URL
- Redeploy Vercel after updating
- Check Railway is still running

### Backend won't start
- Check `DATABASE_URL` is correct
- Verify Supabase database is running
- Check environment variables in Railway

### WebSocket won't connect
- Check `VITE_SOCKET_URL` matches backend URL
- Check CORS is enabled (it is by default)
- Vercel frontend and Railway backend must be HTTPS

### n8n workflow not triggering
- Verify `N8N_WEBHOOK_URL` in Railway matches n8n webhook URL
- Test webhook in n8n (click "Test webhook")
- Check Railway logs for errors

---

## 📞 NEXT STEPS

1. ✅ Push to GitHub (you did this!)
2. Deploy Frontend to Vercel
3. Deploy Backend to Railway
4. Setup Database on Supabase
5. Setup Automation on n8n
6. Update environment variables
7. Test everything
8. Done! 🚀

Ready? Start with **STEP 2: Create GitHub Repository** above!

