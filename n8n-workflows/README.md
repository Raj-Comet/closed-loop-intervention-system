# n8n Workflow: Mentor Intervention Dispatcher

## Overview
This n8n workflow automates the "human-in-the-loop" process. When a student fails a check-in, the workflow:
1. Receives the trigger from the backend
2. Fetches the student's details
3. Sends a notification to the mentor with the student's stats
4. **Waits** for the mentor's approval (human decision point)
5. Once approved, calls the backend to assign the remedial task
6. Notifies relevant parties (Slack)

## Workflow Steps

### 1. Webhook Trigger
- **Type**: Webhook
- **Endpoint**: `/webhook/intervention-trigger`
- **Method**: POST
- **Receives**:
  ```json
  {
    "student_id": "uuid",
    "intervention_id": "uuid",
    "quiz_score": 4,
    "focus_minutes": 30,
    "student_name": "John Doe",
    "student_email": "john@example.com"
  }
  ```

### 2. Fetch Student Data
- **Type**: HTTP Request
- **Method**: GET
- **URL**: `https://backend.example.com/api/student/{student_id}`
- **Purpose**: Get latest student information

### 3. Send Email Notification
- **Type**: Email Send
- **To**: Mentor's email (from environment)
- **Subject**: "⚠️ Student Intervention Required: [Student Name]"
- **Content**: 
  - Student name, email
  - Quiz score and focus time
  - **Approval Link**: Click to approve and assign task
  
**Example Email**:
```
⚠️ Student Intervention Alert

Student: John Doe
Email: john@example.com
Quiz Score: 4/10
Focus Time: 30 minutes

This student's performance indicates they need intervention.

[APPROVE & ASSIGN TASK] ← Click this link
```

### 4. Wait for Approval
- **Type**: Wait Node
- **Function**: Pauses execution
- **Waiting For**: Mentor to click the email link or respond to workflow
- **Timeout**: Can be configured (e.g., 12 hours as per fail-safe)

**Alternative**: Use Slack interaction instead of email link:
- Send interactive Slack message with buttons
- Mentor clicks button directly in Slack
- n8n resumes from the button click

### 5. Call Backend - Assign Intervention
- **Type**: HTTP Request
- **Method**: POST
- **URL**: `https://backend.example.com/api/assign-intervention`
- **Headers**: `Content-Type: application/json`
- **Payload**:
  ```json
  {
    "intervention_id": "uuid",
    "remedial_task": "Read Chapter 4: Functions",
    "mentor_id": "mentor@system",
    "n8n_execution_id": "execution123"
  }
  ```
- **Response Expected**:
  ```json
  {
    "success": true,
    "message": "Intervention assigned successfully",
    "student_status": "in_remedial"
  }
  ```

### 6. Slack Notification (Optional)
- **Type**: HTTP Request to Slack Webhook
- **Purpose**: Notify in Slack that task was assigned
- **Message**: Confirmation that student received their remedial task

---

## Setup Instructions

### In n8n Cloud:

1. **Create a new workflow**
   - Click "New Workflow"
   - Name it "Mentor Intervention Dispatcher"

2. **Add Webhook Node**
   - Add → Search "Webhook"
   - Set method to POST
   - Copy the webhook URL

3. **Update Backend**
   - Set `N8N_WEBHOOK_URL` in backend `.env` to the webhook URL from step 2

4. **Add HTTP Request - Fetch Student**
   - Add node → HTTP Request
   - GET request to `{{ $env.BACKEND_URL }}/api/student/{{ $json.student_id }}`

5. **Add Email Send Node**
   - Add node → Email Send
   - Configure with mentor's email
   - Use template from step 3 above
   - Enable the workflow to receive webhook responses

6. **Add Wait Node**
   - Add node → Wait
   - Set to wait for webhook callback or interaction

7. **Add HTTP Request - Assign Intervention**
   - POST to `{{ $env.BACKEND_URL }}/api/assign-intervention`
   - Body as shown in step 5 above

8. **Add Slack Node (Optional)**
   - Add node → Slack
   - Send success notification

### Environment Variables (n8n)

Set these in n8n Settings → Variables:

```
BACKEND_URL = https://your-backend.example.com
MENTOR_EMAIL = mentor@yourcompany.com
MENTOR_ID = mentor-uuid-or-email
SLACK_WEBHOOK_URL = https://hooks.slack.com/services/YOUR/WEBHOOK/URL
APPROVAL_LINK = https://your-app.example.com/mentor/approve
```

### Testing the Workflow

1. **Trigger manually**:
   - Click "Test" button
   - Provide sample payload:
     ```json
     {
       "student_id": "test-uuid",
       "intervention_id": "intervention-uuid",
       "quiz_score": 3,
       "focus_minutes": 20,
       "student_name": "Test Student",
       "student_email": "test@example.com"
     }
     ```

2. **Check email**: Verify mentor receives the notification

3. **Click approval link**: The workflow should resume and assign the task

4. **Verify backend**: Check student status changed to `in_remedial`

---

## Alternative: Slack-Based Approval

Instead of email links, you can use Slack interactive messages:

```json
{
  "type": "section",
  "text": {
    "type": "mrkdwn",
    "text": "*🚨 Student Intervention Alert*\n*Student:* John Doe\n*Quiz:* 4/10\n*Focus:* 30min"
  },
  "accessory": {
    "type": "button",
    "text": {
      "type": "plain_text",
      "text": "Approve & Assign"
    },
    "action_id": "approve_intervention",
    "value": "intervention-uuid"
  }
}
```

When mentor clicks the button, n8n resumes with the intervention data.

---

## Fail-Safe Behavior

If the Wait node times out (12 hours):
- Intervention status remains "pending"
- Backend's cron job detects this
- Automatically calls fail-safe procedure
- Student is unlocked with default remedial task

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Webhook not receiving | Check URL in backend `.env` matches n8n endpoint |
| Email not sending | Verify email provider is configured in n8n |
| Backend call fails | Check URL and payload format in HTTP node |
| Wait node times out | Increase timeout in Wait node settings |
| Student not unlocking | Verify backend received the POST request in logs |

---

## Future Enhancements

- Multi-mentor routing (assign to available mentor)
- Task templates (dropdown for common remedial tasks)
- Auto-escalation (route to Head Mentor if no response)
- Analytics (track intervention success rates)

