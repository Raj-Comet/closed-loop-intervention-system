# ⚡ QUICK DEPLOYMENT CHECKLIST

**Closed-Loop Intervention System**  
**Time Estimate**: 2-3 hours  
**Difficulty**: Intermediate

---

## 📋 Pre-Deployment Checklist

Before you start, make sure you have:

```
ACCOUNTS CREATED:
[ ] Supabase account (https://supabase.com)
[ ] Railway account (https://railway.app)
[ ] Vercel account (https://vercel.com)
[ ] n8n Cloud account (https://n8n.cloud)

TOOLS INSTALLED:
[ ] Node.js 16+ (check: node --version)
[ ] Git (check: git --version)
[ ] PostgreSQL client (optional but helpful)

FILES READY:
[ ] backend/migrations/001_create_tables.sql
[ ] backend/.env.example
[ ] frontend/.env.example
[ ] n8n-workflows/mentor-dispatcher.json
[ ] All code properly organized
```

---

## 🚀 Deployment Steps (In Order)

### STEP 1: DATABASE (Supabase) - 15 minutes ⏱️

```
[ ] Go to https://supabase.com
[ ] Create new project
[ ] Save: Database password
[ ] Save: Project URL
[ ] Go to SQL Editor
[ ] Create new query
[ ] Copy from backend/migrations/001_create_tables.sql
[ ] Run the SQL
[ ] Verify: 4 tables created ✅
[ ] Get connection string from Settings → Database
[ ] Save as: DATABASE_URL
```

**Connection String Format**:
```
postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres
```

---

### STEP 2: BACKEND (Railway) - 30 minutes ⏱️

```
[ ] Go to https://railway.app
[ ] Create new project
[ ] Connect GitHub repo
[ ] Select: backend folder
[ ] Deploy

WAIT FOR DEPLOYMENT...

[ ] Get Railway URL from dashboard
[ ] Click "Variables" tab
[ ] Add these 5 variables:
    - DATABASE_URL = [from Supabase]
    - N8N_WEBHOOK_URL = https://n8n.cloud/webhook/xxx (temporary)
    - FRONTEND_URL = https://[your-vercel-url].vercel.app (later)
    - PORT = 5000
    - NODE_ENV = production

[ ] Save variables (auto-redeploy)
[ ] Wait for green "Active" status
[ ] Test health endpoint:
    curl https://[railway-url]/health
    
Expected: {"status":"ok"} ✅
```

**Test Backend API**:
```bash
curl -X POST https://[railway-url]/api/daily-checkin \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "550e8400-e29b-41d4-a716-446655440000",
    "quiz_score": 8,
    "focus_minutes": 60
  }'

Expected: {"status":"on_track"} ✅
```

---

### STEP 3: FRONTEND (Vercel) - 30 minutes ⏱️

```
[ ] Go to https://vercel.com
[ ] New Project → Select GitHub repo
[ ] Framework: React
[ ] Root Directory: ./frontend
[ ] Build Command: npm run build
[ ] Output Directory: dist

[ ] Add Environment Variables:
    - VITE_API_URL = https://[railway-url]/api
    - VITE_SOCKET_URL = https://[railway-url]

[ ] Click "Deploy"
[ ] WAIT FOR DEPLOYMENT (3-5 minutes)...
[ ] Get Vercel URL from Success message

[ ] Test Frontend:
    Open: https://[vercel-url]?student_id=550e8400...
    
Expected: FocusMode UI with timer ✅
```

**Update Backend with Frontend URL**:
```
[ ] Go back to Railway dashboard
[ ] Click backend project
[ ] Click Variables
[ ] Update FRONTEND_URL = https://[vercel-url].vercel.app
[ ] Save (auto-redeploy)
```

---

### STEP 4: AUTOMATION (n8n Cloud) - 30 minutes ⏱️

```
[ ] Go to https://n8n.cloud
[ ] Sign up / Login
[ ] Create new workflow
[ ] Click "Import"
[ ] Choose file: n8n-workflows/mentor-dispatcher.json
[ ] Click "Import"

CONFIGURE NODES:

Node 1: Webhook Trigger
  [ ] Copy webhook URL
  [ ] Save it: N8N_WEBHOOK_URL = https://n8n.cloud/webhook/[ID]

Node 2: HTTP Request - Fetch Student
  [ ] URL: https://[railway-url]/api/student/{{ $json.body.student_id }}
  [ ] Method: GET

Node 3: Send Email
  [ ] Configure email provider (Gmail/SendGrid)
  [ ] To: {{ $json.body.mentor_email }}
  [ ] Subject: "New Intervention Required"

Node 4: Wait
  [ ] Duration: 1 hour

Node 5: HTTP Request - Assign Intervention
  [ ] URL: https://[railway-url]/api/assign-intervention
  [ ] Method: POST
  [ ] Body:
      {
        "student_id": "{{ $json.body.student_id }}",
        "mentor_id": "{{ $json.body.mentor_id }}",
        "approved": true
      }

Node 6: Slack Notification (Optional)
  [ ] Configure Slack webhook
  [ ] Message: "Intervention assigned"

[ ] Click "Activate" to make workflow live
[ ] Copy webhook URL again
[ ] Update Backend N8N_WEBHOOK_URL with this URL
```

**Update Backend with n8n URL**:
```
[ ] Go to Railway dashboard
[ ] Click backend project
[ ] Click Variables
[ ] Update N8N_WEBHOOK_URL = [n8n webhook URL from step above]
[ ] Save (auto-redeploy)
```

---

### STEP 5: INTEGRATION & TESTING - 15 minutes ⏱️

```
VERIFY ALL SYSTEMS:

[ ] Backend Health:
    curl https://[railway-url]/health
    Expected: {"status":"ok"} ✅

[ ] Frontend Loading:
    Open: https://[vercel-url]?student_id=550e8400...
    Expected: UI with timer ✅

[ ] Database Connected:
    Create student in database
    Expected: No errors ✅

[ ] n8n Webhook Working:
    Test workflow manually in n8n
    Expected: Webhook triggered ✅

END-TO-END TEST:

[ ] Go to frontend
[ ] Input quiz_score: 3 (low)
[ ] Input focus_minutes: 20 (low)
[ ] Click Submit
[ ] UI changes to: "Locked" state ✅
[ ] Browser console shows: WebSocket connected ✅
[ ] Check n8n dashboard → executions
[ ] Expected: Webhook executed ✅
[ ] Check database: intervention created ✅
```

---

## 📊 Environment Variables Checklist

### Backend (Railway)
```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres
N8N_WEBHOOK_URL=https://n8n.cloud/webhook/[ID]
FRONTEND_URL=https://[vercel-url].vercel.app
PORT=5000
NODE_ENV=production
```

### Frontend (Vercel)
```
VITE_API_URL=https://[railway-url]/api
VITE_SOCKET_URL=https://[railway-url]
```

---

## 🔗 URLs to Keep Handy

```
Supabase Dashboard:
https://supabase.com/dashboard

Railway Dashboard:
https://railway.app/dashboard
Backend URL: https://[your-railway-url].app

Vercel Dashboard:
https://vercel.com/dashboard
Frontend URL: https://[your-vercel-url].vercel.app

n8n Cloud:
https://n8n.cloud
Webhook: https://n8n.cloud/webhook/[ID]
```

---

## ✅ Final Verification

```
BEFORE GOING LIVE:

[ ] Backend responding to all endpoints
[ ] Frontend loading without errors
[ ] WebSocket connecting
[ ] Database has test data
[ ] n8n workflow active
[ ] Email integration working
[ ] Fail-safe cron jobs configured

AFTER GOING LIVE:

[ ] Monitor Railway logs
[ ] Check Vercel analytics
[ ] Review n8n executions
[ ] Test with real student
[ ] Verify mentor gets notified
```

---

## 🎯 Quick URLs After Deployment

**Frontend**: https://[your-vercel-url].vercel.app

**Backend API**: https://[your-railway-url].app/api

**Database**: Supabase dashboard

**Automation**: n8n dashboard

---

## ⏱️ Timeline

| Phase | Task | Time | Status |
|-------|------|------|--------|
| 1 | Database (Supabase) | 15 min | |
| 2 | Backend (Railway) | 30 min | |
| 3 | Frontend (Vercel) | 30 min | |
| 4 | Automation (n8n) | 30 min | |
| 5 | Testing & Integration | 15 min | |
| **TOTAL** | **Production Deploy** | **2h 10m** | |

---

## 🆘 Quick Troubleshooting

### Backend won't start
→ Check DATABASE_URL in Railway Variables

### Frontend shows "API Error"
→ Check VITE_API_URL in Vercel Environment

### WebSocket won't connect
→ Check VITE_SOCKET_URL in Vercel Environment

### n8n not triggering
→ Check N8N_WEBHOOK_URL in Railway Variables

### Database connection fails
→ Verify connection string and password

---

## ✨ SUCCESS INDICATORS

You're deployed successfully when:

✅ Frontend loads at: https://your-vercel-url.vercel.app  
✅ Backend responds at: https://your-railway-url/health  
✅ UI shows timer and input fields  
✅ Can submit a checkin  
✅ n8n webhook executes  
✅ WebSocket updates in real-time  
✅ Database stores data  

---

## 📞 Need Help?

1. **Check logs**: Railway → Backend → Logs
2. **Check build**: Vercel → Deployments
3. **Test API**: Use curl or Postman
4. **Read docs**: DEPLOYMENT_GUIDE.md

---

**Ready to deploy? Start with Step 1! 🚀**

