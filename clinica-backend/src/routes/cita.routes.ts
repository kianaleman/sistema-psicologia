import { Router } from 'express';
import { getCitas, createCita, cancelCita, getCatalogosCitas, updateCita } from '../controllers/cita.controller';

const router = Router();

router.get('/', getCitas);
router.post('/', createCita);
router.put('/:id', updateCita);
router.patch('/:id/cancelar', cancelCita);
router.get('/catalogos', getCatalogosCitas); // OJO: La URL cambiará ligeramente

export default router;