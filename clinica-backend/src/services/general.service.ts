import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const GeneralService = {

  // 1. Catálogos Generales
  getCatalogos: async () => {
    const [
      ocupaciones, 
      estadosCiviles, 
      parentescos, 
      tutores, 
      especialidades, 
      estadosActividad,
      viasAdministracion,
      tiposTerapia,
      exploraciones
    ] = await Promise.all([
      prisma.ocupacion.findMany(),
      prisma.estadoCivil.findMany(),
      prisma.parentesco.findMany(),
      prisma.tutor.findMany({ include: { Parentesco: true } }),
      prisma.especialidadPsicologo.findMany(),
      prisma.estadoDeActividad.findMany(),
      prisma.viaAdministracion.findMany(),
      prisma.tipoDeTerapia.findMany(),
      prisma.exploracionPsicologica.findMany()
    ]);

    return { 
      ocupaciones, estadosCiviles, parentescos, tutores, especialidades, 
      estadosActividad, viasAdministracion, tiposTerapia, exploraciones
    };
  },

  // 2. Dashboard KPI (Stats)
  getDashboardStats: async () => {
    // Cálculo de fechas con Zona Horaria Managua
    const hoyNica = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Managua"}));
    const inicioDia = new Date(hoyNica); inicioDia.setHours(0, 0, 0, 0);
    const finDia = new Date(hoyNica); finDia.setHours(23, 59, 59, 999);

    const [totalPacientes, psicologosActivos, citasHoy, ingresosTotales] = await Promise.all([
      prisma.paciente.count({ where: { ID_EstadoDeActividad: 1 } }),
      prisma.psicologo.count({ where: { ID_EstadoDeActividad: 1 } }),
      prisma.cita.count({ where: { ID_EstadoCita: 1, FechaCita: { gte: inicioDia, lte: finDia } } }),
      prisma.factura.aggregate({ _sum: { MontoTotal: true } })
    ]);

    return { 
      totalPacientes, 
      psicologosActivos, 
      citasHoy, 
      ingresosTotales: ingresosTotales._sum.MontoTotal || 0 
    };
  },

  // 3. Historial General Combinado
  getHistorialGeneral: async () => {
    const sesiones = await prisma.sesion.findMany({
      include: { Paciente: true, Psicologo: true, Expediente: true },
      orderBy: { ID_Sesion: 'desc' }
    });
    
    const citas = await prisma.cita.findMany({
       where: { ID_EstadoCita: 2 }, // Solo completadas
       include: { TipoDeCita: true },
       orderBy: { ID_Cita: 'desc' }
    });

    // Algoritmo de emparejamiento en memoria (Preservado de tu código original)
    const mapaCitas: Record<string, typeof citas> = {};
    citas.forEach(c => {
      const key = `${c.ID_Paciente}-${c.ID_Psicologo}`;
      if (!mapaCitas[key]) mapaCitas[key] = [];
      mapaCitas[key].push(c);
    });

    const historialCombinado = sesiones.map(sesion => {
       const key = `${sesion.ID_Paciente}-${sesion.ID_Psicologo}`;
       const citaMatch = mapaCitas[key]?.shift();
       return {
          ...sesion,
          FechaReal: citaMatch ? citaMatch.FechaCita : null, 
          DatosCita: {
             Motivo: citaMatch?.MotivoConsulta || 'Sin registro de cita vinculado',
             Tipo: citaMatch?.TipoDeCita?.NombreDeCita || 'N/A'
          }
       };
    });

    return historialCombinado;
  },

  // 4. Datos para Gráficos
  getGraficosData: async (inicioStr?: string, finStr?: string) => {
    // Definir rango de fechas
    const hoy = new Date();
    const fechaFin = finStr ? new Date(finStr) : hoy;
    
    let fechaInicio = inicioStr ? new Date(inicioStr) : new Date();
    if (!inicioStr) fechaInicio.setMonth(fechaInicio.getMonth() - 1); // Default: último mes
    
    fechaInicio.setHours(0,0,0,0);
    fechaFin.setHours(23,59,59,999);

    // A. Ingresos agrupados por día
    const facturas = await prisma.factura.groupBy({
      by: ['FechaFactura'],
      where: { FechaFactura: { gte: fechaInicio, lte: fechaFin } },
      _sum: { MontoTotal: true },
      orderBy: { FechaFactura: 'asc' }
    });

    const dataIngresos = facturas.map(f => ({
      fecha: f.FechaFactura.toISOString().split('T')[0],
      monto: f._sum.MontoTotal || 0
    }));

    // B. Distribución Demográfica (Género y Edad)
    const pacientes = await prisma.paciente.findMany({
      where: { ID_EstadoDeActividad: 1 },
      select: { Genero: true, Fecha_Nac: true }
    });

    const generos: Record<string, number> = { Masculino: 0, Femenino: 0 };
    const edades = { Ninos: 0, Adolescentes: 0, Adultos: 0, Mayores: 0 };

    pacientes.forEach(p => {
      // Género
      if (generos[p.Genero] !== undefined) generos[p.Genero]++;
      
      // Edad
      const edad = new Date().getFullYear() - new Date(p.Fecha_Nac).getFullYear();
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
        { name: 'Niños (0-11)', value: edades.Ninos, fill: '#10b981' },
        { name: 'Adolescentes (12-17)', value: edades.Adolescentes, fill: '#f59e0b' },
        { name: 'Adultos (18-59)', value: edades.Adultos, fill: '#6366f1' },
        { name: 'Mayores (60+)', value: edades.Mayores, fill: '#64748b' },
      ].filter(d => d.value > 0)
    };
  }
};