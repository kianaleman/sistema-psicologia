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
  idExpediente?: number; 
  observaciones: string;
  diagnostico: string;
  criterios?: string;
  historial?: string;
  horaInicio: string; 
  horaFinal: string; 
  tratamientos: TratamientoInput[];
  exploracionIds: number[];
}

export const SesionService = {

  /**
   * Obtiene catálogos sincronizados con el esquema Prisma.
   */
  getCatalogosSesion: async () => {
    const [viasAdmin, tiposTerapia, exploraciones] = await Promise.all([
      prisma.viaAdministracion.findMany(),
      prisma.tipoDe_Terapia.findMany(),
      prisma.exploracionPsicologica.findMany()
    ]);

    return { viasAdmin, tiposTerapia, exploraciones };
  },

  /**
   * Crea una sesión completa vinculada a una cita.
   */
  create: async (data: CreateSesionDTO) => {
    return await prisma.$transaction(async (tx) => {
      
      // 🟢 VALIDACIÓN DE DATOS DE ENTRADA
      const pId = Number(data.pacienteId);
      const cId = Number(data.citaId);

      if (!pId) {
        throw new Error("El ID del paciente es requerido para localizar el expediente.");
      }

      // 1. Obtener el Expediente del paciente (Obligatorio para la FK ID_Expediente)
      const expediente = await tx.expediente.findUnique({
        where: { ID_Paciente: pId }
      });

      if (!expediente) {
        throw new Error(`No se encontró un expediente para el paciente con ID ${pId}.`);
      }

      // 2. Manejo de Horas Robusto
      const parsearHora = (horaStr: string) => {
          if (!horaStr) return new Date();
          const hoy = new Date();
          const fechaBase = hoy.toISOString().split('T')[0];
          
          const horaLimpia = horaStr.replace(/\s?[ap]\.?m\.?/i, '').trim();
          
          const [hRaw, mRaw] = horaLimpia.split(':');
          const h = Number(hRaw ?? 0);
          const m = Number(mRaw ?? 0);
          
          const date = new Date(`${fechaBase}T${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`);
          return isNaN(date.getTime()) ? new Date() : date;
      };

      // 3. Crear la Sesión
      const nuevaSesion = await tx.sesion.create({
        data: {
          ID_Cita: cId,
          ID_Expediente: expediente.ID_Expediente,
          HoraDeInicio: parsearHora(data.horaInicio),
          HoraFinal: parsearHora(data.horaFinal),
          Observaciones: data.observaciones ?? '',
          DiagnosticoDiferencial: data.diagnostico ?? '',
          Criterios_DeDiagnostico: data.criterios ?? '', 
          HistorialDeEvolucion: data.historial ?? '',
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
                ID_ViaAdministracion: t.viaAdminId ? Number(t.viaAdminId) : null,
                Nombre_Medicamento: t.medicamento ?? '',
                Dosis: t.dosis ?? ''
              }
            });
          } else if (t.tipo === 'terapeutico') {
            await tx.tratamiento_Terapeutico.create({
              data: {
                ID_TratamientoTerapeutico: tratamientoBase.ID_Tratamiento,
                ID_Tipo_Terapia: t.tipoTerapiaId ? Number(t.tipoTerapiaId) : null,
                Objetivo: t.objetivo ?? ''
              }
            });
          }
        }
      }

      // 5. Insertar Exploraciones Psicológicas (Relación M:N)
      if (data.exploracionIds && data.exploracionIds.length > 0) {
        await tx.sesion_ExploracionPsicologica.createMany({
          data: data.exploracionIds.map((id) => ({
            ID_Sesion: nuevaSesion.ID_Sesion,
            ID_ExploracionPsicologica: Number(id)
          }))
        });
      }

      // 6. Cierre Automático de la Cita: Cambia a 'Completada' (ID 2)
      await tx.cita.update({
        where: { ID_Cita: cId },
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
        Expediente: { ID_Paciente: Number(pacienteId) },
        Cita: { ID_Psicologo: Number(psicologoId) }
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