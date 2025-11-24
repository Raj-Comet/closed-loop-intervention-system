import pool from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export const Student = {
  async create(email, name) {
    const id = uuidv4();
    const result = await pool.query(
      'INSERT INTO students (id, email, name, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, email, name, 'on_track']
    );
    return result.rows[0];
  },

  async findById(id) {
    const result = await pool.query('SELECT * FROM students WHERE id = $1', [id]);
    return result.rows[0];
  },

  async findByEmail(email) {
    const result = await pool.query('SELECT * FROM students WHERE email = $1', [email]);
    return result.rows[0];
  },

  async updateStatus(id, status) {
    const result = await pool.query(
      'UPDATE students SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );
    return result.rows[0];
  },

  async setCurrentIntervention(id, interventionId) {
    const result = await pool.query(
      'UPDATE students SET current_intervention_id = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [interventionId, id]
    );
    return result.rows[0];
  },

  async getAll() {
    const result = await pool.query('SELECT * FROM students ORDER BY created_at DESC');
    return result.rows;
  },
};

export const DailyLog = {
  async create(studentId, quizScore, focusMinutes) {
    const id = uuidv4();
    const result = await pool.query(
      'INSERT INTO daily_logs (id, student_id, quiz_score, focus_minutes) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, studentId, quizScore, focusMinutes]
    );
    return result.rows[0];
  },

  async getLatestByStudent(studentId) {
    const result = await pool.query(
      'SELECT * FROM daily_logs WHERE student_id = $1 ORDER BY created_at DESC LIMIT 1',
      [studentId]
    );
    return result.rows[0];
  },

  async getByStudentDateRange(studentId, startDate, endDate) {
    const result = await pool.query(
      'SELECT * FROM daily_logs WHERE student_id = $1 AND created_at BETWEEN $2 AND $3 ORDER BY created_at DESC',
      [studentId, startDate, endDate]
    );
    return result.rows;
  },
};

export const Intervention = {
  async create(studentId) {
    const id = uuidv4();
    const result = await pool.query(
      'INSERT INTO interventions (id, student_id, status, expires_at) VALUES ($1, $2, $3, NOW() + INTERVAL \'12 hours\') RETURNING *',
      [id, studentId, 'pending']
    );
    return result.rows[0];
  },

  async findById(id) {
    const result = await pool.query('SELECT * FROM interventions WHERE id = $1', [id]);
    return result.rows[0];
  },

  async updateStatus(id, status) {
    const result = await pool.query(
      'UPDATE interventions SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );
    return result.rows[0];
  },

  async assignTask(id, remedialTask, mentorId, n8nExecutionId) {
    const result = await pool.query(
      'UPDATE interventions SET status = $2, remedial_task = $3, mentor_id = $4, n8n_execution_id = $5, approved_at = NOW(), updated_at = NOW() WHERE id = $1 RETURNING *',
      [id, 'approved', remedialTask, mentorId, n8nExecutionId]
    );
    return result.rows[0];
  },

  async completeIntervention(id) {
    const result = await pool.query(
      'UPDATE interventions SET status = $1, completed_at = NOW(), updated_at = NOW() WHERE id = $2 RETURNING *',
      ['completed', id]
    );
    return result.rows[0];
  },

  async getActiveByStudent(studentId) {
    const result = await pool.query(
      'SELECT * FROM interventions WHERE student_id = $1 AND status IN ($2, $3) ORDER BY created_at DESC LIMIT 1',
      [studentId, 'pending', 'approved']
    );
    return result.rows[0];
  },

  async getPendingForTimeout() {
    const result = await pool.query(
      'SELECT * FROM interventions WHERE status = $1 AND expires_at < NOW() AND updated_at < NOW() - INTERVAL \'12 hours\'',
      ['pending']
    );
    return result.rows;
  },
};

export const MentorAction = {
  async create(interventionId, action, taskAssigned = null) {
    const id = uuidv4();
    const result = await pool.query(
      'INSERT INTO mentor_actions (id, intervention_id, action, task_assigned) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, interventionId, action, taskAssigned]
    );
    return result.rows[0];
  },

  async getByIntervention(interventionId) {
    const result = await pool.query(
      'SELECT * FROM mentor_actions WHERE intervention_id = $1 ORDER BY created_at DESC',
      [interventionId]
    );
    return result.rows;
  },
};
