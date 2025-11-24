# 🚀 Quick Start Checklist

## Before You Start
- [ ] Node.js 16+ installed (`node --version`)
- [ ] Git installed
- [ ] Supabase or PostgreSQL account
- [ ] Code editor (VS Code recommended)
- [ ] Postman (for API testing)

---

## Phase 1: Get It Running Locally (1-2 hours)

### Step 1: Clone and Setup
```bash
cd e:\Closed-Loop\ Intervention\ System
cd backend
npm install
cp .env.example .env
```

### Step 2: Configure Backend
Edit `backend/.env`:
```
DATABASE_URL=postgresql://user:password@localhost:5432/closed_loop
N8N_WEBHOOK_URL=https://n8n.example.com/webhook (can be placeholder)
FRONTEND_URL=http://localhost:3000
PORT=5000
```

### Step 3: Database Setup
1. Go to Supabase.com or use local PostgreSQL
2. Copy SQL from `backend/migrations/001_create_tables.sql`
3. Execute in database editor
4. Test connection: Backend should start without error

### Step 4: Start Backend
```bash
cd backend
npm run dev
# Should see: "🚀 Server is running on http://localhost:5000"
```

**Test**: Open browser → `http://localhost:5000/health`

### Step 5: Start Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
# Should see: "VITE v4... ready in XXX ms"
```

**Test**: Open `http://localhost:3000?student_id=550e8400-e29b-41d4-a716-446655440000`

- [ ] Backend running on 5000
- [ ] Frontend running on 3000
- [ ] Database connected
- [ ] Can see FocusMode UI

---

## Phase 2: Test Core API (30 minutes)

### Create Test Student
```sql
INSERT INTO students (id, email, name, status) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'test@example.com',
  'Test Student',
  'on_track'
);
```

### Test 1: Submit Passing Score
```bash
curl -X POST http://localhost:5000/api/daily-checkin \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "550e8400-e29b-41d4-a716-446655440000",
    "quiz_score": 8,
    "focus_minutes": 75
  }'
```
**Expected**: `{ "status": "On Track" }`
- [ ] Passes

### Test 2: Submit Failing Score
```bash
curl -X POST http://localhost:5000/api/daily-checkin \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "550e8400-e29b-41d4-a716-446655440000",
    "quiz_score": 4,
    "focus_minutes": 30
  }'
```
**Expected**: Returns intervention_id, status = "Pending Mentor Review"
- [ ] Passes
- [ ] Note the `intervention_id` for next test

### Test 3: Get Student State
```bash
curl http://localhost:5000/api/student/550e8400-e29b-41d4-a716-446655440000
```
**Expected**: Status should be `"needs_intervention"`
- [ ] Passes

### Test 4: Assign Intervention
```bash
curl -X POST http://localhost:5000/api/assign-intervention \
  -H "Content-Type: application/json" \
  -d '{
    "intervention_id": "<ID_FROM_TEST_2>",
    "remedial_task": "Read Chapter 4: Functions",
    "mentor_id": "mentor@example.com"
  }'
```
**Expected**: Success message, student status = `"in_remedial"`
- [ ] Passes

### Test 5: Complete Remedial
```bash
curl -X POST http://localhost:5000/api/complete-remedial \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "550e8400-e29b-41d4-a716-446655440000",
    "intervention_id": "<ID_FROM_TEST_2>"
  }'
```
**Expected**: Success message, student status = `"on_track"`
- [ ] Passes

---

## Phase 3: Test Frontend UI (30 minutes)

### Visit the App
Open: `http://localhost:3000?student_id=550e8400-e29b-41d4-a716-446655440000`

### Test Normal State
- [ ] See "Focus Mode" page
- [ ] See timer and quiz input
- [ ] Submit passing scores (quiz: 8, timer: 60 sec)
- [ ] See "On Track" message

### Test Locked State
- [ ] Submit failing scores (quiz: 4, timer: 10 sec)
- [ ] See "Locked" UI with waiting animation
- [ ] See countdown timer
- [ ] Cannot interact with inputs

### Test Remedial State
- [ ] Manually POST to `/api/assign-intervention` (via Postman)
- [ ] Refresh page or wait for WebSocket
- [ ] Should see remedial task
- [ ] Click "Mark Complete"
- [ ] Should return to normal state

- [ ] All 3 states working
- [ ] UI is responsive
- [ ] No console errors

---

## Phase 4: Setup n8n (30 minutes)

### Create n8n Workflow
1. Go to https://n8n.cloud
2. Sign up / Log in
3. Create new workflow
4. Import `n8n-workflows/mentor-dispatcher.json`

### Configure n8n Variables
In n8n settings, create variables:
- [ ] `BACKEND_URL` = `http://localhost:5000` (or production URL)
- [ ] `MENTOR_EMAIL` = your email
- [ ] `MENTOR_ID` = mentor@system
- [ ] `SLACK_WEBHOOK_URL` = (optional)

### Test Webhook
1. Copy webhook URL from Webhook node
2. Update `backend/.env`: `N8N_WEBHOOK_URL=<URL>`
3. Restart backend: `npm run dev`
4. Submit failing check-in again
5. Check n8n logs to see webhook trigger

- [ ] n8n receives webhook
- [ ] Workflow starts
- [ ] Email sent to mentor

---

## Phase 5: Production Deployment (1-2 hours)

### Backend → Railway
1. [ ] Create Railway account
2. [ ] Create PostgreSQL plugin
3. [ ] Connect GitHub repo
4. [ ] Set environment variables
5. [ ] Deploy
6. [ ] Note production URL

### Frontend → Vercel
1. [ ] Create Vercel account
2. [ ] Connect GitHub repo
3. [ ] Set `VITE_API_URL` to production backend
4. [ ] Deploy
5. [ ] Note production URL

### n8n
1. [ ] Already deployed on n8n.cloud
2. [ ] Update backend `N8N_WEBHOOK_URL` to production
3. [ ] Redeploy backend

### Test Production
```bash
curl https://your-production-backend.railway.app/health
```
- [ ] Backend responds
- [ ] Frontend loads: `https://your-app.vercel.app?student_id=<uuid>`
- [ ] End-to-end test works

---

## Phase 6: Add Bonus Features (Optional)

### Tab Switch Detection
- [ ] Already implemented in frontend
- [ ] Test by switching tabs during focus mode
- [ ] Should see warning notification

### WebSocket Real-Time
- [ ] Already implemented
- [ ] Test: Submit bad score → instant lock (no refresh)
- [ ] Open DevTools → Network → WS to verify

### Fail-Safe Timeout
- [ ] Already implemented as cron job
- [ ] To test: Manually update intervention created_at to 12+ hours ago
- [ ] Run cron (or wait for next hourly execution)
- [ ] Should auto-unlock

---

## ✅ Final Checklist

- [ ] Backend running and tested
- [ ] Frontend running and styled
- [ ] Database schema created and verified
- [ ] All 5 core APIs working
- [ ] n8n workflow set up
- [ ] Production URLs noted
- [ ] Bonus features tested (WebSocket, timeout)
- [ ] Documentation reviewed
- [ ] Ready for deployment

---

## 🆘 Quick Troubleshooting

| Issue | Check |
|-------|-------|
| "Cannot connect to database" | DATABASE_URL correct? Database server running? |
| "Frontend blank" | Browser console for errors? VITE_API_URL correct? |
| "API returns 404" | Route file created? Imported in app.js? |
| "n8n webhook not triggering" | Webhook URL correct? Backend running? Check n8n logs |
| "Student not updating" | WebSocket connected? Check browser console |

---

## 📚 Documentation Reference

- **Overall**: PROJECT_ANALYSIS.md
- **Setup**: README.md → Quick Start
- **Time-Boxed**: IMPLEMENTATION_GUIDE.md
- **APIs**: docs/API_REFERENCE.md
- **n8n**: n8n-workflows/README.md

---

**Estimated Total Time**: 4-5 hours from zero to production-ready ✅

