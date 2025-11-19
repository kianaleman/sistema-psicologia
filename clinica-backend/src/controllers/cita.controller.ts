import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Obtener todas las citas
export const getCitas = async (req: Request, res: Response) => {
  try {
    const citas = await prisma.cita.findMany({
      include: {
        Paciente: true, 
        Psicologo: true,
        TipoDeCita: true,
        EstadoCita: true
      }
    });
    res.json(citas);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener citas' });
  }
};

// GET: Catálogos específicos para el formulario de citas
export const getCatalogosCitas = async (req: Request, res: Response) => {
  try {
    const [tiposCita, estadosCita, metodosPago] = await Promise.all([
      prisma.tipoDeCita.findMany(),
      prisma.estadoCita.findMany(),
      prisma.metodoPago.findMany()
    ]);
    res.json({ tiposCita, estadosCita, metodosPago });
  } catch (error) {
    res.status(500).json({ error: 'Error cargando catálogos de citas' });
  }
};

// POST: Crear Nueva Cita (Con Factura y Validación de Hora)
export const createCita = async (req: Request, res: Response) => {
  const { fecha, hora, motivo, tipoCitaId, pacienteId, psicologoId, precio } = req.body;

  try {
    // Validación y parseo de hora manual
    const [horas, minutos] = hora.split(':').map(Number);
    if (isNaN(horas) || isNaN(minutos)) {
      return res.status(400).json({ error: 'Hora inválida' });
    }

    const fechaDeLaCita = new Date(fecha);
    fechaDeLaCita.setHours(horas, minutos, 0, 0);

    const [nuevaCita, nuevaFactura] = await prisma.$transaction(async (tx) => {
      // 1. Crear Dirección Genérica
      const direccionClinica = await tx.direccionCita.create({
        data: { Pais: 'Nicaragua', Departamento: 'Managua', Ciudad: 'Managua', Barrio: 'Central', Calle: 'Clínica Principal' }
      });

      // 2. Crear Cita
      const citaCreada = await tx.cita.create({
        data: {
          FechaCita: new Date(fecha),
          HoraCita: fechaDeLaCita,
          MotivoConsulta: motivo,
          ID_TipoCita: parseInt(tipoCitaId),
          ID_EstadoCita: 1, // Programada
          ID_Paciente: parseInt(pacienteId),
          ID_Psicologo: parseInt(psicologoId),
          ID_DireccionCita: direccionClinica.ID_DireccionCita
        }
      });

      // 3. Crear Factura
      const facturaCreada = await tx.factura.create({
        data: {
          ID_Cita: citaCreada.ID_Cita,
          FechaFactura: new Date(fecha),
          MontoTotal: parseFloat(precio) || 0.00
        }
      });
      
      return [citaCreada, facturaCreada];
    });

    res.json({ nuevaCita, nuevaFactura });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al agendar cita' });
  }
};

// PATCH: Cancelar Cita
export const cancelCita = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const citaCancelada = await prisma.cita.update({
      where: { ID_Cita: parseInt(id) },
      data: { ID_EstadoCita: 3 } // 3 = Cancelada
    });
    res.json(citaCancelada);
  } catch (error) {
    res.status(500).json({ error: 'Error al cancelar cita' });
  }
};