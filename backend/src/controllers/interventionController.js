import { Intervention, Student, MentorAction } from '../models/index.js';
import { emitToStudent } from '../config/socket.js';
import logger from '../utils/logger.js';

export const assignIntervention = async (req, res) => {
  try {
    const { intervention_id, remedial_task, mentor_id, n8n_execution_id } = req.body;

    if (!intervention_id || !remedial_task) {
      return res.status(400).json({ error: 'Missing required fields: intervention_id, remedial_task' });
    }

    // Find intervention
    const intervention = await Intervention.findById(intervention_id);
    if (!intervention) {
      return res.status(404).json({ error: 'Intervention not found' });
    }

    if (intervention.status !== 'pending') {
      return res.status(400).json({ error: 'Intervention is not in pending status' });
    }

    // Assign the task
    const updatedIntervention = await Intervention.assignTask(
      intervention_id,
      remedial_task,
      mentor_id || 'mentor@system',
      n8n_execution_id
    );

    // Update student status
    await Student.updateStatus(intervention.student_id, 'in_remedial');

    // Log mentor action
    await MentorAction.create(intervention_id, 'assigned_task', remedial_task);

    logger.info(`Intervention ${intervention_id} assigned with task: ${remedial_task}`);

    // Notify student via WebSocket - UNLOCK IN REAL-TIME
    emitToStudent(intervention.student_id, 'state:changed', {
      status: 'in_remedial',
      message: 'Your mentor has assigned a task for you.',
      intervention_id,
      remedial_task,
    });

    return res.status(200).json({
      success: true,
      message: 'Intervention assigned successfully',
      intervention: updatedIntervention,
      student_status: 'in_remedial',
    });
  } catch (error) {
    logger.error(`Error in assignIntervention: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getIntervention = async (req, res) => {
  try {
    const { id } = req.params;

    const intervention = await Intervention.findById(id);
    if (!intervention) {
      return res.status(404).json({ error: 'Intervention not found' });
    }

    const mentorActions = await MentorAction.getByIntervention(id);

    return res.status(200).json({
      intervention,
      mentor_actions: mentorActions,
    });
  } catch (error) {
    logger.error(`Error in getIntervention: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};
