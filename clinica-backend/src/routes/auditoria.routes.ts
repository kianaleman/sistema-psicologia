import { Router } from 'express';
import {
  getAuditorias,
  getResumenAuditoria,
} from '../controllers/auditoria.controller.js';
import {
  bloquearSiRequiereCambioPassword,
  permitirRoles,
  ROLES,
  verificarToken,
} from '../middlewares/auth.middleware.js';

const router: Router = Router();

router.use(verificarToken);
router.use(bloquearSiRequiereCambioPassword);
router.use(permitirRoles(ROLES.ADMINISTRADOR));

router.get('/', getAuditorias);
router.get('/resumen', getResumenAuditoria);

export default router;
