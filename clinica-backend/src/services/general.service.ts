import { PrismaClient, type Prisma } from '@prisma/client';
import type { AuthUserPayload } from '../middlewares/auth.middleware.js';

const prisma = new PrismaClient();

const validarUsuarioAutenticado = (usuario?: AuthUserPayload) => {
  if (!usuario) {
    throw new Error('Acceso no autorizado.');
  }

  return usuario;
};

const validarPsicologoVinculado = (usuario: AuthUserPayload) => {
  if (!usuario.idPsicologo) {
    throw new Error('El usuario psicólogo no tiene un perfil de psicólogo vinculado.');
  }

  return usuario.idPsicologo;
};

const whereCitasPermitidas = (usuario: AuthUserPayload): Prisma.CitaWhereInput => {
  if (usuario.esAdmin || usuario.esRecepcion) {
    return {};
  }

  if (usuario.esPsicologo) {
    return {
      ID_Psicologo: validarPsicologoVinculado(usuario),
    };
  }

  throw new Error('No tiene permisos para consultar información de citas.');
};

const whereRecibosPermitidos = (usuario: AuthUserPayload): Prisma.ReciboWhereInput => {
  if (usuario.esAdmin || usuario.esRecepcion) {
    return {};
  }

  if (usuario.esPsicologo) {
    return {
      Cita: {
        ID_Psicologo: validarPsicologoVinculado(usuario),
      },
    };
  }

  throw new Error('No tiene permisos para consultar información financiera.');
};

const whereHistorialPermitido = (usuario: AuthUserPayload): Prisma.CitaWhereInput => {
  if (usuario.esAdmin) {
    return {};
  }

  if (usuario.esPsicologo) {
    return {
      ID_Psicologo: validarPsicologoVinculado(usuario),
    };
  }

  throw new Error('No tiene permisos para consultar historial clínico.');
};

export const GeneralService = {
  getCatalogos: async (usuario?: AuthUserPayload) => {
    const usuarioActual = validarUsuarioAutenticado(usuario);

    const [
      ocupaciones,
      estadosCiviles,
      parentescos,
      tutores,
      especialidades,
      viasAdministracion,
      tiposTerapia,
      exploraciones,
      tiposCita,
      estadosCita,
      metodosPago,
      paises,
      departamentos,
      municipios,
      bancos,
      divisas,
      codigosTelefono,
    ] = await Promise.all([
      prisma.ocupacion.findMany(),
      prisma.estadoCivil.findMany(),
      prisma.parentesco.findMany(),
      prisma.tutor.findMany({
        include: {
          Tutor_PacienteMenor: {
            include: {
              Parentesco: true,
            },
          },
        },
      }),
      prisma.especialidadPsicologo.findMany(),
      prisma.viaAdministracion.findMany(),
      prisma.tipoDe_Terapia.findMany(),
      prisma.exploracionPsicologica.findMany(),
      prisma.tipoDeCita.findMany(),
      prisma.estadoCita.findMany(),
      prisma.metodoPago.findMany(),
      prisma.pais.findMany(),
      prisma.departamento.findMany(),
      prisma.municipio.findMany({
        include: {
          Departamento: true,
        },
      }),
      prisma.banco.findMany({
        where: {
          Activo: true,
        },
      }),
      prisma.divisa.findMany(),
      prisma.codigoTelefonoPais.findMany(),
    ]);

    const [pacientes, psicologos] = await Promise.all([
      prisma.paciente.findMany({
        where: {
          Activo: true,
        },
        select: {
          ID_Paciente: true,
          Nombre: true,
          Apellido: true,
          Activo: true,
          ID_Direccion: true,
          PacienteAdulto: {
            select: {
              No_Cedula: true,
            },
          },
          Direccion: {
            include: {
              Municipio: {
                include: {
                  Departamento: true,
                },
              },
            },
          },
        },
      }),
      prisma.psicologo.findMany({
        where: {
          Activo: true,
          ...(usuarioActual.esPsicologo
            ? {
                ID_Psicologo: validarPsicologoVinculado(usuarioActual),
              }
            : {}),
        },
        select: {
          ID_Psicologo: true,
          Nombre: true,
          Apellido: true,
          Activo: true,
        },
      }),
    ]);

    return {
      ocupaciones,
      estadosCiviles,
      parentescos,
      tutores,
      especialidades,
      viasAdministracion,
      tiposTerapia,
      exploraciones,
      tiposCita,
      estadosCita,
      metodosPago,
      paises,
      departamentos,
      municipios,
      bancos,
      divisas,
      codigosTelefono,
      pacientes,
      psicologos,
    };
  },

  getDashboardStats: async (usuario?: AuthUserPayload) => {
    const usuarioActual = validarUsuarioAutenticado(usuario);

    const hoyNica = new Date(new Date().toLocaleString('en-US', {
      timeZone: 'America/Managua',
    }));

    const inicioDia = new Date(hoyNica);
    inicioDia.setHours(0, 0, 0, 0);

    const finDia = new Date(hoyNica);
    finDia.setHours(23, 59, 59, 999);

    const citasWhere: Prisma.CitaWhereInput = {
      ...whereCitasPermitidas(usuarioActual),
      ID_EstadoCita: 1,
      FechaCita: {
        gte: inicioDia,
        lte: finDia,
      },
    };

    const recibosWhere = whereRecibosPermitidos(usuarioActual);

    const [totalPacientes, psicologosActivos, citasHoy, ingresosTotales] = await Promise.all([
      prisma.paciente.count({
        where: {
          Activo: true,
        },
      }),
      prisma.psicologo.count({
        where: {
          Activo: true,
        },
      }),
      prisma.cita.count({
        where: citasWhere,
      }),
      prisma.recibo.aggregate({
        where: recibosWhere,
        _sum: {
          MontoTotal: true,
        },
      }),
    ]);

    return {
      totalPacientes,
      psicologosActivos,
      citasHoy,
      ingresosTotales: ingresosTotales._sum.MontoTotal || 0,
    };
  },

  getHistorialGeneral: async (usuario?: AuthUserPayload) => {
    const usuarioActual = validarUsuarioAutenticado(usuario);

    const citasCompletadas = await prisma.cita.findMany({
      where: {
        ...whereHistorialPermitido(usuarioActual),
        ID_EstadoCita: 2,
      },
      include: {
        TipoDeCita: true,
        Paciente: true,
        Psicologo: true,
        Sesion: {
          include: {
            Expediente: true,
          },
        },
      },
      orderBy: {
        ID_Cita: 'desc',
      },
    });

    return citasCompletadas
      .filter((cita) => cita.Sesion !== null)
      .map((cita) => ({
        ...cita.Sesion,
        Paciente: cita.Paciente,
        Psicologo: cita.Psicologo,
        FechaReal: cita.FechaCita,
        DatosCita: {
          Motivo: cita.MotivoConsulta || 'Sin registro',
          Tipo: cita.TipoDeCita?.Nombre_DeCita || 'N/A',
        },
      }));
  },

  getGraficosData: async (
    inicioStr?: string,
    finStr?: string,
    usuario?: AuthUserPayload
  ) => {
    const usuarioActual = validarUsuarioAutenticado(usuario);

    const hoy = new Date();
    const fechaFin = finStr ? new Date(finStr) : hoy;

    const fechaInicio = inicioStr ? new Date(inicioStr) : new Date();

    if (!inicioStr) {
      fechaInicio.setMonth(fechaInicio.getMonth() - 1);
    }

    fechaInicio.setHours(0, 0, 0, 0);
    fechaFin.setHours(23, 59, 59, 999);

    const recibos = await prisma.recibo.groupBy({
      by: ['FechaDePago'],
      where: {
        ...whereRecibosPermitidos(usuarioActual),
        FechaDePago: {
          gte: fechaInicio,
          lte: fechaFin,
        },
      },
      _sum: {
        MontoTotal: true,
      },
      orderBy: {
        FechaDePago: 'asc',
      },
    });

    const dataIngresos = recibos.map((recibo) => ({
      fecha: recibo.FechaDePago ? recibo.FechaDePago.toISOString().split('T')[0] : 'Desconocida',
      monto: recibo._sum.MontoTotal || 0,
    }));

    const pacientes = await prisma.paciente.findMany({
      where: {
        Activo: true,
      },
      select: {
        Genero: true,
        Fecha_Nacimiento: true,
      },
    });

    const generos = {
      Masculino: 0,
      Femenino: 0,
    };

    const edades = {
      Ninos: 0,
      Adolescentes: 0,
      Adultos: 0,
      Mayores: 0,
    };

    pacientes.forEach((paciente) => {
      if (paciente.Genero === 'Masculino') {
        generos.Masculino += 1;
      } else if (paciente.Genero === 'Femenino') {
        generos.Femenino += 1;
      }

      if (paciente.Fecha_Nacimiento) {
        const edad = new Date().getFullYear() - new Date(paciente.Fecha_Nacimiento).getFullYear();

        if (edad < 12) edades.Ninos += 1;
        else if (edad < 18) edades.Adolescentes += 1;
        else if (edad < 60) edades.Adultos += 1;
        else edades.Mayores += 1;
      }
    });

    return {
      ingresos: dataIngresos,
      generos: [
        {
          name: 'Femenino',
          value: generos.Femenino,
          fill: '#ec4899',
        },
        {
          name: 'Masculino',
          value: generos.Masculino,
          fill: '#3b82f6',
        },
      ],
      edades: [
        {
          name: 'Niños (0-11)',
          value: edades.Ninos,
          fill: '#10b981',
        },
        {
          name: 'Adolescentes (12-17)',
          value: edades.Adolescentes,
          fill: '#f59e0b',
        },
        {
          name: 'Adultos (18-59)',
          value: edades.Adultos,
          fill: '#6366f1',
        },
        {
          name: 'Mayores (60+)',
          value: edades.Mayores,
          fill: '#64748b',
        },
      ].filter((item) => item.value > 0),
    };
  },

  getMotivosCancelacion: async () => {
    return await prisma.motivoCancelacion.findMany();
  },
};
