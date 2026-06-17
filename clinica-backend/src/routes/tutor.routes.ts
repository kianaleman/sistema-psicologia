import { Router } from 'express';
// Importamos la nueva función createTutor
import { getTutores, updateTutor, createTutor } from '../controllers/tutor.controller.js';
import { verificarToken } from '../middlewares/auth.middleware.js';
import { validateSchema } from '../middlewares/validator.middleware.js';
// Importamos el nuevo esquema
import { updateTutorSchema, createTutorSchema } from '../schemas/tutor.schema.js';

const router: Router = Router();

router.use(verificarToken);

router.get('/', getTutores);

// NUEVA RUTA: Creación de tutor
router.post('/', validateSchema(createTutorSchema), createTutor);

router.put('/:id', validateSchema(updateTutorSchema), updateTutor);

export default router;