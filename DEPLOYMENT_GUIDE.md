# 🚀 DEPLOYMENT GUIDE - COMPLETE INSTRUCTIONS

**Closed-Loop Intervention System**  
**Last Updated**: November 24, 2025  
**Status**: Production-Ready

---

## 📋 Deployment Overview

This guide covers deploying your system from local development to production across 4 platforms:
- **Backend** → Railway
- **Frontend** → Vercel
- **Database** → Supabase (PostgreSQL)
- **Automation** → n8n Cloud

**Total Time**: ~2-3 hours

---

## 🎯 Deployment Path

```
Step 1: Prepare (30 min)
  ├─ Create accounts
  ├─ Get API keys
  └─ Prepare configuration

Step 2: Database (15 min)
  ├─ Set up Supabase
  ├─ Execute migrations
  └─ Verify connection

Step 3: Backend (30 min)
  ├─ Deploy to Railway
  ├─ Configure environment
  └─ Test API endpoints

Step 4: Frontend (30 min)
  ├─ Deploy to Vercel
  ├─ Configure environment
  └─ Test UI

Step 5: Automation (30 min)
  ├─ Set up n8n Cloud
  ├─ Import workflow
  └─ Configure integrations

Step 6: Integration (15 min)
  ├─ Connect systems
  ├─ End-to-end testing
  └─ Go live!

Total: ~2.5 hours ⏱️
```

---

## 🔑 Phase 1: Prepare (30 minutes)

### 1.1 Create Accounts

**Supabase Account** (Free PostgreSQL hosting)
- Go to https://supabase.com
- Click "Start your project"
- Sign up with email/GitHub
- Verify email
- Create new project
- **Note**: Project URL and password

**Railway Account** (Free backend hosting)
- Go to https://railway.app
- Sign up with GitHub
- Connect GitHub account
- **Note**: GitHub access token (if needed)

**Vercel Account** (Free frontend hosting)
- Go to https://vercel.com
- Sign up with GitHub
- Connect GitHub account
- **Ready to deploy**

**n8n Cloud Account** (Free automation)
- Go to https://n8n.cloud
- Sign up with email/GitHub
- Verify account
- Create new workspace
- **Note**: n8n API key

### 1.2 Gather Required Information

Create a `.deployment-config.txt` file with:

```
SUPABASE:
- Project URL: https://xxx.supabase.co
- Database Password: [your-password]
- Connection String: postgresql://postgres:[password]@db.xxx.supabase.co:5432/postgres

RAILWAY:
- GitHub Token: [if needed]
- Project Name: closed-loop-intervention-system

VERCEL:
- GitHub Connected: Yes/No
- Project Name: closed-loop-frontend

N8N CLOUD:
- API Key: [your-api-key]
- Cloud URL: https://n8n.cloud
- Webhook URL: [will get from Railway]
```

---

## 🗄️ Phase 2: Database Setup (15 minutes)

### 2.1 Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in:
   - **Name**: closed-loop-intervention
   - **Database Password**: [strong password - save this!]
   - **Region**: Choose closest to your users
4. Click "Create new project"
5. Wait 2-3 minutes for setup

### 2.2 Execute Database Schema

1. In Supabase dashboard, click "SQL Editor" (left sidebar)
2. Click "New query"
3. Copy entire content from `backend/migrations/001_create_tables.sql`
4. Paste into SQL editor
5. Click "Run" button
6. **Verify**: Should show "Success" message

### 2.3 Get Connection String

1. In Supabase dashboard, click "Project Settings" (gear icon)
2. Click "Database"
3. Under "Connection String", copy the URI:
   ```
   postgresql://postgres:[password]@db.xxx.supabase.co:5432/postgres
   ```
4. **Save this** - you'll need it for backend

### 2.4 Verify Connection (Optional)

Run this locally to test:
```bash
cd backend
npm install -g postgresql-client
psql "your_connection_string_here"
# Type \dt to see tables
# Type \q to exit
```

**Expected tables**: students, daily_logs, interventions, mentor_actions

---

## 🔙 Phase 3: Deploy Backend to Railway (30 minutes)

### 3.1 Prepare Backend Code

1. In your workspace, open `backend/.env.example`
2. Create `backend/.env` with:
   ```
   DATABASE_URL=postgresql://postgres:[password]@db.xxx.supabase.co:5432/postgres
   N8N_WEBHOOK_URL=https://n8n.example.com/webhook (temporary, update later)
   FRONTEND_URL=https://your-frontend-domain.vercel.app
   PORT=5000
   NODE_ENV=production
   ```

3. Verify `backend/server.js` exists and is entry point
4. Verify `backend/package.json` has correct start script:
   ```json
   "scripts": {
     "dev": "node server.js",
     "start": "node server.js"
   }
   ```

### 3.2 Deploy to Railway

**Option A: Using Railway Dashboard**

1. Go to https://railway.app/dashboard
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Select `backend` folder as root
5. Click "Deploy"
6. Wait 2-3 minutes
7. Copy the generated URL (e.g., `https://xxx.railway.app`)

**Option B: Using Railway CLI**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# In backend folder
cd backend
railway init
railway up

# Get URL
railway status
```

### 3.3 Configure Environment Variables

1. In Railway dashboard, click your project
2. Click "Variables" tab
3. Add these variables:
   ```
   DATABASE_URL = postgresql://postgres:[password]@db.xxx.supabase.co:5432/postgres
   N8N_WEBHOOK_URL = https://n8n.example.com/webhook (update after n8n setup)
   FRONTEND_URL = https://your-frontend.vercel.app
   PORT = 5000
   NODE_ENV = production
   ```
4. Click "Save"
5. Railway will auto-redeploy

### 3.4 Verify Backend Deployment

1. Get your Railway backend URL
2. Test health check:
   ```bash
   curl https://your-railway-url.com/health
   ```
   **Expected response**: `{"status":"ok"}`

3. Test API:
   ```bash
   curl -X POST https://your-railway-url.com/api/daily-checkin \
     -H "Content-Type: application/json" \
     -d '{
       "student_id": "550e8400-e29b-41d4-a716-446655440000",
       "quiz_score": 8,
       "focus_minutes": 60
     }'
   ```

✅ **Backend is live!**

---

## 🎨 Phase 4: Deploy Frontend to Vercel (30 minutes)

### 4.1 Prepare Frontend Code

1. Open `frontend/.env.example`
2. Create `frontend/.env.production` with:
   ```
   VITE_API_URL=https://your-railway-url.com/api
   VITE_SOCKET_URL=https://your-railway-url.com
   ```

3. Verify `frontend/vite.config.js` has:
   ```javascript
   export default defineConfig({
     plugins: [react()],
     build: {
       target: 'ES2020',
       outDir: 'dist'
     }
   })
   ```

4. Verify `frontend/package.json` has:
   ```json
   "scripts": {
     "dev": "vite",
     "build": "vite build",
     "preview": "vite preview"
   }
   ```

### 4.2 Deploy to Vercel

**Option A: Using Vercel Dashboard**

1. Go to https://vercel.com/dashboard
2. Click "Add New" → "Project"
3. Select your GitHub repository
4. Configure:
   - **Framework**: React
   - **Root Directory**: ./frontend
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add Environment Variables:
   - `VITE_API_URL` = your Railway backend URL
   - `VITE_SOCKET_URL` = your Railway backend URL
6. Click "Deploy"
7. Wait 3-5 minutes
8. Copy the Vercel URL (e.g., `https://xxx.vercel.app`)

**Option B: Using Vercel CLI**

```bash
# Install Vercel CLI
npm install -g vercel

# In frontend folder
cd frontend
vercel --prod

# Choose organization and confirm settings
# Wait for deployment
```

### 4.3 Update Backend Configuration

Now that you have the Vercel frontend URL, update backend:

1. Go to Railway dashboard
2. Select your backend project
3. Click "Variables"
4. Update `FRONTEND_URL` = your Vercel URL
5. Save changes

### 4.4 Verify Frontend Deployment

1. Open your Vercel URL in browser
2. Append `?student_id=550e8400-e29b-41d4-a716-446655440000`
3. You should see the FocusMode UI with:
   - Timer
   - Quiz score input
   - Focus minutes input
   - Submit button

✅ **Frontend is live!**

---

## 🤖 Phase 5: Setup n8n Automation (30 minutes)

### 5.1 Create n8n Cloud Account

1. Go to https://n8n.cloud
2. Sign up with email or GitHub
3. Create new workspace
4. Accept terms
5. Skip template selection

### 5.2 Import Workflow

1. In n8n dashboard, click "Import"
2. Upload or paste `n8n-workflows/mentor-dispatcher.json`
3. n8n will auto-detect nodes
4. Click "Import"

### 5.3 Configure Nodes

**Node 1: Webhook Trigger**
- Already configured in JSON
- Copy webhook URL for later

**Node 2: HTTP Request - Fetch Student**
- URL: `https://your-railway-url.com/api/student/{{ $json.body.student_id }}`
- Method: GET
- Headers: Content-Type: application/json

**Node 3: Send Email**
- Service: Gmail / SendGrid / your email provider
- Configure email credentials
- To: `{{ $json.body.mentor_email }}`
- Subject: New Intervention Required
- Body: Student {{ $json.body.student_name }} needs mentoring

**Node 4: Wait**
- Duration: 1 hour (or your preference)
- Wait for webhook callback

**Node 5: HTTP Request - Assign Intervention**
- URL: `https://your-railway-url.com/api/assign-intervention`
- Method: POST
- Body:
  ```json
  {
    "student_id": "{{ $json.body.student_id }}",
    "mentor_id": "{{ $json.body.mentor_id }}",
    "approved": true,
    "task": "Complete practice problems"
  }
  ```

**Node 6: Slack Notification**
- Configure Slack webhook
- Message: Intervention assigned to {{ $json.body.student_name }}

### 5.4 Activate Workflow

1. Click "Activate" button (top right)
2. Workflow is now live
3. **Copy webhook URL**: You'll see it in the Webhook Trigger node
4. Format: `https://n8n.cloud/webhook/xxx`

### 5.5 Update Backend Configuration

1. Go to Railway dashboard
2. Click backend project
3. Click "Variables"
4. Update `N8N_WEBHOOK_URL` = the n8n webhook URL
5. Save changes
6. Railway will auto-redeploy

---

## 🔗 Phase 6: Integration & Testing (15 minutes)

### 6.1 End-to-End Test

**Scenario**: Student submits failing checkin, gets intervention

```bash
# 1. Test API directly
curl -X POST https://your-railway-url.com/api/daily-checkin \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "550e8400-e29b-41d4-a716-446655440000",
    "quiz_score": 3,
    "focus_minutes": 20
  }'

# Expected response: { "status": "locked", "intervention_id": "xxx" }

# 2. Check n8n logs
# - Go to n8n dashboard
# - Click workflow
# - Check "Executions" tab
# - Should see webhook triggered

# 3. Test UI
# - Open frontend: https://your-vercel-url.com?student_id=550e8400...
# - Enter quiz score: 3
# - Enter focus: 20
# - Click Submit
# - UI should show "Locked" state
# - Should see "Waiting for Mentor..." message
```

### 6.2 Verify All Systems

Checklist:
- [ ] Supabase: Database accessible
- [ ] Railway: Backend API responding
- [ ] Vercel: Frontend loading
- [ ] n8n: Workflow active
- [ ] WebSocket: Real-time updates working
- [ ] Fail-safe: Cron jobs running

### 6.3 Monitor Production

1. **Railway Logs**: Check for errors
   - Dashboard → Backend → "Logs" tab
   - Look for any red errors

2. **Vercel Analytics**: Check frontend performance
   - Dashboard → Frontend → "Analytics" tab

3. **n8n Executions**: Check workflow runs
   - Dashboard → Workflow → "Executions"

4. **Supabase Logs**: Check database
   - Dashboard → "Database" → Query Editor

---

## 📊 Environment Variables Summary

### Backend (Railway)
```
DATABASE_URL=postgresql://postgres:password@db.supabase.co:5432/postgres
N8N_WEBHOOK_URL=https://n8n.cloud/webhook/xxx
FRONTEND_URL=https://your-frontend.vercel.app
PORT=5000
NODE_ENV=production
```

### Frontend (Vercel)
```
VITE_API_URL=https://your-railway-backend.app/api
VITE_SOCKET_URL=https://your-railway-backend.app
```

### n8n Cloud
```
EMAIL_SERVICE=Gmail/SendGrid/Custom
SLACK_WEBHOOK=https://hooks.slack.com/xxx
SMTP_CREDENTIALS=configured
```

---

## 🎯 Domain Configuration (Optional)

### Add Custom Domain to Frontend

1. Vercel dashboard → Frontend project
2. Click "Domains"
3. Add your domain (e.g., `app.alcovia.com`)
4. Update DNS records (Vercel provides instructions)
5. Wait 24-48 hours for propagation

### Add Custom Domain to Backend

1. Railway dashboard → Backend project
2. Click "Settings"
3. Add custom domain
4. Update DNS records
5. Test: `curl https://api.alcovia.com/health`

---

## 🔒 Security Checklist

- [ ] Environment variables not in code
- [ ] Database password is strong
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Error messages don't leak info
- [ ] HTTPS enforced everywhere
- [ ] Webhook URLs validated
- [ ] API keys stored securely

---

## 🆘 Troubleshooting Deployment

### Backend won't start
```bash
# Check logs
railway logs

# Common issues:
# 1. DATABASE_URL not set
# 2. Database not accessible
# 3. Port already in use
```

### Frontend won't load
```bash
# Check build
vercel logs

# Common issues:
# 1. API_URL incorrect
# 2. CORS not enabled
# 3. Environment variables not set
```

### WebSocket connection fails
```bash
# Check in browser console (F12)
# Look for: WebSocket is open (OPEN)

# If fails, check:
# 1. SOCKET_URL correct
# 2. Backend running
# 3. CORS allows WebSocket
```

### n8n workflow not triggering
```bash
# Check webhook URL
# Test manually:
curl -X POST "your-n8n-webhook-url" \
  -H "Content-Type: application/json" \
  -d '{"student_id":"test","quiz_score":3}'

# Check n8n execution logs
```

---

## ✅ Deployment Verification

Run this checklist after deploying:

```
BACKEND TESTS:
[ ] Health check: GET /health → 200 OK
[ ] Daily checkin: POST /api/daily-checkin → 201 Created
[ ] Get student: GET /api/student/[id] → 200 OK
[ ] Intervention: POST /api/assign-intervention → 201 Created

FRONTEND TESTS:
[ ] Page loads
[ ] Can input quiz score
[ ] Can input focus minutes
[ ] Can submit form
[ ] Real-time update works
[ ] All 3 states display correctly

DATABASE TESTS:
[ ] Can query students table
[ ] Can query daily_logs table
[ ] Can insert new log
[ ] Foreign key constraints work

AUTOMATION TESTS:
[ ] n8n webhook receives requests
[ ] Email sent to mentor
[ ] WebSocket receives unlock
[ ] Intervention state updates

ALL TESTS PASS: ✅ READY FOR PRODUCTION
```

---

## 📞 Deployment Support

### Quick Reference
- **Documentation**: See README.md
- **API Reference**: See docs/API_REFERENCE.md
- **Architecture**: See PROJECT_ANALYSIS.md
- **Quick Issues**: See README.md → Troubleshooting

### Getting Help
1. Check logs first (Railway/Vercel/n8n)
2. Review environment variables
3. Test with curl/Postman
4. Check network connectivity
5. Verify DNS propagation

---

## 🎉 You're Live!

Once everything is deployed:

1. ✅ **Backend**: Running on Railway
2. ✅ **Frontend**: Running on Vercel
3. ✅ **Database**: Connected to Supabase
4. ✅ **Automation**: Running on n8n Cloud
5. ✅ **System**: Production-ready!

**Next**: Monitor logs and handle student requests!

---

## 📈 Post-Deployment

### First Week Monitoring
- Check error logs daily
- Monitor WebSocket connections
- Verify database performance
- Test end-to-end workflows
- Gather user feedback

### Scaling (If Needed)
- Increase Railway resources
- Add database replicas
- Implement caching
- Optimize API queries

### Maintenance
- Regular backups
- Security updates
- Performance monitoring
- User support

---

**Status**: ✅ READY TO DEPLOY  
**Estimated Time**: 2-3 hours  
**Difficulty**: Intermediate  

**Let's get it live! 🚀**

