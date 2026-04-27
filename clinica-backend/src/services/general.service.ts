import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper para obtener el rango de hoy ajustado a Nicaragua (UTC-6)
const getRangoHoyNica = () => {
  const hoy = new Date();
  // Ajustamos restando 6 horas al tiempo UTC para obtener la fecha real en Nicaragua
  const nicaTime = new Date(hoy.getTime() - (6 * 60 * 60 * 1000));
  
  const inicioDia = new Date(nicaTime);
  inicioDia.setUTCHours(0, 0, 0, 0);

  const finDia = new Date(nicaTime);
  finDia.setUTCHours(23, 59, 59, 999);

  return { inicioDia, finDia };
};

export const GeneralService = {

  // 1. Catálogos Generales (Para llenar Selects y Modales)
  getCatalogos: async () => {
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
      divisas,
      roles 
    ] = await Promise.all([
      prisma.ocupacion.findMany(),
      prisma.estadoCivil.findMany(),
      prisma.parentesco.findMany(),
      prisma.tutor.findMany({ 
        include: { 
          EstadoCivil_Tutor_EstadoCivilToEstadoCivil: true,
          Ocupacion_Tutor_OcupacionToOcupacion: true
        } 
      }), 
      prisma.especialidadPsicologo.findMany(),
      prisma.viaAdministracion.findMany(),
      prisma.tipoDe_Terapia.findMany(),
      prisma.exploracionPsicologica.findMany(),
      prisma.tipoDeCita.findMany(),
      prisma.estadoCita.findMany(),
      prisma.metodoPago.findMany(),
      prisma.divisa.findMany(),
      prisma.rol.findMany() 
    ]);

    const [pacientes, psicologos] = await Promise.all([
        prisma.paciente.findMany({ 
            where: { Activo: true }, 
            select: { 
              ID_Paciente: true, 
              Nombre: true, 
              Apellido: true, 
              ID_Direccion: true 
            } 
        }),
        prisma.psicologo.findMany({ 
            where: { Activo: true }, 
            select: { ID_Psicologo: true, Nombre: true, Apellido: true } 
        })
    ]);

    return { 
      ocupaciones, estadosCiviles, parentescos, tutores, especialidades, 
      viasAdministracion, tiposTerapia, exploraciones,
      tiposCita, estadosCita, metodosPago, divisas, pacientes, psicologos, roles
    };
  },

  // 2. Dashboard Stats (KPIs con fix para undefined y zona horaria)
  getDashboardStats: async () => {
    const { inicioDia, finDia } = getRangoHoyNica();

    const [totalPacientes, psicologosActivos, citasHoy, ingresosTotales] = await Promise.all([
      prisma.paciente.count({ where: { OR: [{ Activo: true }, { Activo: null }] } }), 
      prisma.psicologo.count({ where: { OR: [{ Activo: true }, { Activo: null }] } }), 
      prisma.cita.count({ where: { ID_EstadoCita: 1, FechaCita: { gte: inicioDia, lte: finDia } } }),
      prisma.recibo.aggregate({ _sum: { MontoTotal: true } })
    ]);

    return { 
      totalPacientes, 
      psicologosActivos, 
      citasHoy, 
      ingresosTotalesNIO: Number(ingresosTotales._sum?.MontoTotal) || 0 
    };
  },

  // 🟢 FUNCIÓN CORREGIDA: Incluye Expediente y Sesión para evitar errores de UI
  getAgendaHoy: async () => {
    const { inicioDia, finDia } = getRangoHoyNica();

    return await prisma.cita.findMany({
      where: {
        FechaCita: { gte: inicioDia, lte: finDia },
        ID_EstadoCita: 1 // Solo pendientes
      },
      include: {
        Paciente: { 
          include: { 
            Expediente: true // 🟢 CORRECCIÓN: Para que aparezca el No_Expediente
          } 
        },
        Psicologo: { select: { Nombre: true, Apellido: true } },
        TipoDeCita: true,
        Sesion: true // 🟢 CORRECCIÓN: Para obtener la fecha real de sesión si existe
      },
      orderBy: { HoraCita: 'asc' }
    });
  },

  // 3. Historial General
  getHistorialGeneral: async () => {
    const sesiones = await prisma.sesion.findMany({
      include: { 
        // 🟢 CORRECCIÓN: Aseguramos que el expediente venga con su número
        Expediente: { include: { Paciente: true } }, 
        // 🟢 CORRECCIÓN: Aseguramos que la cita venga con su fecha para evitar el 1970
        Cita: { include: { Psicologo: true, TipoDeCita: true } } 
      },
      orderBy: { ID_Sesion: 'desc' }
    });
    
    return sesiones.map(sesion => ({
      ...sesion,
      Paciente: sesion.Expediente?.Paciente || null,
      Psicologo: sesion.Cita?.Psicologo || null,
      FechaReal: sesion.Cita?.FechaCita || null,
      DatosCita: {
        Motivo: sesion.Cita?.MotivoConsulta || 'Consulta clínica',
        Tipo: sesion.Cita?.TipoDeCita?.Nombre_DeCita || 'N/A'
      }
    }));
  },

  // 4. Datos para Gráficos (Ajustado para filtros por rango)
  getGraficosData: async (inicioStr?: string, finStr?: string) => {
    const hoy = new Date();
    let fechaFin = finStr ? new Date(finStr) : hoy;
    let fechaInicio = inicioStr ? new Date(inicioStr) : new Date();
    
    if (!inicioStr) {
        fechaInicio.setMonth(hoy.getMonth() - 1); 
    }
    
    fechaInicio.setHours(0,0,0,0);
    fechaFin.setHours(23,59,59,999);

    if (fechaInicio > fechaFin) {
        throw new Error("La fecha inicial no puede ser mayor a la fecha final.");
    }

    const recibos = await prisma.recibo.groupBy({
      by: ['FechaRecibo'],
      where: { 
        FechaRecibo: { gte: fechaInicio, lte: fechaFin },
        MontoTotal: { not: null }
      }, 
      _sum: { MontoTotal: true },
      orderBy: { FechaRecibo: 'asc' }
    });

    const dataIngresos = recibos.map(r => ({
      fecha: r.FechaRecibo ? r.FechaRecibo.toISOString().split('T')[0] : 'S/F', 
      monto: Number(r._sum?.MontoTotal) || 0
    }));

    const pacientes = await prisma.paciente.findMany({
      where: { Activo: true }, 
      select: { Genero: true, Fecha_Nacimiento: true } 
    });

    const generos = { Masculino: 0, Femenino: 0 };
    const edades = { Ninos: 0, Adolescentes: 0, Adultos: 0, Mayores: 0 };

    pacientes.forEach(p => {
      const g = p.Genero.charAt(0).toUpperCase() + p.Genero.slice(1).toLowerCase();
      if (g in generos) {
        generos[g as keyof typeof generos]++;
      }
      
      const edad = new Date().getFullYear() - new Date(p.Fecha_Nacimiento).getFullYear();
      if (edad < 12) edades.Ninos++;
      else if (edad < 18) edades.Adolescentes++;
      else if (edad < 60) edades.Adultos++;
      else edades.Mayores++;
    });

    return {
      ingresos: dataIngresos,
      generos: [
        { name: 'Femenino', value: generos.Femenino, fill: '#ec4899' },
        { name: 'Masculino', value: generos.Masculino, fill: '#3b82f6' }
      ],
      edades: [
        { name: 'Niños', value: edades.Ninos, fill: '#10b981' },
        { name: 'Adolescentes', value: edades.Adolescentes, fill: '#f59e0b' },
        { name: 'Adultos', value: edades.Adultos, fill: '#6366f1' },
        { name: 'Mayores', value: edades.Mayores, fill: '#64748b' },
      ].filter(d => d.value > 0)
    };
  },

  getMotivosCancelacion: async () => {
    return await prisma.motivoCancelacion.findMany();
  }

};