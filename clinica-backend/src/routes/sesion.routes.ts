import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { createSesion, searchSesion } from '../controllers/sesion.controller.js';
import { verificarToken } from '../middlewares/auth.middleware.js';
import { validateSchema } from '../middlewares/validator.middleware.js';
import { createSesionSchema, searchSesionSchema } from '../schemas/sesion.schema.js';

const router: ExpressRouter = Router();

router.use(verificarToken);

router.post('/', validateSchema(createSesionSchema), createSesion);
router.get('/', validateSchema(searchSesionSchema), searchSesion);

export default router;
