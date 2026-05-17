import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// DTOs (Data Transfer Objects)
interface TratamientoInput {
  tipo: 'farmacologico' | 'terapeutico';
  frecuencia: string;
  // Farmacológico
  medicamento?: string;
  dosis?: string;
  viaAdminId?: number | string;
  // Terapéutico
  tipoTerapiaId?: number | string;
  objetivo?: string;
}

interface CreateSesionDTO {
  citaId: number;
  observaciones: string;
  diagnostico: string;
  criterios?: string;
  historial?: string;
  horaInicio: string; // "HH:MM"
  tratamientos: TratamientoInput[];
  exploracionIds: number[];
}

export const SesionService = {

  create: async (data: CreateSesionDTO) => {
    return await prisma.$transaction(async (tx) => {
      
      // 0. Obtener la información del paciente a través de la Cita
      const citaActual = await tx.cita.findUnique({
        where: { ID_Cita: data.citaId },
        select: { ID_Paciente: true, ID_Psicologo: true }
      });

      if (!citaActual) {
          throw new Error("La cita proporcionada no existe.");
      }

      // 1. Buscar o Crear Expediente (Viajando por las relaciones)
      const pacienteActual = await tx.paciente.findUnique({
        where: { ID_Paciente: citaActual.ID_Paciente },
        include: { Expediente: true }
      });
      
      // En la nueva BD, un paciente tiene un arreglo de expedientes (aunque en la práctica sea uno).
      // Tomamos el primero si existe.
      let expedienteId = pacienteActual?.Expediente?.ID_Expediente;

      if (!expedienteId) {
        const nuevoExp = await tx.expediente.create({
          data: { 
            No_Expediente: `EXP-${Date.now()}`, 
            FechaIngreso: new Date(),
            ID_Paciente: citaActual.ID_Paciente // El expediente sí está vinculado al paciente
          }
        });
        expedienteId = nuevoExp.ID_Expediente;
      }

      // 2. Manejo de Horas (CORREGIDO)
      const horaInicioParts = data.horaInicio.split(':');
      const fechaInicio = new Date(); 
      
      // Extraemos y aseguramos que siempre sea string para el parseInt
      const horaStr = horaInicioParts[0] ?? '0';
      const minStr = horaInicioParts[1] ?? '0';

      fechaInicio.setHours(parseInt(horaStr), parseInt(minStr), 0, 0);

      const fechaFinal = new Date();
      fechaFinal.setUTCHours(fechaFinal.getHours(), fechaFinal.getMinutes());

      // 3. Crear la Sesión Base (La magia del 1:1)
      const nuevaSesion = await tx.sesion.create({
        data: {
          ID_Cita: data.citaId, // Vínculo directo a la cita (1:1)
          HoraDeInicio: fechaInicio,
          HoraFinal: fechaFinal,
          Observaciones: data.observaciones,
          DiagnosticoDiferencial: data.diagnostico,
          Criterios_DeDiagnostico: data.criterios || 'DSM-5', // Renombrado
          HistorialDeEvolucion: data.historial || 'Evolución estándar', // Renombrado
          ID_Expediente: expedienteId
        }
      });

      // 4. Insertar Tratamientos (Iterativo)
      if (data.tratamientos && data.tratamientos.length > 0) {
        for (const t of data.tratamientos) {
          // Crear Tratamiento Padre
          const tratamientoBase = await tx.tratamiento.create({
            data: {
              ID_Sesion: nuevaSesion.ID_Sesion,
              FechaInicio: new Date(),
              Frecuencia: t.frecuencia || 'Según indicación',
              ID_Psicologo_Firma: citaActual.ID_Psicologo // Se firma con el psicólogo de la cita
            }
          });

          // Crear Tratamiento Hijo según Tipo
          if (t.tipo === 'farmacologico') {
            if (!t.medicamento || !t.dosis || !t.viaAdminId) continue; 
            await tx.tratamiento_Farmaceutico.create({ // Renombrado
              data: {
                ID_Tratamiento_Farmaceutico: tratamientoBase.ID_Tratamiento, // Renombrado
                ID_ViaAdministracion: Number(t.viaAdminId),
                Nombre_Medicamento: t.medicamento, // Renombrado
                Dosis: t.dosis
              }
            });
          } else if (t.tipo === 'terapeutico') {
            if (!t.tipoTerapiaId || !t.objetivo) continue; 
            await tx.tratamiento_Terapeutico.create({ // Renombrado
              data: {
                ID_TratamientoTerapeutico: tratamientoBase.ID_Tratamiento,
                ID_Tipo_Terapia: Number(t.tipoTerapiaId), // Renombrado
                Objetivo: t.objetivo
              }
            });
          }
        }
      }

      // 5. Insertar Exploraciones (Relación M:N)
      if (data.exploracionIds && data.exploracionIds.length > 0) {
        const exploracionesData = data.exploracionIds.map((id) => ({
          ID_Sesion: nuevaSesion.ID_Sesion,
          ID_ExploracionPsicologica: Number(id)
        }));
        
        await tx.sesion_ExploracionPsicologica.createMany({
          data: exploracionesData
        });
      }

      // 6. Actualizar Estado de la Cita (Cerrarla)
      await tx.cita.update({
        where: { ID_Cita: data.citaId },
        data: { ID_EstadoCita: 2 } // 2 = Realizada
      });

      return nuevaSesion;
    });
  },

  // Búsqueda simple para historial
  findByParams: async (pacienteId: number, psicologoId: number) => {
    // Al no tener paciente/psicólogo en la sesión, buscamos la cita que los tenga
    // y devolvemos su sesión vinculada.
    const cita = await prisma.cita.findFirst({
      where: { 
        ID_Paciente: pacienteId, 
        ID_Psicologo: psicologoId,
        ID_EstadoCita: 2 // Buscamos solo en citas completadas
      },
      orderBy: { FechaCita: 'desc' },
      include: { 
        Sesion: {
            include: { Expediente: true }
        } 
      }
    });

    return cita ? cita.Sesion : null;
  }
};