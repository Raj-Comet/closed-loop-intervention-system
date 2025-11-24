import cron from 'node-cron';
import { Intervention, Student, MentorAction } from '../models/index.js';
import { emitToStudent } from '../config/socket.js';
import logger from './logger.js';

// Run every hour to check for timed-out interventions
export const startTimeoutCheckJob = () => {
  cron.schedule('0 * * * *', async () => {
    logger.info('Running intervention timeout check...');
    try {
      const timedOutInterventions = await Intervention.getPendingForTimeout();

      for (const intervention of timedOutInterventions) {
        logger.warn(`Intervention ${intervention.id} has timed out after 12 hours`);

        // Update intervention status
        await Intervention.updateStatus(intervention.id, 'timed_out');

        // Auto-unlock the student
        await Student.updateStatus(intervention.student_id, 'on_track');
        await Student.setCurrentIntervention(intervention.student_id, null);

        // Log the auto-unlock action
        await MentorAction.create(
          intervention.id,
          'auto_escalated',
          'System auto-unlocked due to 12-hour timeout. Mentor did not respond.'
        );

        // Notify student
        emitToStudent(intervention.student_id, 'state:changed', {
          status: 'on_track',
          message: 'Your intervention has been auto-resolved due to timeout. Please review the material and try again.',
          reason: 'mentor_timeout',
        });

        logger.info(`Student ${intervention.student_id} auto-unlocked due to timeout`);
      }

      if (timedOutInterventions.length === 0) {
        logger.info('No interventions to timeout.');
      }
    } catch (error) {
      logger.error(`Error in timeout check job: ${error.message}`);
    }
  });

  logger.info('Intervention timeout check job started (runs every hour)');
};
