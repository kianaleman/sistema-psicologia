import { Router } from 'express';
import {
  anularAplicacion,
  cambiarEstadoTest,
  crearAplicacion,
  crearTest,
  listarResultadosPaciente,
  listarResultadosSesion,
  listarTests,
  obtenerAplicacion,
  obtenerTest,
  obtenerTestPublico,
  responderTestPublico,
} from '../controllers/testPsicologico.controller.js';
import {
  bloquearSiRequiereCambioPassword,
  permitirRoles,
  requierePsicologoAsignado,
  ROLES,
  verificarToken,
} from '../middlewares/auth.middleware.js';
import { validateSchema } from '../middlewares/validator.middleware.js';
import {
  cambiarEstadoTestSchema,
  crearAplicacionTestSchema,
  crearTestPsicologicoSchema,
  responderTestPublicoSchema,
} from '../schemas/testPsicologico.schema.js';

const router: Router = Router();

router.get('/publico/:token', obtenerTestPublico);
router.post('/publico/:token/responder', validateSchema(responderTestPublicoSchema), responderTestPublico);

router.use(verificarToken);
router.use(bloquearSiRequiereCambioPassword);

router.get('/', permitirRoles(ROLES.ADMINISTRADOR, ROLES.PSICOLOGO), requierePsicologoAsignado, listarTests);
router.post('/', permitirRoles(ROLES.ADMINISTRADOR), validateSchema(crearTestPsicologicoSchema), crearTest);

router.post('/aplicaciones', permitirRoles(ROLES.ADMINISTRADOR, ROLES.PSICOLOGO), requierePsicologoAsignado, validateSchema(crearAplicacionTestSchema), crearAplicacion);
router.get('/aplicaciones/:idAplicacion', permitirRoles(ROLES.ADMINISTRADOR, ROLES.PSICOLOGO), requierePsicologoAsignado, obtenerAplicacion);
router.patch('/aplicaciones/:idAplicacion/anular', permitirRoles(ROLES.ADMINISTRADOR, ROLES.PSICOLOGO), requierePsicologoAsignado, anularAplicacion);
router.get('/pacientes/:idPaciente/resultados', permitirRoles(ROLES.ADMINISTRADOR, ROLES.PSICOLOGO), requierePsicologoAsignado, listarResultadosPaciente);
router.get('/sesiones/:idSesion/resultados', permitirRoles(ROLES.ADMINISTRADOR, ROLES.PSICOLOGO), requierePsicologoAsignado, listarResultadosSesion);

router.get('/:id', permitirRoles(ROLES.ADMINISTRADOR, ROLES.PSICOLOGO), requierePsicologoAsignado, obtenerTest);
router.patch('/:id/estado', permitirRoles(ROLES.ADMINISTRADOR), validateSchema(cambiarEstadoTestSchema), cambiarEstadoTest);

export default router;
