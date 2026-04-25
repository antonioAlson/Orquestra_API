import express from 'express';
import { getProjects, getAramidaProjects, getTensylonProjects, generateOS } from '../controllers/mirrorsController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Material-specific routes must come before the generic /projects route.
router.get('/projects/aramida',  authenticate, getAramidaProjects);
router.get('/projects/tensylon', authenticate, getTensylonProjects);
router.get('/projects',          authenticate, getProjects);
router.post('/generate-os',      authenticate, generateOS);

export default router;
