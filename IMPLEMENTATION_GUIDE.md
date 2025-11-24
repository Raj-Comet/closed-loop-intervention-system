# 48-Hour Implementation Guide

## 🎯 Objective
Build a complete "Closed-Loop Intervention System" with real-time mentorship automation that deploys to production within 48 hours.

---

## ⏱️ Timeline & Phases

### Phase 1: Foundation (Hours 0-6) - Setup & Database

#### Hour 0-2: Initial Setup
- [ ] Clone/fork repository
- [ ] Set up Supabase account or PostgreSQL
- [ ] Create `.env` files for backend and frontend
- [ ] Install dependencies: `npm install` in both folders

#### Hour 2-4: Database Schema
- [ ] Execute SQL from `backend/migrations/001_create_tables.sql` in Supabase/PostgreSQL
- [ ] Verify tables created: students, daily_logs, interventions, mentor_actions
- [ ] Test database connection from backend
- [ ] Command: `npm run migrate` (if you've set up migration script)

#### Hour 4-6: Backend Starter
- [ ] Test backend starts: `npm run dev`
- [ ] Verify server runs on `http://localhost:5000`
- [ ] Verify `/health` endpoint responds
- [ ] Create sample student in database using query:
  ```sql
  INSERT INTO students (id, email, name, status) 
  VALUES ('550e8400-e29b-41d4-a716-446655440000', 'test@example.com', 'Test Student', 'on_track');
  ```

**Deliverables**: Database ready, backend running, can access health endpoint

---

### Phase 2: Backend APIs (Hours 6-15) - Core Logic

#### Hour 6-8: Daily Checkin Endpoint
- [ ] Implement `/api/daily-checkin` POST endpoint
- [ ] Add validation: quiz_score 0-10, focus_minutes > 0
- [ ] Add logic: If quiz >= 7 AND focus >= 60 → "On Track"
- [ ] Test with Postman:
  ```bash
  POST http://localhost:5000/api/daily-checkin
  {
    "student_id": "550e8400-e29b-41d4-a716-446655440000",
    "quiz_score": 8,
    "focus_minutes": 75
  }
  ```

#### Hour 8-10: Intervention Trigger
- [ ] Modify `/api/daily-checkin`: If quiz < 7 OR focus < 60 → create intervention
- [ ] Call n8n webhook (dummy URL for now)
- [ ] Update student status to "needs_intervention"
- [ ] Test with bad scores:
  ```bash
  POST with quiz_score: 4, focus_minutes: 30
  ```
- [ ] Verify intervention created in database

#### Hour 10-12: Get Student State
- [ ] Implement `/api/student/:id` GET endpoint
- [ ] Return: student info, current intervention, last log
- [ ] Test: `GET http://localhost:5000/api/student/550e8400-e29b-41d4-a716-446655440000`

#### Hour 12-14: Assign Intervention
- [ ] Implement `/api/assign-intervention` POST endpoint (called by n8n)
- [ ] Update intervention: status → "approved", remedial_task set
- [ ] Update student status: → "in_remedial"
- [ ] Emit WebSocket event (prepare for next phase)
- [ ] Test manually for now

#### Hour 14-15: Complete Remedial
- [ ] Implement `/api/complete-remedial` POST endpoint
- [ ] Update intervention: status → "completed"
- [ ] Update student status: → "on_track"
- [ ] Test the full flow: bad score → approve → complete

**Deliverables**: All 4 core endpoints working, data persists to database

**Test Checklist**:
```bash
✓ POST /daily-checkin with passing scores → "On Track"
✓ POST /daily-checkin with failing scores → "Pending Mentor Review"
✓ GET /student/:id → returns current state
✓ POST /assign-intervention → student status changes
✓ POST /complete-remedial → student back to on_track
```

---

### Phase 3: Frontend (Hours 15-24) - User Interface

#### Hour 15-17: React Setup & Context
- [ ] Frontend runs: `npm run dev`
- [ ] Create StudentContext with state: status, intervention, student
- [ ] Add Socket.io connection initialization
- [ ] Fetch student state on mount
- [ ] Test loading state displays

#### Hour 17-19: Normal State UI
- [ ] Build FocusTimer component (timer display + quiz input)
- [ ] Add styling (gradient, responsive)
- [ ] Connect to `/api/daily-checkin` endpoint
- [ ] Test submission: should show state change

#### Hour 19-21: Locked State UI
- [ ] Build LockedState component
- [ ] Show waiting animation + stats display
- [ ] Show countdown timer (expires_at)
- [ ] Add warning about 12-hour auto-unlock
- [ ] Disable all inputs
- [ ] Test after bad checkin

#### Hour 21-23: Remedial State UI
- [ ] Build RemedialState component
- [ ] Display remedial task
- [ ] Show progress bar (mock 50% for now)
- [ ] "Mark Complete" button
- [ ] Test flow: normal → bad score → locked → (simulate unlock) → remedial → complete

#### Hour 23-24: Polish & Integration
- [ ] Add loading spinners
- [ ] Add error messages
- [ ] Responsive design check (mobile view)
- [ ] Tab switch detection (bonus): use `useVisibilityDetector` hook
- [ ] Test full flow in browser

**Deliverables**: Full UI for all 3 states, can submit check-ins and see results

---

### Phase 4: WebSocket & Automation (Hours 24-36) - Real-Time Magic

#### Hour 24-26: Socket.io Setup
- [ ] Initialize Socket.io server in backend
- [ ] Add socket connection in frontend
- [ ] Student registers on connect: `socket.emit('student:register', studentId)`
- [ ] Test connection with browser DevTools
- [ ] Verify socket events are being sent/received

#### Hour 26-28: Real-Time State Updates
- [ ] Backend emits `state:changed` event when intervention triggered
- [ ] Frontend listens and updates UI instantly (no polling)
- [ ] Test: Submit bad score → UI changes to "locked" within <100ms
- [ ] Remove polling (or keep as fallback)

#### Hour 28-30: n8n Workflow Setup
- [ ] Create n8n Cloud account (n8n.cloud)
- [ ] Import `n8n-workflows/mentor-dispatcher.json`
- [ ] Configure environment variables in n8n:
  - `BACKEND_URL`
  - `MENTOR_EMAIL`
  - `MENTOR_ID`
  - `SLACK_WEBHOOK_URL` (optional)
- [ ] Copy webhook URL from n8n
- [ ] Update backend `.env`: `N8N_WEBHOOK_URL`

#### Hour 30-32: n8n Email Integration
- [ ] Configure email provider in n8n (Gmail, SendGrid, etc.)
- [ ] Test email sending: manually trigger workflow
- [ ] Verify mentor receives email with student info
- [ ] Verify email has approval link/button

#### Hour 32-34: n8n Wait & Callback
- [ ] Set up "Wait" node to pause workflow
- [ ] Mentor approves → n8n resumes
- [ ] n8n POSTs to `/api/assign-intervention`
- [ ] Backend emits WebSocket → student sees unlock
- [ ] Test: End-to-end from check-in to unlock

#### Hour 34-36: Cron Jobs & Fail-Safe
- [ ] Implement timeout check cron job (runs every hour)
- [ ] Find interventions older than 12 hours
- [ ] Auto-unlock, log as "auto_escalated"
- [ ] Test by manually changing intervention `created_at` to 12+ hours ago

**Deliverables**: Complete real-time loop: student → backend → n8n → mentor → backend → student

---

### Phase 5: Deployment (Hours 36-45) - Get It Live

#### Hour 36-38: Prepare Backend for Deployment
- [ ] Create Railway account
- [ ] Connect GitHub repo
- [ ] Set environment variables (DATABASE_URL, etc.)
- [ ] Create PostgreSQL plugin in Railway
- [ ] Deploy backend
- [ ] Test endpoints work from production URL
- [ ] Verify WebSocket works from browser

#### Hour 38-40: Prepare Frontend for Deployment
- [ ] Create Vercel account
- [ ] Connect GitHub repo
- [ ] Set environment variables:
  - `VITE_API_URL=<railway-backend-url>/api`
  - `VITE_SOCKET_URL=<railway-backend-url>`
- [ ] Deploy frontend
- [ ] Test from `https://your-app.vercel.app?student_id=<uuid>`

#### Hour 40-42: n8n in Production
- [ ] n8n already deployed (if using cloud)
- [ ] Verify webhook URL is accessible
- [ ] Test: Send from production backend → n8n receives
- [ ] Update frontend to use production backend URL

#### Hour 42-44: End-to-End Test
- [ ] Visit production frontend
- [ ] Create/use student account
- [ ] Submit failed check-in
- [ ] Verify locked state appears
- [ ] Wait for/manually trigger n8n
- [ ] Verify remedial state
- [ ] Complete task
- [ ] Verify back to normal

#### Hour 44-45: Documentation
- [ ] Update README with production URLs
- [ ] Create deployment guide
- [ ] Document fail-safe mechanism
- [ ] Add troubleshooting section

**Deliverables**: Entire system running live, accessible from web, working end-to-end

---

### Phase 6: Polish & Bonus (Hours 45-48) - Excellence

#### Hour 45-46: Tab Switch Detection (BONUS)
- [ ] Implement `useVisibilityDetector` hook
- [ ] Show warning on tab switch
- [ ] Auto-fail after 3 switches
- [ ] Log as penalty intervention

#### Hour 46-47: UI/UX Polish
- [ ] Fine-tune animations
- [ ] Add better error messages
- [ ] Improve mobile responsiveness
- [ ] Add loading states everywhere
- [ ] Test accessibility

#### Hour 47-48: Final Testing & Documentation
- [ ] Run full test scenario 3 times
- [ ] Fix any bugs found
- [ ] Update README with all features
- [ ] Document API with examples
- [ ] Create video demo (optional)
- [ ] Write fail-safe explanation

**Deliverables**: Production-ready system with bonus features

---

## 📋 Quick Reference Commands

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with real values
npm run dev              # Start development server
npm run migrate          # Run migrations (if set up)
npm start              # Start production server
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with real backend URLs
npm run dev            # Start Vite dev server (http://localhost:3000)
npm run build          # Build for production
npm run preview        # Preview production build
```

### Testing APIs
```bash
# Test daily checkin
curl -X POST http://localhost:5000/api/daily-checkin \
  -H "Content-Type: application/json" \
  -d '{"student_id": "550e8400-e29b-41d4-a716-446655440000", "quiz_score": 4, "focus_minutes": 30}'

# Get student state
curl http://localhost:5000/api/student/550e8400-e29b-41d4-a716-446655440000

# Assign intervention
curl -X POST http://localhost:5000/api/assign-intervention \
  -H "Content-Type: application/json" \
  -d '{"intervention_id": "<id>", "remedial_task": "Read Chapter 4", "mentor_id": "mentor@example.com"}'
```

---

## 🎯 Success Criteria

By hour 48, you should have:

- ✅ **Database**: Students, logs, interventions tables working
- ✅ **Backend**: All 4 core APIs working (daily-checkin, get-student, assign, complete)
- ✅ **Frontend**: UI for Normal, Locked, Remedial states
- ✅ **Automation**: n8n workflow sending emails
- ✅ **Human Loop**: Mentor approval path working
- ✅ **Real-Time**: WebSockets updating student app instantly
- ✅ **Fail-Safe**: 12-hour timeout auto-unlocking students
- ✅ **Deployed**: All live on web, not local
- ✅ **Documentation**: README with deployment steps
- ✅ **Bonus**: Tab detection or other feature completed

---

## 🚨 Critical Paths (Don't Skip)

1. **Database** → Without this, nothing works
2. **Backend APIs** → Without this, frontend has no data
3. **Frontend** → Without this, there's nothing to interact with
4. **WebSocket** → Without real-time, UX feels broken
5. **Deployment** → Without this, they can't see your work live
6. **Documentation** → Without this, they won't understand your architecture

## 💡 Pro Tips

- **Start with backend** - Get APIs working first, then build UI
- **Use Postman** - Test every endpoint before building frontend
- **Deploy early** - Get Railway/Vercel set up in hour 36, not hour 46
- **Fail-safe is critical** - The "Chaos" component shows design thinking
- **WebSockets are impressive** - Real-time feedback feels professional
- **Comments matter** - Document your code; show your thinking

---

## 📞 Getting Help

- **Backend issues**: Check logs with `npm run dev`
- **Database issues**: Use DBeaver to inspect tables
- **n8n issues**: Check n8n workflow logs in browser
- **Frontend issues**: Open DevTools Console and check errors
- **Deployment issues**: Check Railway/Vercel logs

---

**You've got this! 🚀 Build something amazing in 48 hours!**

