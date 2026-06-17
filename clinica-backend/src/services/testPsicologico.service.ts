import { createHash, randomBytes } from 'crypto';
import { PrismaClient, type Prisma } from '@prisma/client';
import type { AuthUserPayload } from '../middlewares/auth.middleware.js';

const prisma = new PrismaClient();

const ESTADOS_APLICACION = {
  PENDIENTE: 'PENDIENTE',
  COMPLETADO: 'COMPLETADO',
  VENCIDO: 'VENCIDO',
  ANULADO: 'ANULADO',
} as const;

const CONTEXTOS_APLICACION = {
  FUERA_SESION: 'FUERA_SESION',
  EN_SESION: 'EN_SESION',
} as const;

type ContextoAplicacion = (typeof CONTEXTOS_APLICACION)[keyof typeof CONTEXTOS_APLICACION];

export interface CrearTestOpcionDTO {
  texto: string;
  valor: number;
  orden: number;
}

export interface CrearTestPreguntaDTO {
  texto: string;
  orden: number;
  activa?: boolean;
  esCritica?: boolean;
  valorCriticoMinimo?: number | null;
  opciones: CrearTestOpcionDTO[];
}

export interface CrearTestRangoDTO {
  puntajeMin: number;
  puntajeMax: number;
  nivel: string;
  descripcion?: string | null;
}

export interface CrearTestPsicologicoDTO {
  nombre: string;
  codigo: string;
  categoria: string;
  descripcion?: string | null;
  instrucciones?: string | null;
  activo?: boolean;
  version?: number;
  preguntas: CrearTestPreguntaDTO[];
  rangos: CrearTestRangoDTO[];
}

export interface CrearAplicacionTestDTO {
  ID_Test: number;
  ID_Paciente: number;
  ID_Sesion?: number | null;
  Contexto: ContextoAplicacion;
  ExpiraHoras?: number;
  ObservacionPsicologo?: string | null;
}

export interface RespuestaPublicaDTO {
  ID_Pregunta: number;
  ID_Opcion?: number | null;
  Valor?: number | null;
  TextoLibre?: string | null;
}

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const normalizarTexto = (value: string) => value.trim();

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

const generarToken = () => randomBytes(32).toString('hex');

const construirUrlPublica = (token: string) => `${FRONTEND_URL.replace(/\/$/, '')}/test-publico/${token}`;

const validarId = (id: number, mensaje: string) => {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(mensaje);
  }
};

const validarUsuarioAutenticado = (usuario?: AuthUserPayload) => {
  if (!usuario) {
    throw new Error('Acceso no autorizado.');
  }

  return usuario;
};

const validarPuedeGestionarCatalogo = (usuario?: AuthUserPayload) => {
  const usuarioActual = validarUsuarioAutenticado(usuario);

  if (!usuarioActual.esAdmin) {
    throw new Error('No tiene permisos para gestionar tests psicológicos.');
  }

  return usuarioActual;
};

const validarPuedeUsarTestsClinicos = (usuario?: AuthUserPayload) => {
  const usuarioActual = validarUsuarioAutenticado(usuario);

  if (usuarioActual.esAdmin || usuarioActual.esPsicologo) {
    return usuarioActual;
  }

  throw new Error('No tiene permisos para utilizar tests psicológicos.');
};

const validarPsicologoVinculado = (usuario: AuthUserPayload) => {
  if (!usuario.idPsicologo) {
    throw new Error('El usuario psicólogo no tiene un perfil de psicólogo vinculado.');
  }

  return usuario.idPsicologo;
};

const validarAccesoPaciente = async (idPaciente: number, usuario: AuthUserPayload) => {
  validarId(idPaciente, 'El ID del paciente no es válido.');

  const paciente = await prisma.paciente.findUnique({
    where: { ID_Paciente: idPaciente },
    select: {
      ID_Paciente: true,
      Nombre: true,
      Apellido: true,
      Activo: true,
    },
  });

  if (!paciente) {
    throw new Error('El paciente no existe.');
  }

  if (usuario.esPsicologo) {
    const idPsicologo = validarPsicologoVinculado(usuario);

    const existeRelacion = await prisma.cita.findFirst({
      where: {
        ID_Paciente: idPaciente,
        ID_Psicologo: idPsicologo,
      },
      select: {
        ID_Cita: true,
      },
    });

    if (!existeRelacion) {
      throw new Error('No tiene permisos para gestionar tests de este paciente.');
    }
  }

  return paciente;
};

const validarSesionPaciente = async (idSesion: number, idPaciente: number, usuario: AuthUserPayload) => {
  validarId(idSesion, 'El ID de la sesión no es válido.');

  const sesion = await prisma.sesion.findUnique({
    where: { ID_Sesion: idSesion },
    select: {
      ID_Sesion: true,
      ID_Cita: true,
      Cita: {
        select: {
          ID_Paciente: true,
          ID_Psicologo: true,
        },
      },
      Expediente: {
        select: {
          ID_Paciente: true,
        },
      },
    },
  });

  if (!sesion) {
    throw new Error('La sesión clínica no existe.');
  }

  const pacienteSesion = sesion.Cita?.ID_Paciente || sesion.Expediente?.ID_Paciente || null;

  if (pacienteSesion !== idPaciente) {
    throw new Error('La sesión clínica no pertenece al paciente seleccionado.');
  }

  if (usuario.esPsicologo) {
    const idPsicologo = validarPsicologoVinculado(usuario);

    if (sesion.Cita?.ID_Psicologo && sesion.Cita.ID_Psicologo !== idPsicologo) {
      throw new Error('No tiene permisos para vincular tests a esta sesión.');
    }
  }

  return sesion;
};

const seleccionarRango = async (idTest: number, puntajeTotal: number) => {
  return prisma.testRangoResultado.findFirst({
    where: {
      ID_Test: idTest,
      PuntajeMin: { lte: puntajeTotal },
      PuntajeMax: { gte: puntajeTotal },
    },
    orderBy: {
      PuntajeMin: 'asc',
    },
  });
};

const marcarVencidoSiAplica = async <T extends { ID_Aplicacion: number; Estado: string; ExpiraEn: Date }>(aplicacion: T) => {
  if (aplicacion.Estado === ESTADOS_APLICACION.PENDIENTE && aplicacion.ExpiraEn.getTime() < Date.now()) {
    await prisma.testAplicacion.update({
      where: { ID_Aplicacion: aplicacion.ID_Aplicacion },
      data: { Estado: ESTADOS_APLICACION.VENCIDO },
    });

    throw new Error('El enlace del test ha vencido.');
  }
};

const selectTestCompleto = {
  ID_Test: true,
  Nombre: true,
  Codigo: true,
  Categoria: true,
  Descripcion: true,
  Instrucciones: true,
  Activo: true,
  Version: true,
  FechaCreacion: true,
  FechaActualizacion: true,
  Preguntas: {
    where: { Activa: true },
    orderBy: { Orden: 'asc' as const },
    select: {
      ID_Pregunta: true,
      Texto: true,
      Orden: true,
      Activa: true,
      EsCritica: true,
      ValorCriticoMinimo: true,
      Opciones: {
        orderBy: { Orden: 'asc' as const },
        select: {
          ID_Opcion: true,
          Texto: true,
          Valor: true,
          Orden: true,
        },
      },
    },
  },
  Rangos: {
    orderBy: { PuntajeMin: 'asc' as const },
    select: {
      ID_Rango: true,
      PuntajeMin: true,
      PuntajeMax: true,
      Nivel: true,
      Descripcion: true,
    },
  },
} satisfies Prisma.TestPsicologicoSelect;

const selectAplicacionResumen = {
  ID_Aplicacion: true,
  Contexto: true,
  Estado: true,
  ExpiraEn: true,
  CompletadoEn: true,
  PuntajeTotal: true,
  Nivel: true,
  Interpretacion: true,
  TieneAlertaCritica: true,
  ObservacionPsicologo: true,
  FechaCreacion: true,
  Test: {
    select: {
      ID_Test: true,
      Nombre: true,
      Codigo: true,
      Categoria: true,
    },
  },
  Paciente: {
    select: {
      ID_Paciente: true,
      Nombre: true,
      Apellido: true,
    },
  },
  Psicologo: {
    select: {
      ID_Psicologo: true,
      Nombre: true,
      Apellido: true,
    },
  },
  Sesion: {
    select: {
      ID_Sesion: true,
      ID_Cita: true,
    },
  },
  Respuestas: {
    select: {
      ID_Respuesta: true,
      Valor: true,
      TextoLibre: true,
      Pregunta: {
        select: {
          ID_Pregunta: true,
          Texto: true,
          Orden: true,
          EsCritica: true,
          ValorCriticoMinimo: true,
        },
      },
      Opcion: {
        select: {
          ID_Opcion: true,
          Texto: true,
          Valor: true,
        },
      },
    },
    orderBy: {
      Pregunta: {
        Orden: 'asc' as const,
      },
    },
  },
} satisfies Prisma.TestAplicacionSelect;

export const TestPsicologicoService = {
  listarTests: async (usuario?: AuthUserPayload) => {
    validarPuedeUsarTestsClinicos(usuario);

    return prisma.testPsicologico.findMany({
      orderBy: [
        { Activo: 'desc' },
        { Nombre: 'asc' },
      ],
      include: {
        _count: {
          select: {
            Preguntas: true,
            Aplicaciones: true,
          },
        },
        Rangos: {
          orderBy: {
            PuntajeMin: 'asc',
          },
        },
      },
    });
  },

  obtenerTest: async (idTest: number, usuario?: AuthUserPayload) => {
    validarPuedeUsarTestsClinicos(usuario);
    validarId(idTest, 'El ID del test no es válido.');

    const test = await prisma.testPsicologico.findUnique({
      where: { ID_Test: idTest },
      select: selectTestCompleto,
    });

    if (!test) {
      throw new Error('El test psicológico no existe.');
    }

    return test;
  },

  crearTest: async (data: CrearTestPsicologicoDTO, usuario?: AuthUserPayload) => {
    validarPuedeGestionarCatalogo(usuario);

    if (!data.preguntas.length) {
      throw new Error('Debe registrar al menos una pregunta.');
    }

    if (!data.rangos.length) {
      throw new Error('Debe registrar al menos un rango de resultado.');
    }

    return prisma.testPsicologico.create({
      data: {
        Nombre: normalizarTexto(data.nombre),
        Codigo: normalizarTexto(data.codigo).toUpperCase(),
        Categoria: normalizarTexto(data.categoria),
        Descripcion: data.descripcion?.trim() || null,
        Instrucciones: data.instrucciones?.trim() || null,
        Activo: data.activo ?? true,
        Version: data.version || 1,
        Preguntas: {
          create: data.preguntas.map((pregunta) => ({
            Texto: normalizarTexto(pregunta.texto),
            Orden: pregunta.orden,
            Activa: pregunta.activa ?? true,
            EsCritica: pregunta.esCritica ?? false,
            ValorCriticoMinimo: pregunta.valorCriticoMinimo ?? null,
            Opciones: {
              create: pregunta.opciones.map((opcion) => ({
                Texto: normalizarTexto(opcion.texto),
                Valor: opcion.valor,
                Orden: opcion.orden,
              })),
            },
          })),
        },
        Rangos: {
          create: data.rangos.map((rango) => ({
            PuntajeMin: rango.puntajeMin,
            PuntajeMax: rango.puntajeMax,
            Nivel: normalizarTexto(rango.nivel),
            Descripcion: rango.descripcion?.trim() || null,
          })),
        },
      },
      select: selectTestCompleto,
    });
  },

  cambiarEstadoTest: async (idTest: number, activo: boolean, usuario?: AuthUserPayload) => {
    validarPuedeGestionarCatalogo(usuario);
    validarId(idTest, 'El ID del test no es válido.');

    return prisma.testPsicologico.update({
      where: { ID_Test: idTest },
      data: { Activo: activo },
      select: selectTestCompleto,
    });
  },

  crearAplicacion: async (data: CrearAplicacionTestDTO, usuario?: AuthUserPayload) => {
    const usuarioActual = validarPuedeUsarTestsClinicos(usuario);
    validarId(data.ID_Test, 'El ID del test no es válido.');
    validarId(data.ID_Paciente, 'El ID del paciente no es válido.');

    const test = await prisma.testPsicologico.findUnique({
      where: { ID_Test: data.ID_Test },
      select: {
        ID_Test: true,
        Nombre: true,
        Activo: true,
        _count: {
          select: {
            Preguntas: true,
          },
        },
      },
    });

    if (!test) {
      throw new Error('El test psicológico no existe.');
    }

    if (!test.Activo) {
      throw new Error('El test psicológico está inactivo.');
    }

    if (test._count.Preguntas <= 0) {
      throw new Error('El test psicológico no tiene preguntas configuradas.');
    }

    await validarAccesoPaciente(data.ID_Paciente, usuarioActual);

    if (data.ID_Sesion) {
      await validarSesionPaciente(data.ID_Sesion, data.ID_Paciente, usuarioActual);
    }

    const token = generarToken();
    const expiraHoras = Math.min(Math.max(Number(data.ExpiraHoras || 24), 1), 168);
    const expiraEn = new Date(Date.now() + expiraHoras * 60 * 60 * 1000);

    const idPsicologo = usuarioActual.esPsicologo
      ? validarPsicologoVinculado(usuarioActual)
      : null;

    const aplicacion = await prisma.testAplicacion.create({
      data: {
        ID_Test: data.ID_Test,
        ID_Paciente: data.ID_Paciente,
        ID_Psicologo: idPsicologo,
        ID_Sesion: data.ID_Sesion || null,
        Contexto: data.Contexto,
        Estado: ESTADOS_APLICACION.PENDIENTE,
        TokenHash: hashToken(token),
        ExpiraEn: expiraEn,
        ObservacionPsicologo: data.ObservacionPsicologo?.trim() || null,
        Eventos: {
          create: {
            TipoEvento: 'LINK_GENERADO',
            Descripcion: 'Se generó un enlace público para responder el test psicológico.',
          },
        },
      },
      select: selectAplicacionResumen,
    });

    return {
      aplicacion,
      token,
      urlPublica: construirUrlPublica(token),
    };
  },

  listarResultadosPaciente: async (idPaciente: number, usuario?: AuthUserPayload) => {
    const usuarioActual = validarPuedeUsarTestsClinicos(usuario);
    await validarAccesoPaciente(idPaciente, usuarioActual);

    return prisma.testAplicacion.findMany({
      where: { ID_Paciente: idPaciente },
      orderBy: { FechaCreacion: 'desc' },
      select: selectAplicacionResumen,
    });
  },

  listarResultadosSesion: async (idSesion: number, usuario?: AuthUserPayload) => {
    const usuarioActual = validarPuedeUsarTestsClinicos(usuario);
    validarId(idSesion, 'El ID de la sesión no es válido.');

    const sesion = await prisma.sesion.findUnique({
      where: { ID_Sesion: idSesion },
      select: {
        ID_Sesion: true,
        Cita: {
          select: {
            ID_Paciente: true,
            ID_Psicologo: true,
          },
        },
        Expediente: {
          select: {
            ID_Paciente: true,
          },
        },
      },
    });

    if (!sesion) {
      throw new Error('La sesión clínica no existe.');
    }

    const idPaciente = sesion.Cita?.ID_Paciente || sesion.Expediente?.ID_Paciente || null;

    if (!idPaciente) {
      throw new Error('La sesión clínica no tiene paciente asociado.');
    }

    if (usuarioActual.esPsicologo) {
      const idPsicologo = validarPsicologoVinculado(usuarioActual);

      if (sesion.Cita?.ID_Psicologo && sesion.Cita.ID_Psicologo !== idPsicologo) {
        throw new Error('No tiene permisos para consultar tests de esta sesión.');
      }
    }

    return prisma.testAplicacion.findMany({
      where: { ID_Sesion: idSesion },
      orderBy: { FechaCreacion: 'desc' },
      select: selectAplicacionResumen,
    });
  },

  obtenerAplicacion: async (idAplicacion: number, usuario?: AuthUserPayload) => {
    const usuarioActual = validarPuedeUsarTestsClinicos(usuario);
    validarId(idAplicacion, 'El ID de la aplicación no es válido.');

    const aplicacion = await prisma.testAplicacion.findUnique({
      where: { ID_Aplicacion: idAplicacion },
      select: selectAplicacionResumen,
    });

    if (!aplicacion) {
      throw new Error('La aplicación del test no existe.');
    }

    await validarAccesoPaciente(aplicacion.Paciente.ID_Paciente, usuarioActual);

    return aplicacion;
  },

  anularAplicacion: async (idAplicacion: number, usuario?: AuthUserPayload) => {
    const usuarioActual = validarPuedeUsarTestsClinicos(usuario);
    validarId(idAplicacion, 'El ID de la aplicación no es válido.');

    const aplicacion = await prisma.testAplicacion.findUnique({
      where: { ID_Aplicacion: idAplicacion },
      select: {
        ID_Aplicacion: true,
        ID_Paciente: true,
        Estado: true,
      },
    });

    if (!aplicacion) {
      throw new Error('La aplicación del test no existe.');
    }

    await validarAccesoPaciente(aplicacion.ID_Paciente, usuarioActual);

    if (aplicacion.Estado === ESTADOS_APLICACION.COMPLETADO) {
      throw new Error('No se puede anular un test ya completado.');
    }

    return prisma.testAplicacion.update({
      where: { ID_Aplicacion: idAplicacion },
      data: {
        Estado: ESTADOS_APLICACION.ANULADO,
        Eventos: {
          create: {
            TipoEvento: 'TEST_ANULADO',
            Descripcion: 'La aplicación del test fue anulada por un usuario autorizado.',
          },
        },
      },
      select: selectAplicacionResumen,
    });
  },

  obtenerPublicoPorToken: async (token: string) => {
    if (!token || token.length < 20) {
      throw new Error('El enlace del test no es válido.');
    }

    const aplicacion = await prisma.testAplicacion.findUnique({
      where: { TokenHash: hashToken(token) },
      select: {
        ID_Aplicacion: true,
        Contexto: true,
        Estado: true,
        ExpiraEn: true,
        Test: {
          select: selectTestCompleto,
        },
      },
    });

    if (!aplicacion) {
      throw new Error('El enlace del test no existe.');
    }

    await marcarVencidoSiAplica(aplicacion);

    if (aplicacion.Estado !== ESTADOS_APLICACION.PENDIENTE) {
      throw new Error('Este test ya no está disponible para responder.');
    }

    return {
      ID_Aplicacion: aplicacion.ID_Aplicacion,
      Contexto: aplicacion.Contexto,
      ExpiraEn: aplicacion.ExpiraEn,
      Test: aplicacion.Test,
      aviso: 'Este test es una herramienta de apoyo. No constituye un diagnóstico automático. Los resultados serán revisados por el psicólogo tratante.',
    };
  },

  responderPublico: async (token: string, respuestas: RespuestaPublicaDTO[]) => {
    if (!Array.isArray(respuestas) || respuestas.length === 0) {
      throw new Error('Debe responder el test antes de finalizar.');
    }

    const aplicacion = await prisma.testAplicacion.findUnique({
      where: { TokenHash: hashToken(token) },
      include: {
        Test: {
          include: {
            Preguntas: {
              where: { Activa: true },
              include: {
                Opciones: true,
              },
              orderBy: {
                Orden: 'asc',
              },
            },
          },
        },
      },
    });

    if (!aplicacion) {
      throw new Error('El enlace del test no existe.');
    }

    await marcarVencidoSiAplica(aplicacion);

    if (aplicacion.Estado !== ESTADOS_APLICACION.PENDIENTE) {
      throw new Error('Este test ya no está disponible para responder.');
    }

    const respuestasPorPregunta = new Map<number, RespuestaPublicaDTO>();

    respuestas.forEach((respuesta) => {
      if (Number.isInteger(respuesta.ID_Pregunta) && respuesta.ID_Pregunta > 0) {
        respuestasPorPregunta.set(respuesta.ID_Pregunta, respuesta);
      }
    });

    const respuestasCrear: Prisma.TestRespuestaCreateManyInput[] = [];
    let puntajeTotal = 0;
    let tieneAlertaCritica = false;

    aplicacion.Test.Preguntas.forEach((pregunta) => {
      const respuesta = respuestasPorPregunta.get(pregunta.ID_Pregunta);

      if (!respuesta) {
        throw new Error('Debe responder todas las preguntas del test.');
      }

      const idOpcion = respuesta.ID_Opcion ? Number(respuesta.ID_Opcion) : null;
      const opcion = idOpcion
        ? pregunta.Opciones.find((item) => item.ID_Opcion === idOpcion)
        : null;

      const valor = opcion ? opcion.Valor : Number(respuesta.Valor ?? 0);

      if (!Number.isFinite(valor)) {
        throw new Error('Una de las respuestas tiene un valor inválido.');
      }

      if (idOpcion && !opcion) {
        throw new Error('Una de las opciones seleccionadas no pertenece a la pregunta indicada.');
      }

      puntajeTotal += valor;

      if (pregunta.EsCritica && pregunta.ValorCriticoMinimo !== null && valor >= pregunta.ValorCriticoMinimo) {
        tieneAlertaCritica = true;
      }

      respuestasCrear.push({
        ID_Aplicacion: aplicacion.ID_Aplicacion,
        ID_Pregunta: pregunta.ID_Pregunta,
        ID_Opcion: opcion?.ID_Opcion ?? null,
        Valor: valor,
        TextoLibre: respuesta.TextoLibre?.trim() || null,
      });
    });

    const rango = await seleccionarRango(aplicacion.ID_Test, puntajeTotal);
    const nivel = rango?.Nivel || 'Sin rango configurado';
    const interpretacion = rango?.Descripcion || 'Resultado orientativo. Debe ser interpretado por el psicólogo tratante.';
    const ahora = new Date();

    const resultado = await prisma.$transaction(async (tx) => {
      await tx.testRespuesta.createMany({
        data: respuestasCrear,
      });

      return tx.testAplicacion.update({
        where: { ID_Aplicacion: aplicacion.ID_Aplicacion },
        data: {
          Estado: ESTADOS_APLICACION.COMPLETADO,
          CompletadoEn: ahora,
          PuntajeTotal: puntajeTotal,
          Nivel: nivel,
          Interpretacion: interpretacion,
          TieneAlertaCritica: tieneAlertaCritica,
          Eventos: {
            create: [
              {
                TipoEvento: 'TEST_COMPLETADO',
                Descripcion: 'El paciente completó el test psicológico desde el enlace público.',
              },
              ...(tieneAlertaCritica
                ? [{
                    TipoEvento: 'ALERTA_CRITICA',
                    Descripcion: 'Se detectó una respuesta marcada como crítica durante el test.',
                  }]
                : []),
            ],
          },
        },
        select: {
          ID_Aplicacion: true,
          Estado: true,
          PuntajeTotal: true,
          Nivel: true,
          TieneAlertaCritica: true,
          CompletadoEn: true,
        },
      });
    });

    return {
      ...resultado,
      mensaje: 'Test enviado correctamente. El resultado será revisado por el psicólogo tratante.',
    };
  },
};
