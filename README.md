# Closed-Loop Intervention System - Complete Guide

**Author**: [@Raj-Comet](https://github.com/Raj-Comet)  
**Repository**: https://github.com/Raj-Comet/closed-loop-intervention-system

> Building a **Product-First Engineering** solution that detects student struggles in real-time and automates intelligent mentorship.

## 📖 Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture](#architecture)
3. [Component Details](#component-details)
4. [Deployment](#deployment)
5. [Testing](#testing)
6. [Fail-Safe Mechanism](#fail-safe-mechanism)
7. [Bonus Features](#bonus-features)
8. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### Prerequisites

- Node.js 16+
- PostgreSQL/Supabase account
- n8n account (Cloud or self-hosted)
- Git

### 1. Database Setup

1. Go to [Supabase](https://supabase.com) or set up PostgreSQL locally
2. Copy the SQL from `backend/migrations/001_create_tables.sql`
3. Execute in your database
4. Note the connection string

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your values:
# DATABASE_URL=postgresql://...
# N8N_WEBHOOK_URL=https://n8n-instance.com/webhook/intervention-trigger
# FRONTEND_URL=http://localhost:3000

npm install
npm run dev
# Server runs on http://localhost:5000
```

### 3. Frontend Setup

```bash
cd frontend
cp .env.example .env
# Edit .env with:
# VITE_API_URL=http://localhost:5000/api
# VITE_SOCKET_URL=http://localhost:5000

npm install
npm run dev
# App runs on http://localhost:3000
```

### 4. n8n Workflow Setup

1. Go to n8n Cloud (https://n8n.cloud) or self-hosted instance
2. Import `n8n-workflows/mentor-dispatcher.json`
3. Configure environment variables in n8n
4. Activate the workflow
5. Copy the webhook URL to backend `.env` as `N8N_WEBHOOK_URL`

### 5. Test the System

```bash
# In a browser, visit:
http://localhost:3000?student_id=<any-uuid>

# Or test the API directly:
curl -X POST http://localhost:5000/api/daily-checkin \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "550e8400-e29b-41d4-a716-446655440000",
    "quiz_score": 4,
    "focus_minutes": 30
  }'
```

---

## 🏗️ Architecture

### System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                   CLOSED-LOOP SYSTEM                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  STUDENT (Web App)                                         │
│  ├─ Normal: Start Timer + Quiz                            │
│  ├─ Locked: Waiting for Mentor...                         │
│  └─ Remedial: Complete Task → Unlock                      │
│                                                             │
│  ↓ (HTTP + WebSocket)                                     │
│                                                             │
│  BACKEND (Node.js + Express)                              │
│  ├─ POST /api/daily-checkin                              │
│  ├─ GET /api/student/:id                                 │
│  ├─ POST /api/assign-intervention                        │
│  ├─ WebSocket: Real-time state updates                  │
│  └─ Cron Jobs: Fail-safe timeout handling               │
│                                                             │
│  ↓ (Webhook Trigger)                                     │
│                                                             │
│  DATABASE (PostgreSQL)                                    │
│  ├─ students                                              │
│  ├─ daily_logs                                            │
│  ├─ interventions                                         │
│  └─ mentor_actions                                        │
│                                                             │
│  ↓ (Webhook)                                             │
│                                                             │
│  N8N WORKFLOW                                             │
│  ├─ Receive intervention trigger                         │
│  ├─ Send email to mentor                                 │
│  ├─ Wait for mentor approval                             │
│  ├─ POST back to /assign-intervention                   │
│  └─ Notify in Slack                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
1. Student submits check-in (quiz: 4, focus: 30)
   ↓
2. Backend checks: quiz >= 7 AND focus >= 60?
   ↓
   NO → Create intervention (pending status)
   ↓
3. Trigger n8n webhook with student details
   ↓
4. n8n sends email to mentor: "Student John needs help"
   ↓
5. Mentor clicks email link
   ↓
6. n8n workflow resumes and POSTs to /assign-intervention
   ↓
7. Backend updates intervention (approved), sends WebSocket event
   ↓
8. Student's app receives event, state changes to "in_remedial"
   ↓
9. Student completes task, clicks "Mark Complete"
   ↓
10. Backend completes intervention, state → "on_track"
```

---

## 📋 Component Details

### Backend API Reference

#### POST /api/daily-checkin
**Submits student's daily performance**

```json
REQUEST:
{
  "student_id": "550e8400-e29b-41d4-a716-446655440000",
  "quiz_score": 4,
  "focus_minutes": 30
}

RESPONSE (On Track):
{
  "status": "On Track",
  "message": "Great performance! Keep it up."
}

RESPONSE (Needs Intervention):
{
  "status": "Pending Mentor Review",
  "intervention_id": "intervention-uuid",
  "message": "Your stats suggest you need a quick intervention...",
  "locked_until": "2025-11-24T22:00:00Z"
}
```

**Logic**:
- If `quiz_score >= 7` AND `focus_minutes >= 60` → "On Track"
- Otherwise → Trigger intervention, emit WebSocket event, lock the app

---

#### GET /api/student/:id
**Fetches current student state**

```json
REQUEST:
GET /api/student/550e8400-e29b-41d4-a716-446655440000

RESPONSE:
{
  "student_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "John Doe",
  "email": "john@example.com",
  "status": "needs_intervention",
  "intervention": {
    "id": "int-uuid",
    "status": "pending",
    "created_at": "2025-11-24T10:00:00Z",
    "expires_at": "2025-11-24T22:00:00Z"
  },
  "last_log": {
    "quiz_score": 4,
    "focus_minutes": 30
  }
}
```

---

#### POST /api/assign-intervention
**Called by n8n to assign remedial task to student** *(Mentor approval → Student unlock)*

```json
REQUEST:
{
  "intervention_id": "int-uuid",
  "remedial_task": "Read Chapter 4: Functions & Scope",
  "mentor_id": "mentor@system",
  "n8n_execution_id": "exec-12345"
}

RESPONSE:
{
  "success": true,
  "message": "Intervention assigned successfully",
  "intervention": {
    "id": "int-uuid",
    "status": "approved",
    "remedial_task": "Read Chapter 4: Functions & Scope",
    "approved_at": "2025-11-24T10:30:00Z"
  }
}
```

**Side Effects**:
- Updates student status to `in_remedial`
- Emits WebSocket event to student's app (real-time unlock)
- Logs mentor action

---

#### POST /api/complete-remedial
**Student marks remedial task as complete**

```json
REQUEST:
{
  "student_id": "student-uuid",
  "intervention_id": "int-uuid"
}

RESPONSE:
{
  "success": true,
  "message": "Remedial task marked as complete",
  "student_status": "on_track"
}
```

---

### WebSocket Events

**Connection**:
```javascript
// Client connects and registers
socket.emit('student:register', studentId);
```

**State Changes**:
```javascript
// Listen for state changes
socket.on('state:changed', (data) => {
  // data.status: 'on_track', 'locked', 'in_remedial'
  // data.message: Human-readable message
  // data.remedial_task: (if in_remedial)
});

// Example payloads:

// Locked state
{
  "status": "locked",
  "message": "Analysis in progress. Waiting for Mentor...",
  "intervention_id": "uuid",
  "expires_at": "2025-11-24T22:00:00Z"
}

// Unlocked with task
{
  "status": "in_remedial",
  "message": "Your mentor has assigned a task for you.",
  "remedial_task": "Read Chapter 4: Functions & Scope"
}

// Back to normal
{
  "status": "on_track",
  "message": "Great! You've completed the remedial task. You're back on track!"
}
```

---

### Database Schema

#### students
```sql
id (UUID, PRIMARY KEY)
email (VARCHAR, UNIQUE)
name (VARCHAR)
status (ENUM: 'on_track', 'needs_intervention', 'in_remedial')
current_intervention_id (UUID, FK to interventions)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

#### daily_logs
```sql
id (UUID, PRIMARY KEY)
student_id (UUID, FK)
quiz_score (INTEGER, 0-10)
focus_minutes (INTEGER)
created_at (TIMESTAMP)
```

#### interventions
```sql
id (UUID, PRIMARY KEY)
student_id (UUID, FK)
triggered_at (TIMESTAMP)
status (ENUM: 'pending', 'approved', 'completed', 'failed', 'timed_out')
remedial_task (TEXT)
n8n_execution_id (VARCHAR)
mentor_id (VARCHAR)
approved_at (TIMESTAMP, nullable)
completed_at (TIMESTAMP, nullable)
expires_at (TIMESTAMP) ← KEY for fail-safe
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

#### mentor_actions
```sql
id (UUID, PRIMARY KEY)
intervention_id (UUID, FK)
action (ENUM: 'approved', 'assigned_task', 'auto_escalated', 'timeout_unlocked')
task_assigned (TEXT)
created_at (TIMESTAMP)
```

---

### Frontend States

#### Normal State
- **When**: Student is on track
- **UI**: 
  - Timer display
  - Quiz score input
  - Submit button
  - Info: "You're On Track!"
- **User Action**: Can submit new check-in

#### Locked State
- **When**: Student submitted bad scores (intervention pending)
- **UI**:
  - Large hourglass icon with pulse animation
  - "Analysis in progress. Waiting for Mentor..."
  - Display of quiz score (4/10) and focus time (30min)
  - Countdown timer showing time until auto-unlock (12 hours)
  - Disabled input
- **User Action**: Cannot interact; can only wait or refresh

#### Remedial State
- **When**: Mentor has approved and assigned task
- **UI**:
  - Task card showing remedial task text
  - "Assigned by Mentor"
  - Progress bar (50%)
  - Instructions list
  - "✓ Mark Complete" button
- **User Action**: Study the material, then mark complete

---

## 🚀 Deployment

### Option 1: Fast Deployment (Recommended for 48-hour challenge)

#### Backend → Railway.app
```bash
# 1. Create Railway account
# 2. Connect GitHub repo
# 3. Create PostgreSQL plugin
# 4. Deploy with env vars:
DATABASE_URL=postgresql://...
N8N_WEBHOOK_URL=https://n8n.example.com/webhook
FRONTEND_URL=https://your-frontend.vercel.app
```

#### Frontend → Vercel
```bash
# 1. Create Vercel account
# 2. Import GitHub repo
# 3. Set env vars:
VITE_API_URL=https://your-backend-railway.app/api
VITE_SOCKET_URL=https://your-backend-railway.app

# 4. Deploy (automatic on push)
```

#### n8n → n8n Cloud
```
1. Go to n8n.cloud
2. Create account
3. Create new workflow
4. Import mentor-dispatcher.json
5. Configure environment variables
6. Activate workflow
```

### Option 2: Self-Hosted

#### Backend (Docker)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

#### Deploy on Render/Fly.io
- Connect GitHub repo
- Select Docker deployment
- Set environment variables
- Deploy

---

## 🧪 Testing

### Unit Test - Daily Checkin Logic

```javascript
// Test: Quiz >= 7 AND Focus >= 60 → On Track
const result = await handleDailyCheckin({
  body: {
    student_id: "uuid",
    quiz_score: 8,
    focus_minutes: 75
  }
});
expect(result.status).toBe("On Track");

// Test: Quiz < 7 → Intervention
const result = await handleDailyCheckin({
  body: {
    student_id: "uuid",
    quiz_score: 4,
    focus_minutes: 30
  }
});
expect(result.status).toBe("Pending Mentor Review");
```

### E2E Test Flow

```bash
# 1. Get student ID
STUDENT_ID="550e8400-e29b-41d4-a716-446655440000"

# 2. Submit failed check-in
curl -X POST http://localhost:5000/api/daily-checkin \
  -H "Content-Type: application/json" \
  -d "{\"student_id\": \"$STUDENT_ID\", \"quiz_score\": 4, \"focus_minutes\": 30}"

# 3. Verify student is locked
curl http://localhost:5000/api/student/$STUDENT_ID

# 4. Manually call assign-intervention (simulate n8n)
curl -X POST http://localhost:5000/api/assign-intervention \
  -H "Content-Type: application/json" \
  -d "{\"intervention_id\": \"<intervention-id>\", \"remedial_task\": \"Read Chapter 4\", \"mentor_id\": \"mentor@example.com\"}"

# 5. Verify student unlocked
curl http://localhost:5000/api/student/$STUDENT_ID

# 6. Complete remedial
curl -X POST http://localhost:5000/api/complete-remedial \
  -H "Content-Type: application/json" \
  -d "{\"student_id\": \"$STUDENT_ID\", \"intervention_id\": \"<intervention-id>\"}"

# 7. Verify back to normal
curl http://localhost:5000/api/student/$STUDENT_ID
```

### Browser Test

1. Open `http://localhost:3000?student_id=550e8400-e29b-41d4-a716-446655440000`
2. Start focus timer for 30 seconds
3. Enter quiz score 4
4. Click "SUBMIT CHECK-IN"
5. Verify "Locked" state appears
6. Manually trigger `/api/assign-intervention` via Postman
7. Verify state changes to "Remedial" in real-time (WebSocket)
8. Click "Mark Complete"
9. Verify returns to "Normal" state

---

## 🛡️ Fail-Safe Mechanism

### Problem
Student is locked but mentor doesn't respond for 12 hours → infinite lock

### Solution: Tiered Fail-Safe

**Timeline**:
```
T+0:    Intervention created (pending)
        Student locked, timer starts

T+6h:   Email reminder sent to mentor
        (Optional escalation warning)

T+12h:  IF still pending:
        1. Set status = "timed_out"
        2. Unlock student (status = "on_track")
        3. Assign default task: "Review previous day's material"
        4. Log as "auto_escalated"
        5. Notify admin/head mentor
```

### Implementation

**Cron Job** (runs every hour):
```javascript
// File: backend/src/utils/cronJobs.js

export const startTimeoutCheckJob = () => {
  cron.schedule('0 * * * *', async () => {
    const timedOut = await Intervention.getPendingForTimeout();
    
    for (const intervention of timedOut) {
      // Update status
      await Intervention.updateStatus(intervention.id, 'timed_out');
      
      // Unlock student
      await Student.updateStatus(intervention.student_id, 'on_track');
      await Student.setCurrentIntervention(intervention.student_id, null);
      
      // Log action
      await MentorAction.create(
        intervention.id,
        'auto_escalated',
        'System auto-unlocked due to 12-hour timeout'
      );
      
      // Notify student via WebSocket
      emitToStudent(intervention.student_id, 'state:changed', {
        status: 'on_track',
        message: 'Your intervention has been auto-resolved.',
        reason: 'mentor_timeout'
      });
    }
  });
};
```

**Database Query** (SQL):
```sql
-- Find interventions that have timed out (12 hours with no response)
SELECT * FROM interventions 
WHERE status = 'pending' 
AND created_at < NOW() - INTERVAL '12 hours'
AND updated_at < NOW() - INTERVAL '12 hours';

-- For each one, execute:
UPDATE interventions 
SET status = 'timed_out', updated_at = NOW() 
WHERE id = $1;

UPDATE students 
SET status = 'on_track', current_intervention_id = NULL, updated_at = NOW() 
WHERE id = $2;

INSERT INTO mentor_actions (id, intervention_id, action, created_at)
VALUES (uuid_generate_v4(), $3, 'auto_escalated', NOW());
```

### Benefits
- ✅ No students stuck indefinitely
- ✅ Automatic recovery prevents system deadlock
- ✅ Audit trail (logged as "auto_escalated")
- ✅ Can escalate to admin/head mentor
- ✅ Students get a default remedial task

---

## ✨ Bonus Features

### 1. Tab Switch Detection (Cheater Detection)

**How it works**:
```javascript
// File: frontend/src/hooks/useVisibilityDetector.js

export const useVisibilityDetector = (onHidden) => {
  const [blurCount, setBlurCount] = useState(0);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab hidden
        setBlurCount(prev => {
          if (prev + 1 >= 3) {
            onHidden(); // Trigger penalty
          }
          return prev + 1;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [onHidden]);

  return { blurCount };
};
```

**Behavior**:
- 1st tab switch: Warning notification
- 2nd tab switch: Warning intensifies
- 3rd tab switch: Session auto-fails
  - Log as "focus_interrupted"
  - Trigger intervention (even if scores were good)
  - Mentor sees: "Student session was interrupted 3+ times"

**UI Component**:
```jsx
const { blurCount } = useVisibilityDetector(() => {
  // Auto-fail the session
  handleFailSession();
});

// Show warning if blur count > 0
{blurCount > 0 && (
  <div className="blur-warning">
    ⚠️ Tab switch detected! Count: {blurCount}/3
  </div>
)}
```

---

### 2. Real-Time WebSockets (Socket.io)

**Current Flow** (Polling):
```
1. Student submits check-in
2. Backend processes, stores intervention
3. n8n sends email (takes 1-5 minutes)
4. Mentor clicks link (may take 10+ minutes)
5. Backend updates intervention
6. Student's app polls every 5 seconds
7. Eventually student sees unlock (after next poll)
```

**With WebSockets** (Real-Time):
```
1. Student submits check-in
2. Backend processes, stores intervention
3. Backend emits: socket.emit('locked', studentId)
4. Student's app INSTANTLY receives event and updates UI
5. (same for unlock)
```

**Backend Implementation**:
```javascript
// File: backend/src/config/socket.js

export const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL,
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    socket.on('student:register', (studentId) => {
      socket.join(`student:${studentId}`);
      // Now we can emit to this specific student
    });
  });

  return io;
};

// Emit to specific student:
export const emitToStudent = (studentId, event, data) => {
  io.to(`student:${studentId}`).emit(event, data);
};
```

**When Mentor Approves** (in assignIntervention):
```javascript
// This makes the unlock INSTANT
emitToStudent(intervention.student_id, 'state:changed', {
  status: 'in_remedial',
  message: 'Your mentor has assigned a task for you.',
  remedial_task: 'Read Chapter 4'
});
```

**Frontend Listening**:
```javascript
// File: frontend/src/context/StudentContext.jsx

const newSocket = io(SOCKET_URL);

newSocket.on('state:changed', (data) => {
  // This triggers INSTANTLY when backend emits
  setStatus(data.status);
  setIntervention(data.intervention_id);
  // UI updates without waiting for next poll
});
```

**Benefits**:
- ✅ No lag (instant feedback)
- ✅ Better UX (feels like magic)
- ✅ Fewer database queries (no constant polling)
- ✅ Scalable (one connection per student)
- ✅ Professional feel

**Performance Comparison**:

| Metric | Polling | WebSocket |
|--------|---------|-----------|
| Unlock latency | 2.5s avg (5s poll interval) | <100ms |
| DB queries | ~12/min per student | ~0 |
| Bandwidth | Higher | Lower |
| Complexity | Simple | Moderate |
| UX Feel | Delays feel | Instant, magic |

---

## 🔧 Troubleshooting

### Issue: Student not locked after bad score

**Check**:
1. Verify POST `/daily-checkin` succeeded (HTTP 200)
2. Check database: `SELECT * FROM interventions WHERE student_id = '...'`
3. Check frontend console for errors
4. Verify WebSocket connection: Open DevTools → Network → WS

**Solution**:
```javascript
// If no intervention created, check your thresholds:
const PASS_THRESHOLD_QUIZ = 7;
const PASS_THRESHOLD_FOCUS = 60;

// If score is 7 and focus is 60, student passes. Change these if needed.
```

---

### Issue: Mentor approval not unlocking student

**Check**:
1. Verify n8n workflow triggered (check n8n logs)
2. Verify POST to `/api/assign-intervention` succeeded (HTTP 200)
3. Check database: `SELECT * FROM interventions WHERE id = '...'`
4. Check WebSocket: Is `emitToStudent` being called?

**Solution**:
```bash
# Test the endpoint manually:
curl -X POST http://localhost:5000/api/assign-intervention \
  -H "Content-Type: application/json" \
  -d '{
    "intervention_id": "your-intervention-id",
    "remedial_task": "Test task",
    "mentor_id": "test@mentor.com"
  }'
```

---

### Issue: WebSocket not connecting

**Check**:
1. Backend running on correct port
2. Frontend SOCKET_URL correct in `.env`
3. CORS enabled in Socket.io config

**Solution**:
```javascript
// In backend/src/config/socket.js, ensure:
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// In browser console, test:
const socket = io('http://localhost:5000');
socket.on('connect', () => console.log('Connected!'));
```

---

### Issue: n8n webhook not triggering

**Check**:
1. Verify webhook URL in backend `.env`
2. Check n8n logs for incoming requests
3. Verify student actually failed (quiz < 7 OR focus < 60)

**Solution**:
```bash
# Test webhook manually:
curl -X POST https://your-n8n-webhook-url \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "test-uuid",
    "intervention_id": "test-intervention",
    "quiz_score": 4,
    "focus_minutes": 30,
    "student_name": "Test",
    "student_email": "test@example.com"
  }'
```

---

## 📚 Additional Resources

### Recommended Reading
- [Express.js Documentation](https://expressjs.com/)
- [Socket.io Guide](https://socket.io/docs/v4/socket-io-protocol/)
- [PostgreSQL JSON Functions](https://www.postgresql.org/docs/current/functions-json.html)
- [n8n Workflow Documentation](https://docs.n8n.io/)
- [React Hooks Guide](https://react.dev/reference/react)

### Tools for Testing
- **Postman**: Test API endpoints
- **DBeaver**: View/edit database
- **Vite DevTools**: Debug React components
- **n8n UI**: Test workflows visually

---

## 📝 License

MIT - Use freely for educational purposes

---

**Built with ❤️ for Alcovia**

