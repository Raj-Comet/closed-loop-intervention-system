# API Reference - Closed-Loop Intervention System

## Base URL

**Development**: `http://localhost:5000/api`  
**Production**: `https://your-backend.railway.app/api`

## Authentication

Currently no authentication required for MVP. Add JWT in production.

---

## Endpoints

### 1. Daily Check-In - POST `/daily-checkin`

**Purpose**: Student submits their daily performance

**Request**:
```bash
curl -X POST http://localhost:5000/api/daily-checkin \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "550e8400-e29b-41d4-a716-446655440000",
    "quiz_score": 4,
    "focus_minutes": 30
  }'
```

**Request Body**:
| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `student_id` | UUID | Yes | Must exist in students table |
| `quiz_score` | Integer | Yes | 0-10 |
| `focus_minutes` | Integer | Yes | >= 0 |

**Response - On Track (200 OK)**:
```json
{
  "status": "On Track",
  "message": "Great performance! Keep it up."
}
```

**Response - Needs Intervention (200 OK)**:
```json
{
  "status": "Pending Mentor Review",
  "intervention_id": "12345678-1234-1234-1234-123456789012",
  "message": "Your stats suggest you need a quick intervention. A mentor will review your case shortly.",
  "locked_until": "2025-11-24T22:00:00Z"
}
```

**Error Responses**:
```json
// Missing fields (400)
{
  "error": "Missing required fields"
}

// Invalid score (400)
{
  "error": "Quiz score must be between 0 and 10"
}

// Student not found (404)
{
  "error": "Student not found"
}
```

**Side Effects**:
- Logs check-in to `daily_logs` table
- If failing: Creates intervention, triggers n8n webhook, updates student status
- Emits WebSocket event to student's socket

**Business Logic**:
```javascript
if (quiz_score >= 7 AND focus_minutes >= 60) {
  // On Track
  student.status = 'on_track'
  return "On Track"
} else {
  // Needs Intervention
  intervention = create(student_id, pending)
  student.status = 'needs_intervention'
  student.current_intervention_id = intervention.id
  trigger_n8n_webhook(intervention)
  emit_websocket('state:changed', { status: 'locked' })
  return "Pending Mentor Review"
}
```

---

### 2. Get Student State - GET `/student/:id`

**Purpose**: Fetch current student status and any active intervention

**Request**:
```bash
curl http://localhost:5000/api/student/550e8400-e29b-41d4-a716-446655440000
```

**URL Parameters**:
| Param | Type | Required |
|-------|------|----------|
| `id` | UUID | Yes |

**Response (200 OK)**:
```json
{
  "student_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "John Doe",
  "email": "john@example.com",
  "status": "needs_intervention",
  "intervention": {
    "id": "12345678-1234-1234-1234-123456789012",
    "student_id": "550e8400-e29b-41d4-a716-446655440000",
    "triggered_at": "2025-11-24T10:00:00Z",
    "status": "pending",
    "remedial_task": null,
    "expires_at": "2025-11-24T22:00:00Z",
    "approved_at": null,
    "completed_at": null
  },
  "last_log": {
    "id": "log-uuid",
    "quiz_score": 4,
    "focus_minutes": 30,
    "created_at": "2025-11-24T10:00:00Z"
  },
  "updated_at": "2025-11-24T10:00:00Z"
}
```

**Response - No Active Intervention (200 OK)**:
```json
{
  "student_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "John Doe",
  "email": "john@example.com",
  "status": "on_track",
  "intervention": null,
  "last_log": {
    "id": "log-uuid",
    "quiz_score": 8,
    "focus_minutes": 75,
    "created_at": "2025-11-24T09:00:00Z"
  },
  "updated_at": "2025-11-24T09:00:00Z"
}
```

**Error Responses**:
```json
// Student not found (404)
{
  "error": "Student not found"
}
```

**Status Values**:
- `on_track`: Student is performing well
- `needs_intervention`: Intervention pending mentor review
- `in_remedial`: Mentor approved task, student working on it

---

### 3. Assign Intervention - POST `/assign-intervention`

**Purpose**: Mentor (via n8n) approves and assigns a remedial task to student

**Called By**: n8n workflow after mentor approval

**Request**:
```bash
curl -X POST http://localhost:5000/api/assign-intervention \
  -H "Content-Type: application/json" \
  -d '{
    "intervention_id": "12345678-1234-1234-1234-123456789012",
    "remedial_task": "Read Chapter 4: Functions & Scope",
    "mentor_id": "mentor@example.com",
    "n8n_execution_id": "exec-12345"
  }'
```

**Request Body**:
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `intervention_id` | UUID | Yes | Must exist, status = pending |
| `remedial_task` | String | Yes | Task description for student |
| `mentor_id` | String | Yes | Mentor identifier |
| `n8n_execution_id` | String | No | n8n execution ID for tracking |

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Intervention assigned successfully",
  "intervention": {
    "id": "12345678-1234-1234-1234-123456789012",
    "student_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "approved",
    "remedial_task": "Read Chapter 4: Functions & Scope",
    "mentor_id": "mentor@example.com",
    "n8n_execution_id": "exec-12345",
    "approved_at": "2025-11-24T10:30:00Z"
  },
  "student_status": "in_remedial"
}
```

**Error Responses**:
```json
// Missing fields (400)
{
  "error": "Missing required fields: intervention_id, remedial_task"
}

// Intervention not found (404)
{
  "error": "Intervention not found"
}

// Intervention not pending (400)
{
  "error": "Intervention is not in pending status"
}
```

**Side Effects**:
- Updates intervention: status = "approved", remedial_task set, approved_at = NOW()
- Updates student: status = "in_remedial"
- Logs mentor action to `mentor_actions` table
- **Emits WebSocket event to student** (REAL-TIME UNLOCK):
  ```javascript
  socket.emit('state:changed', {
    status: 'in_remedial',
    message: 'Your mentor has assigned a task for you.',
    remedial_task: 'Read Chapter 4: Functions & Scope'
  })
  ```

---

### 4. Complete Remedial Task - POST `/complete-remedial`

**Purpose**: Student marks remedial task as complete, returns to normal

**Request**:
```bash
curl -X POST http://localhost:5000/api/complete-remedial \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "550e8400-e29b-41d4-a716-446655440000",
    "intervention_id": "12345678-1234-1234-1234-123456789012"
  }'
```

**Request Body**:
| Field | Type | Required |
|-------|------|----------|
| `student_id` | UUID | Yes |
| `intervention_id` | UUID | Yes |

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Remedial task marked as complete",
  "student_status": "on_track"
}
```

**Error Responses**:
```json
// Missing fields (400)
{
  "error": "Missing required fields: student_id, intervention_id"
}

// Intervention not found (404)
{
  "error": "Intervention not found"
}

// Unauthorized (403)
{
  "error": "Unauthorized"
}
```

**Side Effects**:
- Updates intervention: status = "completed", completed_at = NOW()
- Updates student: status = "on_track", current_intervention_id = NULL
- Logs mentor action as "completed"
- Emits WebSocket event:
  ```javascript
  socket.emit('state:changed', {
    status: 'on_track',
    message: 'Great! You\'ve completed the remedial task. You\'re back on track!'
  })
  ```

---

### 5. Get Intervention Details - GET `/intervention/:id`

**Purpose**: Fetch details about a specific intervention

**Request**:
```bash
curl http://localhost:5000/api/intervention/12345678-1234-1234-1234-123456789012
```

**Response (200 OK)**:
```json
{
  "intervention": {
    "id": "12345678-1234-1234-1234-123456789012",
    "student_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "approved",
    "remedial_task": "Read Chapter 4: Functions & Scope",
    "triggered_at": "2025-11-24T10:00:00Z",
    "approved_at": "2025-11-24T10:30:00Z",
    "completed_at": null,
    "expires_at": "2025-11-24T22:00:00Z"
  },
  "mentor_actions": [
    {
      "id": "action-uuid-1",
      "intervention_id": "12345678-1234-1234-1234-123456789012",
      "action": "assigned_task",
      "task_assigned": "Read Chapter 4: Functions & Scope",
      "created_at": "2025-11-24T10:30:00Z"
    }
  ]
}
```

---

### 6. Health Check - GET `/health`

**Purpose**: Verify backend is running

**Request**:
```bash
curl http://localhost:5000/health
```

**Response (200 OK)**:
```json
{
  "status": "OK",
  "timestamp": "2025-11-24T10:30:00Z"
}
```

---

## WebSocket Events

### Connection

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

socket.on('connect', () => {
  console.log('Connected to server');
  
  // Register student
  socket.emit('student:register', 'student-uuid');
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});
```

### State Change Events

**Event Name**: `state:changed`

**Payload - Locked**:
```json
{
  "status": "locked",
  "message": "Analysis in progress. Waiting for Mentor...",
  "intervention_id": "12345678-1234-1234-1234-123456789012",
  "expires_at": "2025-11-24T22:00:00Z"
}
```

**Payload - In Remedial**:
```json
{
  "status": "in_remedial",
  "message": "Your mentor has assigned a task for you.",
  "intervention_id": "12345678-1234-1234-1234-123456789012",
  "remedial_task": "Read Chapter 4: Functions & Scope"
}
```

**Payload - On Track**:
```json
{
  "status": "on_track",
  "message": "Great job! You're on track."
}
```

**Listening Example**:
```javascript
socket.on('state:changed', (data) => {
  console.log(`Student state: ${data.status}`);
  console.log(`Message: ${data.message}`);
  
  // Update UI based on status
  if (data.status === 'locked') {
    showLockedUI();
  } else if (data.status === 'in_remedial') {
    showRemedialUI(data.remedial_task);
  } else if (data.status === 'on_track') {
    showNormalUI();
  }
});
```

---

## Response Status Codes

| Code | Meaning | Typical Use |
|------|---------|------------|
| 200 | OK | Successful API call |
| 400 | Bad Request | Invalid input, missing fields |
| 403 | Forbidden | Authorization failure |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Backend error, check logs |

---

## Rate Limiting

None implemented for MVP. Add in production:
- 100 requests/minute per student_id
- 1000 requests/minute per IP

---

## Example: Complete Flow

### Step 1: Student Submits Failed Check-In

```bash
curl -X POST http://localhost:5000/api/daily-checkin \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "550e8400-e29b-41d4-a716-446655440000",
    "quiz_score": 4,
    "focus_minutes": 30
  }'
```

**Response**:
```json
{
  "status": "Pending Mentor Review",
  "intervention_id": "int-uuid-123",
  "locked_until": "2025-11-24T22:00:00Z"
}
```

### Step 2: Frontend Receives WebSocket Event

```javascript
socket.on('state:changed', (data) => {
  // data.status = 'locked'
  // data.intervention_id = 'int-uuid-123'
  // Show locked UI immediately
});
```

### Step 3: n8n Sends Email to Mentor

(Happens automatically after webhook trigger)

### Step 4: Mentor Clicks Approval Link

(n8n waits for this)

### Step 5: n8n POSTs to Backend

```bash
curl -X POST http://localhost:5000/api/assign-intervention \
  -H "Content-Type: application/json" \
  -d '{
    "intervention_id": "int-uuid-123",
    "remedial_task": "Read Chapter 4",
    "mentor_id": "mentor@example.com",
    "n8n_execution_id": "exec-12345"
  }'
```

### Step 6: Frontend Receives Unlock WebSocket Event

```javascript
socket.on('state:changed', (data) => {
  // data.status = 'in_remedial'
  // data.remedial_task = 'Read Chapter 4'
  // Show remedial UI immediately
});
```

### Step 7: Student Completes Task

```bash
curl -X POST http://localhost:5000/api/complete-remedial \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "550e8400-e29b-41d4-a716-446655440000",
    "intervention_id": "int-uuid-123"
  }'
```

### Step 8: Frontend Back to Normal

```javascript
socket.on('state:changed', (data) => {
  // data.status = 'on_track'
  // Show normal UI
});
```

---

## Testing with Postman

### Setup

1. Download Postman
2. Create new collection: "Closed-Loop API"
3. Set variable `{{base_url}}` = `http://localhost:5000/api`
4. Set variable `{{student_id}}` = `550e8400-e29b-41d4-a716-446655440000`

### Requests

**1. POST Daily Checkin (Pass)**
- Method: POST
- URL: `{{base_url}}/daily-checkin`
- Body:
  ```json
  {
    "student_id": "{{student_id}}",
    "quiz_score": 8,
    "focus_minutes": 75
  }
  ```

**2. POST Daily Checkin (Fail)**
- Method: POST
- URL: `{{base_url}}/daily-checkin`
- Body:
  ```json
  {
    "student_id": "{{student_id}}",
    "quiz_score": 4,
    "focus_minutes": 30
  }
  ```

**3. GET Student State**
- Method: GET
- URL: `{{base_url}}/student/{{student_id}}`

**4. POST Assign Intervention**
- Method: POST
- URL: `{{base_url}}/assign-intervention`
- Body:
  ```json
  {
    "intervention_id": "int-uuid-from-step-2",
    "remedial_task": "Read Chapter 4",
    "mentor_id": "mentor@example.com"
  }
  ```

**5. POST Complete Remedial**
- Method: POST
- URL: `{{base_url}}/complete-remedial`
- Body:
  ```json
  {
    "student_id": "{{student_id}}",
    "intervention_id": "int-uuid-from-step-2"
  }
  ```

---

**Last Updated**: November 24, 2025

