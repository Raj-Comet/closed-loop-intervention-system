import { Student, DailyLog, Intervention, MentorAction } from '../models/index.js';
import { emitToStudent } from '../config/socket.js';
import axios from 'axios';
import logger from '../utils/logger.js';

const PASS_THRESHOLD_QUIZ = 7;
const PASS_THRESHOLD_FOCUS = 60; // minutes

export const handleDailyCheckin = async (req, res) => {
  try {
    const { student_id, quiz_score, focus_minutes } = req.body;

    // Validate input
    if (!student_id || quiz_score === undefined || focus_minutes === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (quiz_score < 0 || quiz_score > 10) {
      return res.status(400).json({ error: 'Quiz score must be between 0 and 10' });
    }

    // Check if student exists
    const student = await Student.findById(student_id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Log the check-in
    const log = await DailyLog.create(student_id, quiz_score, focus_minutes);
    logger.info(`Daily checkin logged for student ${student_id}`, { quiz_score, focus_minutes });

    // Evaluate performance
    const isPassing = quiz_score >= PASS_THRESHOLD_QUIZ && focus_minutes >= PASS_THRESHOLD_FOCUS;

    if (isPassing) {
      // Student is on track
      await Student.updateStatus(student_id, 'on_track');
      await Student.setCurrentIntervention(student_id, null);

      logger.info(`Student ${student_id} is on track`);
      emitToStudent(student_id, 'state:changed', {
        status: 'on_track',
        message: 'Great job! You\'re on track.',
      });

      return res.status(200).json({
        status: 'On Track',
        message: 'Great performance! Keep it up.',
      });
    } else {
      // Student needs intervention
      const intervention = await Intervention.create(student_id);
      await Student.updateStatus(student_id, 'needs_intervention');
      await Student.setCurrentIntervention(student_id, intervention.id);

      logger.info(`Student ${student_id} needs intervention`, { intervention_id: intervention.id });

      // Trigger n8n webhook
      try {
        await axios.post(process.env.N8N_WEBHOOK_URL, {
          student_id,
          intervention_id: intervention.id,
          quiz_score,
          focus_minutes,
          student_name: student.name,
          student_email: student.email,
        });
        logger.info(`n8n webhook triggered for intervention ${intervention.id}`);
      } catch (error) {
        logger.error(`Failed to trigger n8n webhook: ${error.message}`);
        // Don't fail the request if webhook fails, but log it
      }

      // Notify student via WebSocket
      emitToStudent(student_id, 'state:changed', {
        status: 'locked',
        message: 'Analysis in progress. Waiting for Mentor...',
        intervention_id: intervention.id,
        expires_at: intervention.expires_at,
      });

      return res.status(200).json({
        status: 'Pending Mentor Review',
        intervention_id: intervention.id,
        message: 'Your stats suggest you need a quick intervention. A mentor will review your case shortly.',
        locked_until: intervention.expires_at,
      });
    }
  } catch (error) {
    logger.error(`Error in handleDailyCheckin: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getStudentState = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const lastLog = await DailyLog.getLatestByStudent(id);
    const activeIntervention = await Intervention.getActiveByStudent(id);

    return res.status(200).json({
      student_id: id,
      name: student.name,
      email: student.email,
      status: student.status,
      intervention: activeIntervention || null,
      last_log: lastLog || null,
      updated_at: student.updated_at,
    });
  } catch (error) {
    logger.error(`Error in getStudentState: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const completeRemedial = async (req, res) => {
  try {
    const { student_id, intervention_id } = req.body;

    if (!student_id || !intervention_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const intervention = await Intervention.findById(intervention_id);
    if (!intervention) {
      return res.status(404).json({ error: 'Intervention not found' });
    }

    if (intervention.student_id !== student_id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Complete the intervention
    await Intervention.completeIntervention(intervention_id);
    await Student.updateStatus(student_id, 'on_track');
    await Student.setCurrentIntervention(student_id, null);
    await MentorAction.create(intervention_id, 'completed', null);

    logger.info(`Remedial task completed for student ${student_id}`);

    // Notify student
    emitToStudent(student_id, 'state:changed', {
      status: 'on_track',
      message: 'Great! You\'ve completed the remedial task. You\'re back on track!',
    });

    return res.status(200).json({
      success: true,
      message: 'Remedial task marked as complete',
      student_status: 'on_track',
    });
  } catch (error) {
    logger.error(`Error in completeRemedial: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};
