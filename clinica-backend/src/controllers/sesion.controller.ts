import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST: Guardar Sesión y Cerrar Cita
export const createSesion = async (req: Request, res: Response) => {
  const { citaId, pacienteId, psicologoId, observaciones, diagnostico, criterios, historial, horaInicio } = req.body;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Buscar o Crear Expediente
      const sesionPrevia = await tx.sesion.findFirst({ where: { ID_Paciente: parseInt(pacienteId) } });
      let expedienteId = sesionPrevia?.ID_Expediente;

      if (!expedienteId) {
        const nuevoExp = await tx.expediente.create({
          data: { No_Expediente: `EXP-${Date.now()}`, FechaIngreso: new Date() }
        });
        expedienteId = nuevoExp.ID_Expediente;
      }

      // 2. Procesar Horas (Corrección UTC Manual para guardar hora local exacta)
      const ahoraLocal = new Date();
      const horaFinalString = ahoraLocal.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      const horaInicioParaGuardar = new Date(`1970-01-01T${horaInicio}Z`);
      const horaFinalParaGuardar = new Date(`1970-01-01T${horaFinalString}Z`);

      // 3. Crear Sesión
      const nuevaSesion = await tx.sesion.create({
        data: {
          HoraDeInicio: horaInicioParaGuardar,
          HoraFinal: horaFinalParaGuardar,
          Observaciones: observaciones,
          DiagnosticoDiferencial: diagnostico,
          CriteriosDeDiagnostico: criterios || 'DSM-5',
          HistorialDevolucion: historial || 'Evolución estándar',
          ID_Paciente: parseInt(pacienteId),
          ID_Psicologo: parseInt(psicologoId),
          ID_Expediente: expedienteId
        }
      });

      // 4. Actualizar Cita a Completada (2)
      await tx.cita.update({
        where: { ID_Cita: parseInt(citaId) },
        data: { ID_EstadoCita: 2 } 
      });

      return nuevaSesion;
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al guardar la sesión' });
  }
};

// GET: Buscar última sesión (por Paciente y Psicólogo)
export const searchSesion = async (req: Request, res: Response) => {
  const { pacienteId, psicologoId } = req.query;

  if (!pacienteId || !psicologoId) {
    return res.status(400).json({ error: 'Faltan IDs' });
  }

  try {
    const sesion = await prisma.sesion.findFirst({
      where: {
        ID_Paciente: Number(pacienteId),
        ID_Psicologo: Number(psicologoId)
      },
      orderBy: { ID_Sesion: 'desc' }, // La última
      include: { Expediente: true }
    });

    if (sesion) res.json(sesion);
    else res.status(404).json({ error: 'Sesión no encontrada' });
  } catch (error) {
    res.status(500).json({ error: 'Error en búsqueda' });
  }
};