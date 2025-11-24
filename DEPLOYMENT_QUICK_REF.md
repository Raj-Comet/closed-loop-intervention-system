# 🎯 DEPLOYMENT QUICK REFERENCE

---

## ⚡ THE ABSOLUTE FASTEST WAY

### 1️⃣ GITHUB (Your Code)
```bash
git push origin main
```

### 2️⃣ SUPABASE (Database - 5 min)
1. supabase.com → New Project
2. SQL Editor → New Query
3. Copy from: `backend/migrations/001_create_tables.sql`
4. Run SQL
5. Save connection string (from Settings → Database)

### 3️⃣ VERCEL (Frontend - 5 min)
1. vercel.com → Add Project
2. Select GitHub repo
3. Root Directory: `./frontend`
4. Env vars:
   - `VITE_API_URL` = (your Railway URL + `/api`) [ADD LATER]
   - `VITE_SOCKET_URL` = (your Railway URL) [ADD LATER]
5. Deploy

### 4️⃣ RAILWAY (Backend - 5 min)
1. railway.app → New Project
2. Deploy from GitHub
3. Root Directory: `./backend`
4. Variables:
   - `DATABASE_URL` = Supabase connection string
   - `FRONTEND_URL` = your Vercel URL
   - `N8N_WEBHOOK_URL` = (from n8n) [ADD LATER]
   - `PORT` = 5000
5. Deploy

### 5️⃣ n8n (Automation - 5 min)
1. n8n.cloud → Create account
2. Import: `n8n-workflows/mentor-dispatcher.json`
3. Update URLs in workflow (2 nodes):
   - Node 2: `https://YOUR-RAILWAY-URL/api/student/...`
   - Node 5: `https://YOUR-RAILWAY-URL/api/assign-intervention`
4. Activate workflow
5. Copy webhook URL
6. Add to Railway: `N8N_WEBHOOK_URL`

---

## 📋 URLS GUIDE

| Service | URL |
|---------|-----|
| Supabase | https://supabase.com |
| Vercel | https://vercel.com |
| Railway | https://railway.app |
| n8n Cloud | https://n8n.cloud |
| GitHub | https://github.com |

---

## 🔑 ENVIRONMENT VARIABLES

**Vercel Frontend**:
```
VITE_API_URL = https://[railway-url].railway.app/api
VITE_SOCKET_URL = https://[railway-url].railway.app
```

**Railway Backend**:
```
DATABASE_URL = postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres
FRONTEND_URL = https://[vercel-url].vercel.app
N8N_WEBHOOK_URL = https://n8n.cloud/webhook/[ID]
PORT = 5000
NODE_ENV = production
```

---

## ✅ VERIFICATION

```bash
# Test Backend
curl https://[railway-url].railway.app/health

# Expected: {"status":"ok"}

# Test Frontend
Open: https://[vercel-url].vercel.app?student_id=550e8400-e29b-41d4-a716-446655440000

# Expected: See FocusMode UI with timer
```

---

## 🚀 FINAL URLS (After Deployment)

```
Frontend: https://[your-project].vercel.app
Backend:  https://[your-project].railway.app
```

---

**Total Time: ~25-30 minutes** ⏱️

