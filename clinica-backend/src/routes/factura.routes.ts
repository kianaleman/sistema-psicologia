import { Router } from 'express';
import { getFacturas } from '../controllers/factura.controller.js';
import { verificarToken } from '../middlewares/auth.middleware.js'; 

const router: Router = Router();

router.use(verificarToken);

router.get('/', getFacturas);

export default router;