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
      codigosTelefono // Nuevos catálogos agregados para el frontend
    ] = await Promise.all([
      prisma.ocupacion.findMany(),
      prisma.estadoCivil.findMany(),
      prisma.parentesco.findMany(),
      prisma.tutor.findMany({ 
          // Ajustado a la tabla intermedia
          include: { Tutor_PacienteMenor: { include: { Parentesco: true } } } 
      }),
      prisma.especialidadPsicologo.findMany(),
      // prisma.estadoDeActividad.findMany(), <-- Eliminado, ahora usamos booleano 'Activo'
      prisma.viaAdministracion.findMany(),
      prisma.tipoDe_Terapia.findMany(), // Renombrado
      prisma.exploracionPsicologica.findMany(),
      prisma.tipoDeCita.findMany(),
      prisma.estadoCita.findMany(),
      prisma.metodoPago.findMany(),
      prisma.pais.findMany(),
      prisma.departamento.findMany(),
      prisma.municipio.findMany({ include: { Departamento: true } }),
      prisma.banco.findMany({ where: { Activo: true } }),
      prisma.divisa.findMany(),
      prisma.codigoTelefonoPais.findMany()
    ]);

    // --- LÓGICA AGREGADA PARA CITA FORM MODAL ---
    const [pacientes, psicologos] = await Promise.all([
        prisma.paciente.findMany({ 
            where: { Activo: true }, // Renombrado
            select: { 
                ID_Paciente: true, Nombre: true, Apellido: true, 
                PacienteAdulto: { select: { No_Cedula: true } }, 
                Activo: true, 
                Direccion: { include: { Municipio: true } } // Renombrado
            } 
        }),
        prisma.psicologo.findMany({ 
            where: { Activo: true }, // Renombrado
            select: { ID_Psicologo: true, Nombre: true, Apellido: true, Activo: true } 
        })
    ]);
    // --------------------------------------------

    return { 
      ocupaciones, estadosCiviles, parentescos, tutores, especialidades, 
      viasAdministracion, tiposTerapia, exploraciones,
      tiposCita, estadosCita, metodosPago, 
      paises,departamentos, municipios, bancos, divisas, codigosTelefono,
      pacientes, psicologos
    };
  },

  // 2. Dashboard KPI (Stats)
  getDashboardStats: async () => {
    // Cálculo de fechas con Zona Horaria Managua
    const hoyNica = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Managua"}));
    const inicioDia = new Date(hoyNica); inicioDia.setHours(0, 0, 0, 0);
    const finDia = new Date(hoyNica); finDia.setHours(23, 59, 59, 999);

    const [totalPacientes, psicologosActivos, citasHoy, ingresosTotales] = await Promise.all([
      prisma.paciente.count({ where: { Activo: true } }), // Renombrado
      prisma.psicologo.count({ where: { Activo: true } }), // Renombrado
      prisma.cita.count({ where: { ID_EstadoCita: 1, FechaCita: { gte: inicioDia, lte: finDia } } }),
      prisma.recibo.aggregate({ _sum: { MontoTotal: true } }) // Cambiado a tabla Recibo
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
    // Adiós al algoritmo de emparejamiento manual. Prisma hace el JOIN directo.
    const citasCompletadas = await prisma.cita.findMany({
       where: { ID_EstadoCita: 2 }, // Solo completadas (que deberían tener sesión)
       include: { 
           TipoDeCita: true,
           Paciente: true,
           Psicologo: true,
           Sesion: { include: { Expediente: true } } // Traemos la sesión directamente
       },
       orderBy: { ID_Cita: 'desc' }
    });

    const historialCombinado = citasCompletadas
      .filter(c => c.Sesion !== null) // Solo las que realmente tienen una sesión guardada
      .map(cita => {
        return {
           ...cita.Sesion, // Exponemos la sesión en la raíz para mantener compatibilidad con el front
           Paciente: cita.Paciente,
           Psicologo: cita.Psicologo,
           FechaReal: cita.FechaCita, 
           DatosCita: {
               Motivo: cita.MotivoConsulta || 'Sin registro',
               Tipo: cita.TipoDeCita?.Nombre_DeCita || 'N/A' // Renombrado
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
    if (!inicioStr) fechaInicio.setMonth(fechaInicio.getMonth() - 1); 
    
    fechaInicio.setHours(0,0,0,0);
    fechaFin.setHours(23,59,59,999);

    // A. Ingresos agrupados por día (Cambiado a tabla Recibo)
    const recibos = await prisma.recibo.groupBy({
      by: ['FechaDePago'], // Renombrado
      where: { FechaDePago: { gte: fechaInicio, lte: fechaFin } },
      _sum: { MontoTotal: true },
      orderBy: { FechaDePago: 'asc' }
    });

    const dataIngresos = recibos.map(r => ({
      // Verificamos que FechaDePago exista. Si no, ponemos un string por defecto.
      fecha: r.FechaDePago ? r.FechaDePago.toISOString().split('T')[0] : 'Desconocida',
      monto: r._sum.MontoTotal || 0
    }));

    // B. Distribución Demográfica (Género y Edad)
    const pacientes = await prisma.paciente.findMany({
      where: { Activo: true }, // Renombrado
      select: { Genero: true, Fecha_Nacimiento: true } // Renombrado
    });

    // Al quitar el Record, TypeScript sabe que este objeto SIEMPRE 
    // tendrá estas dos llaves y que SIEMPRE serán números.
    const generos = { Masculino: 0, Femenino: 0 };
    const edades = { Ninos: 0, Adolescentes: 0, Adultos: 0, Mayores: 0 };

    pacientes.forEach(p => {
      // 1. Género (Evaluación estricta para evitar undefined)
      if (p.Genero === 'Masculino') {
          generos.Masculino++;
      } else if (p.Genero === 'Femenino') {
          generos.Femenino++;
      }
      
      // 2. Edad (Protegemos por si Fecha_Nacimiento viene nula)
      if (p.Fecha_Nacimiento) {
          const edad = new Date().getFullYear() - new Date(p.Fecha_Nacimiento).getFullYear();
          if (edad < 12) edades.Ninos++;
          else if (edad < 18) edades.Adolescentes++;
          else if (edad < 60) edades.Adultos++;
          else edades.Mayores++;
      }
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
  },

  getMotivosCancelacion: async () => {
    return await prisma.motivoCancelacion.findMany();
  }
};