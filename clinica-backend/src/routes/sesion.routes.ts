import { Router } from 'express';
import { createSesion, searchSesion } from '../controllers/sesion.controller';

const router = Router();

router.post('/', createSesion);
router.get('/buscar', searchSesion);

export default router;