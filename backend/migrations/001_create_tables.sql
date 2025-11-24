# Database Migration Script
# Run this to create all tables in your PostgreSQL database

## SQL to execute:

```sql
-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'on_track' CHECK (status IN ('on_track', 'needs_intervention', 'in_remedial')),
  current_intervention_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create daily_logs table
CREATE TABLE IF NOT EXISTS daily_logs (
  id UUID PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  quiz_score INTEGER NOT NULL CHECK (quiz_score >= 0 AND quiz_score <= 10),
  focus_minutes INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create interventions table
CREATE TABLE IF NOT EXISTS interventions (
  id UUID PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'completed', 'failed', 'timed_out')),
  remedial_task TEXT,
  n8n_workflow_id VARCHAR(255),
  n8n_execution_id VARCHAR(255),
  mentor_id VARCHAR(255),
  approved_at TIMESTAMP,
  completed_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create mentor_actions table
CREATE TABLE IF NOT EXISTS mentor_actions (
  id UUID PRIMARY KEY,
  intervention_id UUID NOT NULL REFERENCES interventions(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL CHECK (action IN ('approved', 'assigned_task', 'auto_escalated', 'timeout_unlocked', 'completed')),
  task_assigned TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_daily_logs_student ON daily_logs(student_id);
CREATE INDEX idx_interventions_student ON interventions(student_id);
CREATE INDEX idx_interventions_status ON interventions(status);
CREATE INDEX idx_mentor_actions_intervention ON mentor_actions(intervention_id);
```

## Instructions:

1. **Using Supabase** (Recommended for this project):
   - Go to https://supabase.com
   - Create a new project
   - Copy the connection string
   - Go to SQL Editor
   - Paste the SQL above and execute

2. **Using PostgreSQL locally**:
   ```bash
   psql -U postgres -d your_database_name -f migrations/001_create_tables.sql
   ```

3. **Using DBeaver or pgAdmin**:
   - Connect to your database
   - Create a new SQL Script
   - Paste the SQL above
   - Execute

## Environment Variables:

After creating the database, add to your `.env`:
```
DATABASE_URL=postgresql://user:password@host:port/database_name
```

For Supabase:
```
DATABASE_URL=postgresql://postgres:password@db.supabase.co:5432/postgres
```
