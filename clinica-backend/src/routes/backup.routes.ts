import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { BackupController } from '../controllers/backup.controller.js';
import { protegerAdministracion } from '../middlewares/auth.middleware.js';

const router: ExpressRouter = Router();

router.use(...protegerAdministracion);
router.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

router.get('/', BackupController.listar);
router.post('/generar', BackupController.generar);
router.get('/descargar/:archivo', BackupController.descargar);
router.delete('/:archivo', BackupController.eliminar);

export default router;
