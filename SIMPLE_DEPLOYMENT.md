# 🚀 HOW TO DEPLOY - Simple Guide

**Your System**: Closed-Loop Intervention System  
**Frontend**: React + Vite  
**Backend**: Node.js + Express  
**Database**: PostgreSQL  
**Automation**: n8n

---

## 📋 Quick Deployment Map

```
FRONTEND → Vercel (FREE)
BACKEND → Railway or Heroku (FREE tier)
DATABASE → Supabase or Railway PostgreSQL (FREE)
AUTOMATION → n8n Cloud (FREE)
```

---

## 1️⃣ DEPLOY FRONTEND TO VERCEL

### Step 1: Push to GitHub

```bash
# Create GitHub repo (if not exists)
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/closed-loop-intervention.git
git push -u origin main
```

### Step 2: Deploy to Vercel

1. Go to https://vercel.com
2. Click **"Add New"** → **"Project"**
3. Select your GitHub repo
4. Configure:
   - **Framework**: React
   - **Root Directory**: `./frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add **Environment Variables**:
   ```
   VITE_API_URL = https://your-backend-url.com/api
   VITE_SOCKET_URL = https://your-backend-url.com
   ```
6. Click **"Deploy"**

**Wait 3-5 minutes → Live! 🎉**

**Your Frontend URL**: https://project-name.vercel.app

---

## 2️⃣ DEPLOY BACKEND TO RAILWAY

### Step 1: Create Supabase Database First

1. Go to https://supabase.com
2. Create new project (save password)
3. Go to **SQL Editor**
4. Create new query
5. Copy entire content from: `backend/migrations/001_create_tables.sql`
6. Run the SQL
7. Get connection string from **Settings** → **Database**
   ```
   postgresql://postgres:PASSWORD@db.xxx.supabase.co:5432/postgres
   ```

### Step 2: Deploy Backend to Railway

1. Go to https://railway.app
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your GitHub repo
4. Configure:
   - **Root Directory**: `./backend`
   - **Start Command**: `node server.js`
5. Click **"Deploy"**
6. Wait 2-3 minutes
7. Click **"Variables"** tab and add:
   ```
   DATABASE_URL = postgresql://postgres:PASSWORD@db.xxx.supabase.co:5432/postgres
   N8N_WEBHOOK_URL = https://n8n.cloud/webhook/xxx (from n8n setup)
   FRONTEND_URL = https://your-vercel-url.vercel.app
   PORT = 5000
   NODE_ENV = production
   ```
8. Save variables (auto-redeploy)

**Wait for green "Active" status → Live! 🎉**

**Your Backend URL**: https://project-name.railway.app

---

## 3️⃣ SETUP n8n AUTOMATION

### Step 1: Create n8n Account

1. Go to https://n8n.cloud
2. Sign up with email or GitHub
3. Create workspace

### Step 2: Import Workflow

1. Click **"Import"** on dashboard
2. Upload: `n8n-workflows/mentor-dispatcher.json`
3. Click **"Import"**

### Step 3: Configure Workflow

Update these nodes with your URLs:

**Node 2 (Fetch Student)**
```
URL: https://YOUR-RAILWAY-URL/api/student/{{ $json.body.student_id }}
Method: GET
```

**Node 5 (Assign Intervention)**
```
URL: https://YOUR-RAILWAY-URL/api/assign-intervention
Method: POST
```

### Step 4: Configure Email & Slack (Optional)

- **Email**: Connect Gmail/SendGrid
- **Slack**: Add your workspace webhook

### Step 5: Activate Workflow

1. Click **"Activate"** button
2. Copy webhook URL from **Webhook Trigger** node
   ```
   https://n8n.cloud/webhook/xxx
   ```
3. Add to Railway variables as `N8N_WEBHOOK_URL`

---

## 4️⃣ UPDATE BACKEND WITH PRODUCTION URLS

Once Frontend and n8n are deployed:

**Go to Railway Dashboard → Your Project → Variables**

Update these:
```
FRONTEND_URL = https://your-vercel-url.vercel.app
N8N_WEBHOOK_URL = https://n8n.cloud/webhook/xxx
DATABASE_URL = postgresql://postgres:PASSWORD@...
```

Save → Auto-redeploys ✅

---

## 5️⃣ TEST EVERYTHING

### Test Backend
```bash
curl https://YOUR-RAILWAY-URL/health

# Expected: {"status":"ok"}
```

### Test Frontend
```
Open: https://your-vercel-url.vercel.app?student_id=550e8400-e29b-41d4-a716-446655440000

Expected: You see the FocusMode UI with timer ✅
```

### Test API
```bash
curl -X POST https://YOUR-RAILWAY-URL/api/daily-checkin \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "550e8400-e29b-41d4-a716-446655440000",
    "quiz_score": 3,
    "focus_minutes": 20
  }'

# Expected: {"status":"locked","intervention_id":"xxx"}
```

---

## 🎯 DEPLOYMENT ORDER

```
1. Push to GitHub
2. Deploy Frontend to Vercel
3. Create Supabase Database
4. Deploy Backend to Railway
5. Setup n8n Cloud
6. Update all environment variables
7. Test everything
```

---

## 📊 Final URLs

After deployment, you'll have:

| Component | URL | Status |
|-----------|-----|--------|
| Frontend | https://your-vercel-url.vercel.app | ✅ Live |
| Backend API | https://your-railway-url.railway.app | ✅ Live |
| Database | Supabase Dashboard | ✅ Connected |
| Automation | n8n Cloud | ✅ Active |

---

## 🔄 ALTERNATIVES (If you prefer different platforms)

### Frontend Alternatives to Vercel
- **Netlify**: Similar to Vercel, also free
  1. Go to netlify.com
  2. Connect GitHub repo
  3. Build command: `npm run build` (in frontend/)
  4. Publish directory: `dist`

- **GitHub Pages**: Free, simple
  1. Build and push to `gh-pages` branch

### Backend Alternatives to Railway
- **Heroku**: Was popular, now paid (not free)
- **Render**: Similar to Railway
  1. Go to render.com
  2. Create new service
  3. Connect GitHub
  4. Set start command: `node server.js`
  5. Add environment variables
  
- **Replit**: Quick hosting
  1. Go to replit.com
  2. Import from GitHub
  3. Set run command: `cd backend && npm start`

### Database Alternatives to Supabase
- **Railway PostgreSQL**: Can host both backend + database
  1. Add PostgreSQL in Railway
  2. Get connection string
  3. Use as DATABASE_URL

- **Render PostgreSQL**: Similar to Railway

- **AWS RDS**: More complex but powerful

- **Azure Database**: Enterprise option

### Automation Alternatives to n8n
- **Zapier**: Visual workflow builder (paid)
- **Make** (formerly Integromat): Similar to n8n
- **n8n Self-Hosted**: Run on your own server

---

## 💡 RECOMMENDED STACK (Easiest)

```
✅ FRONTEND: Vercel (easiest)
✅ BACKEND: Railway (free PostgreSQL included option)
✅ DATABASE: Supabase (free, reliable)
✅ AUTOMATION: n8n Cloud (free)

Total Cost: $0 for first year 🎉
```

---

## 🚀 TL;DR - 5 Minutes to Deploy

```bash
# 1. Push code to GitHub
git push origin main

# 2. Go to Vercel → Deploy frontend from GitHub
# (Select ./frontend folder)

# 3. Go to Supabase → Create DB → Run SQL from migrations/
# Copy connection string

# 4. Go to Railway → Deploy backend from GitHub
# (Select ./backend folder)
# Add DATABASE_URL environment variable

# 5. Go to n8n Cloud → Import workflow
# Connect to your Railway backend URL

# Done! 🎉
```

---

## ⚠️ IMPORTANT NOTES

1. **Keep API URLs Updated**: When you get production URLs, update everywhere
2. **Environment Variables**: Never commit `.env` file to GitHub (it's in .gitignore)
3. **Database Password**: Use strong password, save it safely
4. **WebSocket**: Frontend must connect to same backend URL (Vercel to Railway)
5. **CORS**: Already configured in backend for production

---

## 🆘 QUICK FIXES

### Frontend shows "API Error"
→ Check `VITE_API_URL` in Vercel environment variables

### Backend won't start
→ Check `DATABASE_URL` has correct PostgreSQL connection string

### WebSocket won't connect
→ Check `VITE_SOCKET_URL` matches your backend URL

### n8n not triggering
→ Check `N8N_WEBHOOK_URL` is correct in Railway

---

## 📞 SUPPORT LINKS

- **Vercel Help**: https://vercel.com/docs
- **Railway Help**: https://railway.app/docs
- **Supabase Help**: https://supabase.com/docs
- **n8n Help**: https://docs.n8n.io

---

**Ready? Start with: Push to GitHub, then deploy to Vercel! 🚀**

