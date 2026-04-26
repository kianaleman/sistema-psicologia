import { Router } from 'express';
import { getTutores, updateTutor } from '../controllers/tutor.controller.js';

const router = Router();

router.get('/', getTutores);
router.put('/:id', updateTutor);

export default router;