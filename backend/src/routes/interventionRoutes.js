import { Router } from 'express';
import { assignIntervention, getIntervention } from '../controllers/interventionController.js';

const router = Router();

// POST /api/assign-intervention (called by n8n)
router.post('/assign-intervention', assignIntervention);

// GET /api/intervention/:id
router.get('/intervention/:id', getIntervention);

export default router;
