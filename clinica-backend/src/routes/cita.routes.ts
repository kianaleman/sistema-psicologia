import { Router } from 'express';
import { getCitas, createCita, cancelCita, getCatalogosCitas, updateCita } from '../controllers/cita.controller.js';

const router = Router();

router.get('/', getCitas);
router.post('/', createCita);
router.get('/catalogos', getCatalogosCitas);
router.put('/:id', updateCita);
router.patch('/:id/cancelar', cancelCita);

export default router;