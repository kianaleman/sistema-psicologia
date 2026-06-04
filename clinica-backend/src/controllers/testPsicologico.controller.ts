import type { Request, Response } from 'express';
import { AuditoriaService } from '../services/auditoria.service.js';
import {
  TestPsicologicoService,
  type CrearAplicacionTestDTO,
  type CrearTestPsicologicoDTO,
  type RespuestaPublicaDTO,
} from '../services/testPsicologico.service.js';

const getErrorMessage = (error: unknown, fallback: string) => {
  return error instanceof Error ? error.message : fallback;
};

const getStatusFromError = (message: string) => {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('no autorizado')) return 401;

  if (
    lowerMessage.includes('no tiene permisos') ||
    lowerMessage.includes('no tiene un perfil')
  ) {
    return 403;
  }

  if (lowerMessage.includes('no existe') || lowerMessage.includes('no encontrado')) return 404;
  if (lowerMessage.includes('vencido')) return 410;

  if (
    lowerMessage.includes('inválido') ||
    lowerMessage.includes('inválida') ||
    lowerMessage.includes('debe') ||
    lowerMessage.includes('inactivo') ||
    lowerMessage.includes('no pertenece') ||
    lowerMessage.includes('ya no está disponible')
  ) {
    return 400;
  }

  return 500;
};

const toNumber = (value: unknown) => Number(value);

const getPositiveId = (value: unknown) => {
  const id = toNumber(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const getParamString = (value: unknown) => {
  if (Array.isArray(value)) return value[0] ?? '';
  return typeof value === 'string' ? value : '';
};

const esObjeto = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const normalizarCrearAplicacion = (body: unknown): CrearAplicacionTestDTO | null => {
  if (!esObjeto(body)) return null;

  const idTest = getPositiveId(body.ID_Test);
  const idPaciente = getPositiveId(body.ID_Paciente);
  const idSesion = body.ID_Sesion === null || body.ID_Sesion === undefined || body.ID_Sesion === ''
    ? null
    : getPositiveId(body.ID_Sesion);
  const contexto = body.Contexto === 'EN_SESION' ? 'EN_SESION' : 'FUERA_SESION';
  const expiraHoras = body.ExpiraHoras === undefined ? 24 : Number(body.ExpiraHoras);
  const observacion = typeof body.ObservacionPsicologo === 'string' ? body.ObservacionPsicologo : null;

  if (!idTest || !idPaciente || !Number.isFinite(expiraHoras)) return null;

  return {
    ID_Test: idTest,
    ID_Paciente: idPaciente,
    ID_Sesion: idSesion,
    Contexto: contexto,
    ExpiraHoras: expiraHoras,
    ObservacionPsicologo: observacion,
  };
};

const normalizarRespuestas = (body: unknown): RespuestaPublicaDTO[] | null => {
  if (!esObjeto(body) || !Array.isArray(body.respuestas)) return null;

  const respuestas = body.respuestas
    .filter(esObjeto)
    .map((respuesta) => {
      const idPregunta = getPositiveId(respuesta.ID_Pregunta);
      const idOpcion = respuesta.ID_Opcion === null || respuesta.ID_Opcion === undefined || respuesta.ID_Opcion === ''
        ? null
        : getPositiveId(respuesta.ID_Opcion);
      const valor = respuesta.Valor === null || respuesta.Valor === undefined || respuesta.Valor === ''
        ? null
        : Number(respuesta.Valor);
      const textoLibre = typeof respuesta.TextoLibre === 'string' ? respuesta.TextoLibre : null;

      if (!idPregunta) return null;

      return {
        ID_Pregunta: idPregunta,
        ID_Opcion: idOpcion,
        Valor: valor,
        TextoLibre: textoLibre,
      } satisfies RespuestaPublicaDTO;
    })
    .filter((respuesta): respuesta is NonNullable<typeof respuesta> => respuesta !== null);

  return respuestas;
};

export const listarTests = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await TestPsicologicoService.listarTests(req.user);
    res.json(result);
  } catch (error: unknown) {
    const message = getErrorMessage(error, 'Error al listar tests psicológicos');
    res.status(getStatusFromError(message)).json({ error: message });
  }
};

export const obtenerTest = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = getPositiveId(req.params.id);

    if (!id) {
      res.status(400).json({ error: 'El ID del test no es válido.' });
      return;
    }

    const result = await TestPsicologicoService.obtenerTest(id, req.user);
    res.json(result);
  } catch (error: unknown) {
    const message = getErrorMessage(error, 'Error al obtener test psicológico');
    res.status(getStatusFromError(message)).json({ error: message });
  }
};

export const crearTest = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await TestPsicologicoService.crearTest(req.body as CrearTestPsicologicoDTO, req.user);

    await AuditoriaService.registrarDesdeRequest(req, {
      accion: 'TEST_PSICOLOGICO_CREADO',
      modulo: 'TESTS_PSICOLOGICOS',
      entidad: 'TestPsicologico',
      idEntidad: result.ID_Test,
      resultado: 'EXITO',
      codigoEstado: 201,
      mensaje: 'Test psicológico creado correctamente.',
      datosDespues: {
        ID_Test: result.ID_Test,
        Codigo: result.Codigo,
        Nombre: result.Nombre,
      },
    });

    res.status(201).json(result);
  } catch (error: unknown) {
    const message = getErrorMessage(error, 'Error al crear test psicológico');
    const status = getStatusFromError(message);

    await AuditoriaService.registrarDesdeRequest(req, {
      accion: 'TEST_PSICOLOGICO_CREADO',
      modulo: 'TESTS_PSICOLOGICOS',
      entidad: 'TestPsicologico',
      resultado: 'FALLO',
      codigoEstado: status,
      mensaje: message,
      datosDespues: req.body,
    });

    res.status(status).json({ error: message });
  }
};

export const cambiarEstadoTest = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = getPositiveId(req.params.id);

    if (!id || !esObjeto(req.body) || typeof req.body.Activo !== 'boolean') {
      res.status(400).json({ error: 'Debe enviar un ID válido y el campo Activo.' });
      return;
    }

    const result = await TestPsicologicoService.cambiarEstadoTest(id, req.body.Activo, req.user);

    await AuditoriaService.registrarDesdeRequest(req, {
      accion: 'TEST_PSICOLOGICO_ESTADO_ACTUALIZADO',
      modulo: 'TESTS_PSICOLOGICOS',
      entidad: 'TestPsicologico',
      idEntidad: id,
      resultado: 'EXITO',
      codigoEstado: 200,
      mensaje: 'Estado del test psicológico actualizado.',
      datosDespues: {
        ID_Test: id,
        Activo: result.Activo,
      },
    });

    res.json(result);
  } catch (error: unknown) {
    const message = getErrorMessage(error, 'Error al actualizar estado del test');
    res.status(getStatusFromError(message)).json({ error: message });
  }
};

export const crearAplicacion = async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = normalizarCrearAplicacion(req.body);

    if (!payload) {
      res.status(400).json({ error: 'Cuerpo de petición inválido.' });
      return;
    }

    const result = await TestPsicologicoService.crearAplicacion(payload, req.user);

    await AuditoriaService.registrarDesdeRequest(req, {
      accion: 'TEST_ASIGNADO',
      modulo: 'TESTS_PSICOLOGICOS',
      entidad: 'TestAplicacion',
      idEntidad: result.aplicacion.ID_Aplicacion,
      resultado: 'EXITO',
      codigoEstado: 201,
      mensaje: 'Test psicológico asignado correctamente.',
      datosDespues: {
        ID_Aplicacion: result.aplicacion.ID_Aplicacion,
        ID_Test: payload.ID_Test,
        ID_Paciente: payload.ID_Paciente,
        ID_Sesion: payload.ID_Sesion,
        Contexto: payload.Contexto,
      },
    });

    res.status(201).json(result);
  } catch (error: unknown) {
    const message = getErrorMessage(error, 'Error al asignar test psicológico');
    const status = getStatusFromError(message);

    await AuditoriaService.registrarDesdeRequest(req, {
      accion: 'TEST_ASIGNADO',
      modulo: 'TESTS_PSICOLOGICOS',
      entidad: 'TestAplicacion',
      resultado: 'FALLO',
      codigoEstado: status,
      mensaje: message,
      datosDespues: req.body,
    });

    res.status(status).json({ error: message });
  }
};

export const listarResultadosPaciente = async (req: Request, res: Response): Promise<void> => {
  try {
    const idPaciente = getPositiveId(req.params.idPaciente);

    if (!idPaciente) {
      res.status(400).json({ error: 'El ID del paciente no es válido.' });
      return;
    }

    const result = await TestPsicologicoService.listarResultadosPaciente(idPaciente, req.user);
    res.json(result);
  } catch (error: unknown) {
    const message = getErrorMessage(error, 'Error al consultar resultados del paciente');
    res.status(getStatusFromError(message)).json({ error: message });
  }
};

export const listarResultadosSesion = async (req: Request, res: Response): Promise<void> => {
  try {
    const idSesion = getPositiveId(req.params.idSesion);

    if (!idSesion) {
      res.status(400).json({ error: 'El ID de la sesión no es válido.' });
      return;
    }

    const result = await TestPsicologicoService.listarResultadosSesion(idSesion, req.user);
    res.json(result);
  } catch (error: unknown) {
    const message = getErrorMessage(error, 'Error al consultar resultados de la sesión');
    res.status(getStatusFromError(message)).json({ error: message });
  }
};

export const obtenerAplicacion = async (req: Request, res: Response): Promise<void> => {
  try {
    const idAplicacion = getPositiveId(req.params.idAplicacion);

    if (!idAplicacion) {
      res.status(400).json({ error: 'El ID de la aplicación no es válido.' });
      return;
    }

    const result = await TestPsicologicoService.obtenerAplicacion(idAplicacion, req.user);
    res.json(result);
  } catch (error: unknown) {
    const message = getErrorMessage(error, 'Error al consultar aplicación del test');
    res.status(getStatusFromError(message)).json({ error: message });
  }
};

export const anularAplicacion = async (req: Request, res: Response): Promise<void> => {
  try {
    const idAplicacion = getPositiveId(req.params.idAplicacion);

    if (!idAplicacion) {
      res.status(400).json({ error: 'El ID de la aplicación no es válido.' });
      return;
    }

    const result = await TestPsicologicoService.anularAplicacion(idAplicacion, req.user);

    await AuditoriaService.registrarDesdeRequest(req, {
      accion: 'TEST_ANULADO',
      modulo: 'TESTS_PSICOLOGICOS',
      entidad: 'TestAplicacion',
      idEntidad: idAplicacion,
      resultado: 'EXITO',
      codigoEstado: 200,
      mensaje: 'Aplicación de test anulada correctamente.',
    });

    res.json(result);
  } catch (error: unknown) {
    const message = getErrorMessage(error, 'Error al anular aplicación del test');
    res.status(getStatusFromError(message)).json({ error: message });
  }
};

export const obtenerTestPublico = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = getParamString(req.params.token);

    if (!token) {
      res.status(400).json({ error: 'El token del test no es válido.' });
      return;
    }

    const result = await TestPsicologicoService.obtenerPublicoPorToken(token);
    res.json(result);
  } catch (error: unknown) {
    const message = getErrorMessage(error, 'Error al cargar test público');
    res.status(getStatusFromError(message)).json({ error: message });
  }
};

export const responderTestPublico = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = getParamString(req.params.token);
    const respuestas = normalizarRespuestas(req.body);

    if (!token) {
      res.status(400).json({ error: 'El token del test no es válido.' });
      return;
    }

    if (!respuestas) {
      res.status(400).json({ error: 'Debe enviar las respuestas del test.' });
      return;
    }

    const result = await TestPsicologicoService.responderPublico(token, respuestas);

    await AuditoriaService.registrarDesdeRequest(req, {
      accion: result.TieneAlertaCritica ? 'TEST_RESPONDIDO_ALERTA_CRITICA' : 'TEST_RESPONDIDO',
      modulo: 'TESTS_PSICOLOGICOS',
      entidad: 'TestAplicacion',
      idEntidad: result.ID_Aplicacion,
      resultado: 'EXITO',
      codigoEstado: 200,
      mensaje: 'Test psicológico respondido desde enlace público.',
      datosDespues: {
        ID_Aplicacion: result.ID_Aplicacion,
        PuntajeTotal: result.PuntajeTotal,
        Nivel: result.Nivel,
        TieneAlertaCritica: result.TieneAlertaCritica,
      },
    });

    res.json(result);
  } catch (error: unknown) {
    const message = getErrorMessage(error, 'Error al guardar respuestas del test');
    res.status(getStatusFromError(message)).json({ error: message });
  }
};
