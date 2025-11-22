import { Router } from 'express';
import { getFacturas } from '../controllers/factura.controller';

const router = Router();

router.get('/', getFacturas);

export default router;