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
  pacienteId: number;
  psicologoId: number;
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
      
      // 1. Buscar o Crear Expediente (Lógica de Negocio)
      const sesionPrevia = await tx.sesion.findFirst({ 
        where: { ID_Paciente: data.pacienteId } 
      });
      
      let expedienteId = sesionPrevia?.ID_Expediente;

      if (!expedienteId) {
        const nuevoExp = await tx.expediente.create({
          data: { 
            No_Expediente: `EXP-${Date.now()}`, // Generación automática
            FechaIngreso: new Date() 
          }
        });
        expedienteId = nuevoExp.ID_Expediente;
      }

    //   // 2. Manejo de Horas (UTC vs Local)
    //   // Asumimos que 'horaInicio' viene como "HH:MM:SS" o "HH:MM"
    //   // Creamos una fecha base UTC (Epoch) + Hora
    //   const horaInicioParts = data.horaInicio.split(':');
    //   const fechaInicio = new Date(0); // 1970-01-01
    //   fechaInicio.setUTCHours(parseInt(horaInicioParts[0]), parseInt(horaInicioParts[1]));

    //   // Hora Final (Ahora mismo)
    //   const ahora = new Date();
    //   // Ajuste a formato TIME compatible con SQL Server (usando UTC)
    //   const fechaFinal = new Date(0);
    // 2. Manejo de Horas (CORREGIDO)
      const horaInicioParts = data.horaInicio.split(':');
      
      // ANTES: const fechaInicio = new Date(0);  <-- ESTO CAUSABA EL 1970
      
      // AHORA: Usamos la fecha actual
      const fechaInicio = new Date(); 
      
      // Ajustamos la hora sobre la fecha de hoy. 
      // Usamos setHours (local) porque la hora viene del frontend en formato local.
      fechaInicio.setHours(parseInt(horaInicioParts[0]), parseInt(horaInicioParts[1]), 0, 0);

      // Hora Final (Ahora mismo)
      const fechaFinal = new Date();
      fechaFinal.setUTCHours(fechaFinal.getHours(), fechaFinal.getMinutes());

      // 3. Crear la Sesión Base
      const nuevaSesion = await tx.sesion.create({
        data: {
          HoraDeInicio: fechaInicio,
          HoraFinal: fechaFinal,
          Observaciones: data.observaciones,
          DiagnosticoDiferencial: data.diagnostico,
          CriteriosDeDiagnostico: data.criterios || 'DSM-5',
          HistorialDevolucion: data.historial || 'Evolución estándar',
          ID_Paciente: data.pacienteId,
          ID_Psicologo: data.psicologoId,
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
              Frecuencia: t.frecuencia || 'Según indicación'
            }
          });

          // Crear Tratamiento Hijo según Tipo
          if (t.tipo === 'farmacologico') {
            if (!t.medicamento || !t.dosis || !t.viaAdminId) continue; // Skip invalid
            await tx.tratamientoFarmaceutico.create({
              data: {
                ID_TratamientoFarmaceutico: tratamientoBase.ID_Tratamiento,
                ID_ViaAdministracion: Number(t.viaAdminId),
                NombreMedicamento: t.medicamento,
                Dosis: t.dosis
              }
            });
          } else if (t.tipo === 'terapeutico') {
            if (!t.tipoTerapiaId || !t.objetivo) continue; // Skip invalid
            await tx.tratamientoTerapeutico.create({
              data: {
                ID_TratamientoTerapeutico: tratamientoBase.ID_Tratamiento,
                ID_TipoTerapia: Number(t.tipoTerapiaId),
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
        data: { ID_EstadoCita: 2 } // 2 = Completada
      });

      return nuevaSesion;
    });
  },

  // Búsqueda simple para historial
  findByParams: async (pacienteId: number, psicologoId: number) => {
    return await prisma.sesion.findFirst({
      where: { 
        ID_Paciente: pacienteId, 
        ID_Psicologo: psicologoId 
      },
      orderBy: { ID_Sesion: 'desc' },
      include: { Expediente: true }
    });
  }
};