import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

  // 2. Dashboard Stats (KPIs con fix para undefined)
  getDashboardStats: async () => {
    const hoy = new Date();
    const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 0, 0, 0, 0);
    const finDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59, 999);

    const [totalPacientes, psicologosActivos, citasHoy, ingresosTotales] = await Promise.all([
      prisma.paciente.count({ where: { Activo: true } }), 
      prisma.psicologo.count({ where: { Activo: true } }), 
      // 🟢 Ajuste: Contar citas pendientes (ID 1) programadas para el día de hoy
      prisma.cita.count({ where: { ID_EstadoCita: 1, FechaCita: { gte: inicioDia, lte: finDia } } }),
      prisma.recibo.aggregate({ _sum: { MontoTotal: true } })
    ]);

    return { 
      totalPacientes, 
      psicologosActivos, 
      citasHoy, 
      ingresosTotales: Number(ingresosTotales._sum?.MontoTotal) || 0 
    };
  },

  // 🟢 NUEVA FUNCIÓN: Para "Agenda del Día" (Lista de citas de hoy)
  getAgendaHoy: async () => {
    const hoy = new Date();
    const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 0, 0, 0, 0);
    const finDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59, 999);

    return await prisma.cita.findMany({
      where: {
        FechaCita: { gte: inicioDia, lte: finDia },
        ID_EstadoCita: 1 // Solo pendientes
      },
      include: {
        Paciente: { select: { Nombre: true, Apellido: true } },
        Psicologo: { select: { Nombre: true, Apellido: true } },
        TipoDeCita: true
      },
      orderBy: { HoraCita: 'asc' }
    });
  },

  // 3. Historial General
  getHistorialGeneral: async () => {
    const sesiones = await prisma.sesion.findMany({
      include: { 
        Expediente: { include: { Paciente: true } }, 
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
        fechaInicio.setMonth(hoy.getMonth() - 1); // Por defecto último mes
    }
    
    fechaInicio.setHours(0,0,0,0);
    fechaFin.setHours(23,59,59,999);

    // Validación lógica de rango en el servidor
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