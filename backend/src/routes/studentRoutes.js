import { Router } from 'express';
import { handleDailyCheckin, getStudentState, completeRemedial } from '../controllers/studentController.js';

const router = Router();

// POST /api/daily-checkin
router.post('/daily-checkin', handleDailyCheckin);

// GET /api/student/:id
router.get('/student/:id', getStudentState);

// POST /api/complete-remedial
router.post('/complete-remedial', completeRemedial);

export default router;
