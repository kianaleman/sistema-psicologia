import { Router } from 'express';
import { getCatalogoItems, createCatalogoItem, updateCatalogoItem, deleteCatalogoItem } from '../controllers/configuracion.controller.js';

const router = Router();

// :modelo será 'ocupacion', 'parentesco', etc.
router.get('/:modelo', getCatalogoItems);
router.post('/:modelo', createCatalogoItem);
router.put('/:modelo/:id', updateCatalogoItem);
router.delete('/:modelo/:id', deleteCatalogoItem);

export default router;