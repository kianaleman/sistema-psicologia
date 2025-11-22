import { PrismaClient, type Cita, type Factura } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateCitaDTO {
  fecha: string;      
  hora: string;       
  motivo: string;
  tipoCitaId: number;
  pacienteId: number;
  psicologoId: number;
  precio: number;
  metodoPagoId: number;
  direccion: {
    pais?: string;
    departamento: string;
    ciudad: string;
    barrio: string;
    calle: string;
  };
}

interface UpdateCitaDTO extends CreateCitaDTO {}

// --- FUNCIÓN HELPER CORREGIDA ---
const verificarDisponibilidad = async (
  psicologoId: number, 
  fecha: Date, 
  horaUTC: Date, 
  citaIdExcluir?: number
) => {
  // 1. Traemos todas las citas del doctor EN ESA FECHA
  // (Evitamos filtrar por HoraCita aquí para no causar el error de SQL Server)
  const citasDelDia = await prisma.cita.findMany({
    where: {
      ID_Psicologo: psicologoId,
      FechaCita: fecha, // Comparar DATE con DATE es seguro
      ID_EstadoCita: { not: 3 }, // Ignoramos canceladas
      // Excluir la cita actual si estamos editando
      ID_Cita: citaIdExcluir ? { not: citaIdExcluir } : undefined
    }
  });

  // 2. Filtramos en memoria (JS) comparando horas y minutos UTC
  // Esto es 100% seguro y evita el conflicto de tipos time/datetime2
  const conflicto = citasDelDia.find(c => {
    const horaDb = new Date(c.HoraCita); // Prisma devuelve la Time como Date (1970-01-01 T...)
    const horaNueva = new Date(horaUTC);
    
    return horaDb.getUTCHours() === horaNueva.getUTCHours() &&
           horaDb.getUTCMinutes() === horaNueva.getUTCMinutes();
  });

  if (conflicto) {
    throw new Error('El psicólogo ya tiene una cita agendada en este horario.');
  }
};

export const CitaService = {
  
  getAll: async () => {
    const citas = await prisma.cita.findMany({
      include: {
        Paciente: true, 
        Psicologo: true,
        TipoDeCita: true,
        EstadoCita: true,
        Factura: true,
        DireccionCita: true
      },
      orderBy: [
        { FechaCita: 'asc' }, 
        { HoraCita: 'asc' }
      ]
    });
    

    const contadores: Record<number, number> = {};

    const citasNumeradas = citas.map(cita => {
      if (cita.ID_EstadoCita === 3) {
        return { ...cita, NumeroSesion: null };
      }
      const pid = cita.ID_Paciente;
      if (!contadores[pid]) contadores[pid] = 0;
      contadores[pid]++;

      return { ...cita, NumeroSesion: contadores[pid] };
    });

    return citasNumeradas.reverse();
  },

  getCatalogos: async () => {
    const [tiposCita, estadosCita, metodosPago] = await Promise.all([
      prisma.tipoDeCita.findMany(),
      prisma.estadoCita.findMany(),
      prisma.metodoPago.findMany()
    ]);
    return { tiposCita, estadosCita, metodosPago };
  },

  create: async (data: CreateCitaDTO) => {
    // 1. VALIDACIÓN DE ESTADO DEL PACIENTE (NUEVO)
    // Consultamos solo el estado para ser eficientes
    const pacienteCheck = await prisma.paciente.findUnique({
      where: { ID_Paciente: data.pacienteId },
      select: { ID_EstadoDeActividad: true, Nombre: true, Apellido: true }
    });

    if (!pacienteCheck) throw new Error('El paciente seleccionado no existe.');

    // ID 1 = Activo (según tus seeds/lógica). Si es diferente, bloqueamos.
    if (pacienteCheck.ID_EstadoDeActividad !== 1) {
      throw new Error(`No se puede agendar: El paciente ${pacienteCheck.Nombre} ${pacienteCheck.Apellido} está INACTIVO.`);
    }

    // 2. VALIDACIÓN PSICÓLOGO (NUEVO) 🔒
    const psicologoCheck = await prisma.psicologo.findUnique({
      where: { ID_Psicologo: data.psicologoId },
      select: { ID_EstadoDeActividad: true, Nombre: true, Apellido: true }
    });
    if (!psicologoCheck) throw new Error('Psicólogo no encontrado.');
    // Asumimos ID 1 = Activo
    if (psicologoCheck.ID_EstadoDeActividad !== 1) {
      throw new Error(`No disponible: El Dr. ${psicologoCheck.Apellido} está marcado como INACTIVO.`);
    }

    const [horas, minutos] = data.hora.split(':').map(Number);
    if (isNaN(horas) || isNaN(minutos)) throw new Error('Hora inválida');

    const fechaObj = new Date(data.fecha);
    const fechaDeLaCita = new Date(data.fecha);
    fechaDeLaCita.setUTCHours(horas, minutos, 0, 0);

    // 3. Validación de Disponibilidad
    await verificarDisponibilidad(data.psicologoId, fechaObj, fechaDeLaCita);

    const fechaHoraActual = new Date();
    // Ajuste manual de hora Nica para el registro de pago
    const horaPagoNica = new Date(fechaHoraActual.getTime() - (6 * 60 * 60 * 1000));

    return await prisma.$transaction(async (tx) => {
      // --- CAMBIO AQUÍ: Usamos los datos recibidos ---
      const direccionClinica = await tx.direccionCita.create({
        data: { 
          Pais: data.direccion.pais || 'Nicaragua', 
          Departamento: data.direccion.departamento, 
          Ciudad: data.direccion.ciudad, 
          Barrio: data.direccion.barrio, 
          Calle: data.direccion.calle 
        }
      });
      // ----------------------------------------------

      const citaCreada = await tx.cita.create({
        data: {
          FechaCita: fechaObj,
          // Al insertar, Prisma maneja la conversión a TIME correctamente
          HoraCita: fechaDeLaCita, 
          MotivoConsulta: data.motivo,
          ID_TipoCita: data.tipoCitaId,
          ID_EstadoCita: 1, 
          ID_Paciente: data.pacienteId,
          ID_Psicologo: data.psicologoId,
          ID_DireccionCita: direccionClinica.ID_DireccionCita
        }
      });

      const facturaCreada = await tx.factura.create({
        data: {
          ID_Cita: citaCreada.ID_Cita,
          FechaFactura: fechaObj,
          MontoTotal: data.precio
        }
      });

      await tx.detalleFactura.create({
        data: {
          Cod_Factura: facturaCreada.Cod_Factura,
          ID_MetodoPago: data.metodoPagoId,
          PrecioDeCita: data.precio,
          FechaDePago: fechaHoraActual,
          HoraDePago: horaPagoNica,
          Observacion: 'Pago registrado al agendar cita'
        }
      });
      
      return { cita: citaCreada, factura: facturaCreada };
    });
  },

  update: async (id: number, data: UpdateCitaDTO) => {

    // 1. VALIDACIÓN DE ESTADO DEL PACIENTE (NUEVO)
    // También validamos al editar, por si intentan cambiar el paciente a uno inactivo
    const pacienteCheck = await prisma.paciente.findUnique({
      where: { ID_Paciente: data.pacienteId },
      select: { ID_EstadoDeActividad: true }
    });

    if (pacienteCheck && pacienteCheck.ID_EstadoDeActividad !== 1) {
       throw new Error('No se puede asignar esta cita a un paciente INACTIVO.');
    }

    // VALIDACIÓN PSICÓLOGO EN UPDATE (NUEVO) 🔒
    const psicologoCheck = await prisma.psicologo.findUnique({
      where: { ID_Psicologo: data.psicologoId },
      select: { ID_EstadoDeActividad: true }
    });
    if (psicologoCheck && psicologoCheck.ID_EstadoDeActividad !== 1) {
       throw new Error('El psicólogo seleccionado está INACTIVO.');
    }

    const [horas, minutos] = data.hora.split(':').map(Number);
    if (isNaN(horas) || isNaN(minutos)) throw new Error('Hora inválida');

    const fechaObj = new Date(data.fecha);
    const fechaDeLaCita = new Date(data.fecha);
    fechaDeLaCita.setUTCHours(horas, minutos, 0, 0);

    // --- VALIDACIÓN (Pasamos ID para excluirse a sí misma) ---
    await verificarDisponibilidad(data.psicologoId, fechaObj, fechaDeLaCita, id);
    // --------------------------------------------------------

    await prisma.$transaction(async (tx) => {
      await tx.cita.update({
        where: { ID_Cita: id },
        data: {
          FechaCita: fechaObj,
          HoraCita: fechaDeLaCita,
          MotivoConsulta: data.motivo,
          ID_TipoCita: data.tipoCitaId,
          ID_Paciente: data.pacienteId,
          ID_Psicologo: data.psicologoId
        }
      });

      const factura = await tx.factura.findFirst({ where: { ID_Cita: id } });
      if (factura) {
        await tx.factura.update({
          where: { Cod_Factura: factura.Cod_Factura },
          data: { 
            FechaFactura: fechaObj,
            MontoTotal: data.precio
          }
        });
        
        await tx.detalleFactura.updateMany({
           where: { Cod_Factura: factura.Cod_Factura },
           data: { 
             ID_MetodoPago: data.metodoPagoId,
             PrecioDeCita: data.precio 
           }
        });
      }
    });
    return { message: 'Cita actualizada' };
  },

  cancel: async (id: number) => {
    return await prisma.cita.update({
      where: { ID_Cita: id },
      data: { ID_EstadoCita: 3 } 
    });
  }
};