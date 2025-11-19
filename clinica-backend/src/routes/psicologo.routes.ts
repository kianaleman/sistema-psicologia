import { Router } from 'express';
import { getPsicologos, createPsicologo, updatePsicologo } from '../controllers/psicologo.controller';

const router = Router();

router.get('/', getPsicologos);
router.post('/', createPsicologo);
router.put('/:id', updatePsicologo);

export default router;