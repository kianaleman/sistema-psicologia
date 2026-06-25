import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { BackupController } from '../controllers/backup.controller.js';
import { verificarToken } from '../middlewares/auth.middleware.js';

const router: ExpressRouter = Router();

router.use(verificarToken);

router.get('/', BackupController.listar);
router.post('/generar', BackupController.generar);
router.get('/descargar/:archivo', BackupController.descargar);
router.delete('/:archivo', BackupController.eliminar);

export default router;