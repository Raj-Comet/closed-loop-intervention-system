# Closed-Loop Intervention System - Project Analysis & Architecture

## 🎯 Project Overview

This is a **Product-First Engineering** challenge to build an end-to-end system that detects when a student is falling behind and triggers an automated mentorship loop with human approval.

### Core Problem
- Students submit daily quiz scores and focus time
- If stats are poor, the student is "locked" pending mentor review
- Mentor receives notification and approves a remedial task
- Once approved, student is "unlocked" and can only access the remedial task
- **The twist**: All of this must happen in REAL-TIME across web, backend, automation, and database

---

## 🏗️ System Architecture

### Three Main Components

```
┌─────────────────────────────────────────────────────────────┐
│                    CLOSED-LOOP SYSTEM                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  STUDENT APP (React)         BACKEND (Node.js)            │
│  ┌──────────────────┐       ┌──────────────────┐          │
│  │ Normal State     │ ──1──▶│ /daily-checkin   │          │
│  │ (Quiz + Timer)   │       │ POST             │          │
│  ├──────────────────┤       └──────────────────┘          │
│  │ Locked State     │            │                        │
│  │ (Waiting...)     │◀────4──────┘                        │
│  ├──────────────────┤            │                        │
│  │ Remedial State   │       ┌─────────────────────┐       │
│  │ (Task Show)      │       │  /assign-intervention       │
│  └──────────────────┘       │  (n8n callback)    │       │
│           ▲                 └─────────────────────┘       │
│           │                                             │
│        (WebSocket)                                      │
│           │                                             │
│  ┌────────┴───────────────────────┐                   │
│  │                                │                   │
│  │    N8N WORKFLOW                │                   │
│  │  ┌──────────────────────────┐  │                   │
│  │  │ 1. Webhook trigger ◀─────┼──┼── Backend        │
│  │  │ 2. Email Mentor          │  │                   │
│  │  │ 3. Wait for click ▶────┐ │  │                   │
│  │  │ 4. POST to Backend  ┌──┼──┼──┘                   │
│  │  └──────────────────────────┘  │                   │
│  │           MENTOR ACTIONS        │                   │
│  └────────────────────────────────┘                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Database Schema (PostgreSQL/Supabase)

### Table: students
```
id (UUID, PK)
email (String, UNIQUE)
name (String)
status (ENUM: 'on_track', 'needs_intervention', 'in_remedial')
current_intervention_id (UUID, FK to interventions)
created_at (Timestamp)
updated_at (Timestamp)
```

### Table: daily_logs
```
id (UUID, PK)
student_id (UUID, FK to students)
quiz_score (Integer, 0-10)
focus_minutes (Integer)
timestamp (Timestamp)
created_at (Timestamp)
```

### Table: interventions
```
id (UUID, PK)
student_id (UUID, FK to students)
triggered_at (Timestamp)
status (ENUM: 'pending', 'approved', 'completed', 'failed', 'timed_out')
remedial_task (Text)
n8n_workflow_id (String)
n8n_execution_id (String)
mentor_id (UUID, nullable - if we scale to multiple mentors)
approved_at (Timestamp, nullable)
completed_at (Timestamp, nullable)
expires_at (Timestamp) -- For fail-safe: auto-unlock after 12 hours
created_at (Timestamp)
```

### Table: mentor_actions
```
id (UUID, PK)
intervention_id (UUID, FK to interventions)
action (ENUM: 'approved', 'assigned_task', 'auto_escalated', 'timeout_unlocked')
task_assigned (Text)
timestamp (Timestamp)
created_at (Timestamp)
```

---

## 🔄 API Endpoints

### 1. POST /api/daily-checkin
**Request:**
```json
{
  "student_id": "uuid",
  "quiz_score": 4,
  "focus_minutes": 30
}
```

**Logic:**
- Log to `daily_logs` table
- Check: `quiz_score > 7 AND focus_minutes > 60`?
  - ✅ **YES**: Return `{ status: "On Track" }` and emit Socket event
  - ❌ **NO**: 
    - Create intervention (status: pending)
    - Trigger n8n webhook
    - Return `{ status: "Pending Mentor Review", intervention_id }`
    - Emit Socket event to lock the app

**Response:**
```json
{
  "status": "Pending Mentor Review",
  "intervention_id": "uuid",
  "locked_until": "2025-11-24T10:30:00Z"
}
```

---

### 2. GET /api/student/:id
**Purpose:** Fetch current student state (called on app load and polling)

**Response:**
```json
{
  "student_id": "uuid",
  "status": "needs_intervention",
  "intervention": {
    "id": "uuid",
    "status": "pending",
    "triggered_at": "2025-11-24T10:00:00Z"
  },
  "last_log": {
    "quiz_score": 4,
    "focus_minutes": 30
  }
}
```

---

### 3. POST /api/assign-intervention
**Called by n8n after mentor approval**

**Request:**
```json
{
  "intervention_id": "uuid",
  "remedial_task": "Read Chapter 4: Functions",
  "mentor_id": "uuid"
}
```

**Logic:**
- Update `interventions` table: status → 'approved', remedial_task set, approved_at set
- Update `students` table: status → 'in_remedial'
- Insert into `mentor_actions` table
- Emit Socket event to unlock student app in real-time

**Response:**
```json
{
  "success": true,
  "message": "Intervention assigned",
  "student_status": "in_remedial",
  "remedial_task": "Read Chapter 4: Functions"
}
```

---

### 4. POST /api/complete-remedial
**Called by student when they complete remedial task**

**Request:**
```json
{
  "student_id": "uuid",
  "intervention_id": "uuid"
}
```

**Logic:**
- Update `interventions`: status → 'completed', completed_at set
- Update `students`: status → 'on_track'
- Emit Socket event

---

### 5. WebSocket Events
```
// Student connects
student:connect → server stores socket mapping

// When intervention triggered
locked:state → student receives { status: "locked", message: "Waiting for Mentor..." }

// When mentor approves
unlocked:state → student receives { status: "remedial", task: "Read Chapter 4" }

// When student completes
completed:state → student receives { status: "on_track" }

// Heartbeat for fail-safe
intervention:status-check → returns current intervention state
```

---

## 🎨 Frontend States

### State 1: NORMAL
```
┌─────────────────────────┐
│   FOCUS MODE            │
├─────────────────────────┤
│                         │
│  ⏱️  Start Focus Timer   │
│  ─────────────────────  │
│  Focus Time: 45/90 min  │
│                         │
│  📝 Daily Quiz          │
│  Score: [    ]  /10     │
│  [SUBMIT]               │
│                         │
└─────────────────────────┘
```

### State 2: LOCKED (Waiting for Mentor)
```
┌─────────────────────────┐
│   INTERVENTION PENDING  │
├─────────────────────────┤
│                         │
│  ⏳ Analysis in Progress │
│                         │
│  Your stats suggest     │
│  you need a quick      │
│  intervention.         │
│                         │
│  🔄 Waiting for Mentor... │
│  (Mentor reviewing...) │
│                         │
│  Expires in: 11h 45m   │
│                         │
└─────────────────────────┘
```

### State 3: REMEDIAL (Task Assigned)
```
┌─────────────────────────┐
│   YOUR FOCUS TASK       │
├─────────────────────────┤
│                         │
│  📚 Task: Read Chapter 4 │
│  Functions & Scope     │
│                         │
│  Assigned by: John      │
│  Mentor                 │
│                         │
│  Progress:              │
│  📖 Reading...  50%     │
│                         │
│  [✓ Mark Complete]      │
│                         │
└─────────────────────────┘
```

---

## n8n Workflow Flow

```
┌─────────────────────────────────────────────────────┐
│  N8N INTERVENTION DISPATCHER WORKFLOW               │
├─────────────────────────────────────────────────────┤
│                                                     │
│  1. WEBHOOK TRIGGER                                │
│     └─ Receives: student_id, quiz_score,           │
│        focus_minutes, intervention_id              │
│                                                     │
│  2. FETCH STUDENT DATA                             │
│     └─ GET /api/student/:id from Backend           │
│                                                     │
│  3. SEND NOTIFICATION                              │
│     └─ Email/Slack to Mentor:                      │
│        "⚠️ Student John needs intervention"        │
│        Quiz: 4/10, Focus: 30min                    │
│        [APPROVE TASK] button (link)                │
│                                                     │
│  4. WAIT FOR APPROVAL                              │
│     └─ Pause execution (human-in-loop)             │
│     └─ Wait for webhook callback from              │
│        email link click                            │
│                                                     │
│  5. PROCESS MENTOR RESPONSE                        │
│     └─ Extract: task_assigned (e.g., "Read Ch 4")  │
│                                                     │
│  6. CALL BACKEND: /assign-intervention             │
│     └─ POST with remedial_task, intervention_id    │
│                                                     │
│  7. SUCCESS/FAILURE HANDLING                       │
│     └─ Log outcome                                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 🚀 Deployment Strategy

### Backend (Node.js)
- **Host**: Railway / Heroku / Render
- **Database**: Supabase (PostgreSQL)
- **Environment Variables**:
  ```
  DATABASE_URL=postgresql://...
  N8N_WEBHOOK_URL=https://n8n-instance.com/webhook
  JWT_SECRET=...
  NODE_ENV=production
  FRONTEND_URL=https://app.example.com
  ```

### Frontend (React)
- **Host**: Vercel / Netlify
- **Build**: `npm run build`
- **Environment Variables**:
  ```
  REACT_APP_API_URL=https://backend.example.com
  REACT_APP_SOCKET_URL=https://backend.example.com
  ```

### n8n
- **Option 1**: n8n Cloud (easiest for deployment)
- **Option 2**: Self-hosted on Railway/Render

---

## 🛡️ Fail-Safe Mechanism

### Problem
Student is locked but mentor doesn't respond for 12 hours → infinite lock

### Solution: Tiered Fail-Safe
```
Hour 0: Intervention created, status = 'pending'
Hour 6: Escalation warning sent (email/Slack to mentor)
Hour 12: 
  - IF still pending:
    - Set status = 'timed_out'
    - Unlock student (status = 'on_track')
    - Assign default task: "Review previous day's material"
    - Create mentor_action: "auto_escalated"

Hour 24: If still incomplete:
  - Escalate to Head Mentor
  - Send alert to admin dashboard
```

### Implementation
```sql
-- Trigger/Cron Job (runs every hour)
SELECT * FROM interventions 
WHERE status = 'pending' 
AND created_at < NOW() - INTERVAL '12 hours'
→ Run auto-unlock procedure
```

---

## ✨ Bonus Implementations

### 1. Tab Switch Detection (Cheater Detection)
- Use `document.visibilityState` API
- Detect tab blur → log as "focus interrupted"
- After 3 interruptions → auto-fail the session
- Send notification to mentor

### 2. Real-Time WebSockets (Socket.io)
- Student connects: `socket.on('connect')`
- When mentor approves: Backend emits `socket.emit('unlocked:state')`
- Student screen updates INSTANTLY without refresh
- No polling needed (more elegant UX)

---

## 📋 Folder Structure

```
Closed-Loop Intervention System/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js
│   │   │   └── socket.js
│   │   ├── controllers/
│   │   │   ├── studentController.js
│   │   │   ├── interventionController.js
│   │   │   └── mentorController.js
│   │   ├── models/
│   │   │   ├── Student.js
│   │   │   ├── DailyLog.js
│   │   │   ├── Intervention.js
│   │   │   └── MentorAction.js
│   │   ├── routes/
│   │   │   ├── studentRoutes.js
│   │   │   ├── interventionRoutes.js
│   │   │   └── webhookRoutes.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   └── validation.js
│   │   ├── utils/
│   │   │   ├── logger.js
│   │   │   ├── errorHandler.js
│   │   │   └── cronJobs.js
│   │   └── app.js
│   ├── migrations/
│   │   ├── 001_create_tables.sql
│   │   └── 002_add_indexes.sql
│   ├── package.json
│   ├── .env.example
│   └── server.js
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── FocusMode/
│   │   │   │   ├── NormalState.jsx
│   │   │   │   ├── LockedState.jsx
│   │   │   │   ├── RemadialState.jsx
│   │   │   │   └── FocusTimer.jsx
│   │   │   └── Common/
│   │   │       ├── Header.jsx
│   │   │       └── Loading.jsx
│   │   ├── context/
│   │   │   └── StudentContext.jsx
│   │   ├── hooks/
│   │   │   ├── useSocket.js
│   │   │   ├── useStudent.js
│   │   │   └── useVisibilityDetector.js
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   └── Login.jsx
│   │   ├── App.jsx
│   │   └── index.jsx
│   ├── package.json
│   └── .env.example
│
├── n8n-workflows/
│   ├── mentor-dispatcher.json
│   └── README.md
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API_REFERENCE.md
│   ├── DEPLOYMENT.md
│   └── FAIL_SAFE.md
│
├── .gitignore
├── README.md
└── PROJECT_ANALYSIS.md (THIS FILE)
```

---

## 📚 Tech Stack Summary

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Backend | Node.js + Express | REST API + WebSocket server |
| Database | PostgreSQL (Supabase) | Core data store |
| Frontend | React + Vite | Student interface |
| Real-time | Socket.io | Live state updates |
| Automation | n8n | Mentor workflow |
| Deployment | Railway + Vercel + n8n Cloud | Production hosting |
| State Mgmt | React Context | Client-side state |
| Monitoring | Winston/Pino | Logging |

---

## ⏱️ 48-Hour Timeline

### Day 1 (24 hours)
- ✅ Set up project structure
- ✅ Create database schema + Supabase setup
- ✅ Build backend APIs (/daily-checkin, /student/:id, /assign-intervention)
- ✅ Implement Socket.io connection
- ✅ Deploy backend (Railway)

### Day 2 (24 hours)
- ✅ Build React frontend (Normal, Locked, Remedial states)
- ✅ Integrate API calls + WebSocket
- ✅ Create n8n workflow
- ✅ Deploy frontend (Vercel)
- ✅ End-to-end testing + fixes
- ✅ Documentation + fail-safe mechanism

---

## 🎓 Key Insights (Product-First)

1. **State is Sacred**: The student's status drives the entire UX. One source of truth in the DB.
2. **Real-time > Polling**: WebSockets make the system feel alive; instant feedback builds trust.
3. **Human-in-the-Loop**: n8n's "wait" capability is the secret sauce. Mentors don't need to live on dashboards.
4. **Fail-Safe First**: 12-hour timeout isn't a bug; it's a feature that prevents system deadlock.
5. **Visibility**: Logging every action (student check-in, mentor approval, system auto-unlock) enables future analytics.

---

**Ready to build? Let's go step-by-step!** 🚀

