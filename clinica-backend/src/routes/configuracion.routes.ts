import { Router } from 'express';
import { getCatalogoItems, createCatalogoItem, updateCatalogoItem, deleteCatalogoItem } from '../controllers/configuracion.controller.js';
import { verificarToken } from '../middlewares/auth.middleware.js';


const router: Router = Router();

router.use(verificarToken);

router.get('/:modelo', getCatalogoItems);
router.post('/:modelo', createCatalogoItem);
router.put('/:modelo/:id', updateCatalogoItem);
router.delete('/:modelo/:id', deleteCatalogoItem);

export default router;