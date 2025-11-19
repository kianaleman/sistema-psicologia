import { Router } from 'express';
import { getCitas, createCita, cancelCita, getCatalogosCitas } from '../controllers/cita.controller';

const router = Router();

router.get('/', getCitas);
router.post('/', createCita);
router.patch('/:id/cancelar', cancelCita);
router.get('/catalogos', getCatalogosCitas); // OJO: La URL cambiará ligeramente

export default router;