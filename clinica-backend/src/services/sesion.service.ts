import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// --- DTOs para tipado interno ---
interface TratamientoInput {
  tipo: 'farmacologico' | 'terapeutico';
  frecuencia: string;
  medicamento?: string;
  dosis?: string;
  viaAdminId?: number | string;
  tipoTerapiaId?: number | string;
  objetivo?: string;
}

interface CreateSesionDTO {
  citaId: number;
  pacienteId: number;
  psicologoId: number;
  observaciones: string;
  diagnostico: string;
  criterios?: string;
  historial?: string;
  horaInicio: string; 
  tratamientos: TratamientoInput[];
  exploracionIds: number[];
}

export const SesionService = {

  /**
   * Crea una sesión completa vinculada a una cita, actualiza el expediente
   * y registra tratamientos y exploraciones en una sola transacción.
   */
  create: async (data: CreateSesionDTO) => {
    return await prisma.$transaction(async (tx) => {
      
      // 1. Obtener el Expediente del paciente (Obligatorio para la FK ID_Expediente)
      const expediente = await tx.expediente.findUnique({
        where: { ID_Paciente: data.pacienteId }
      });

      if (!expediente) {
        throw new Error("No se encontró un expediente para este paciente.");
      }

      // 2. Manejo de Horas
      const horaInicioParts = data.horaInicio.split(':');
      const fechaInicio = new Date(); 
      
      // Aseguramos que los valores existan antes de parsear para evitar errores de tipo
      const horas = parseInt(horaInicioParts[0] ?? '0');
      const minutos = parseInt(horaInicioParts[1] ?? '0');
      
      fechaInicio.setHours(horas, minutos, 0, 0);
      const fechaFinal = new Date(); 

      // 3. Crear la Sesión (Nombres de campos sincronizados con tu SQL)
      const nuevaSesion = await tx.sesion.create({
        data: {
          ID_Cita: data.citaId,
          HoraDeInicio: fechaInicio,
          HoraFinal: fechaFinal,
          Observaciones: data.observaciones,
          DiagnosticoDiferencial: data.diagnostico,
          // CORRECCIÓN FINAL: Usamos ?? '' para garantizar que nunca sea undefined
          Criterios_DeDiagnostico: data.criterios ?? '', 
          HistorialDeEvolucion: data.historial ?? '',
          ID_Expediente: expediente.ID_Expediente
        }
      });

      // 4. Insertar Tratamientos
      if (data.tratamientos && data.tratamientos.length > 0) {
        for (const t of data.tratamientos) {
          const tratamientoBase = await tx.tratamiento.create({
            data: {
              ID_Sesion: nuevaSesion.ID_Sesion,
              FechaInicio: new Date(),
              Frecuencia: t.frecuencia || 'Según indicación'
            }
          });

          if (t.tipo === 'farmacologico') {
            await tx.tratamiento_Farmaceutico.create({
              data: {
                ID_Tratamiento_Farmaceutico: tratamientoBase.ID_Tratamiento,
                ID_ViaAdministracion: Number(t.viaAdminId),
                Nombre_Medicamento: t.medicamento ?? '',
                Dosis: t.dosis ?? ''
              }
            });
          } else if (t.tipo === 'terapeutico') {
            await tx.tratamiento_Terapeutico.create({
              data: {
                ID_TratamientoTerapeutico: tratamientoBase.ID_Tratamiento,
                ID_Tipo_Terapia: Number(t.tipoTerapiaId),
                Objetivo: t.objetivo ?? ''
              }
            });
          }
        }
      }

      // 5. Insertar Exploraciones Psicológicas (Relación M:N)
      if (data.exploracionIds && data.exploracionIds.length > 0) {
        const exploracionesData = data.exploracionIds.map((id) => ({
          ID_Sesion: nuevaSesion.ID_Sesion,
          ID_ExploracionPsicologica: Number(id)
        }));
        
        await tx.sesion_ExploracionPsicologica.createMany({
          data: exploracionesData
        });
      }

      // 6. Cierre Automático de la Cita: Cambia a 'Completada' (ID 2)
      await tx.cita.update({
        where: { ID_Cita: data.citaId },
        data: { ID_EstadoCita: 2 } 
      });

      return nuevaSesion;
    });
  },

  /**
   * Busca la última sesión filtrando por paciente y psicólogo.
   */
  findByParams: async (pacienteId: number, psicologoId: number) => {
    return await prisma.sesion.findFirst({
      where: { 
        Expediente: { ID_Paciente: pacienteId },
        Cita: { ID_Psicologo: psicologoId }
      },
      orderBy: { ID_Sesion: 'desc' },
      include: { 
        Expediente: true,
        Cita: {
          include: {
            Psicologo: true,
            TipoDeCita: true
          }
        },
        Tratamiento: {
          include: {
            Tratamiento_Farmaceutico: true,
            Tratamiento_Terapeutico: true
          }
        }
      }
    });
  }
};