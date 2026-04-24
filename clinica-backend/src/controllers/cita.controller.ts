import type { Request, Response } from 'express';
import { CitaService } from '../services/cita.service';

// GET: Obtener todas las citas
export const getCitas = async (req: Request, res: Response) => {
  try {
    const citas = await CitaService.getAll();
    res.json(citas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener citas' });
  }
};

// GET: Catálogos
export const getCatalogosCitas = async (req: Request, res: Response) => {
  try {
    const catalogos = await CitaService.getCatalogos();
    res.json(catalogos);
  } catch (error) {
    res.status(500).json({ error: 'Error cargando catálogos de citas' });
  }
};

export const createCita = async (req: Request, res: Response) => {
  try {
    const { fecha, hora, motivo, tipoCitaId, pacienteId, psicologoId, precio, metodoPagoId, direccion } = req.body;

    const result = await CitaService.create({
      fecha,
      hora,
      motivo, 
      tipoCitaId: parseInt(tipoCitaId), 
      pacienteId: parseInt(pacienteId), 
      psicologoId: parseInt(psicologoId), 
      precio: parseFloat(precio) || 0, 
      metodoPagoId: parseInt(metodoPagoId),
      // Pasamos la dirección al servicio (asegurando que exista, o enviando defaults)
      direccion: direccion || { pais: 'Nicaragua', departamento: 'Managua', ciudad: 'Managua', barrio: 'Central', calle: 'Clínica' }
    });

    res.json({ nuevaCita: result.cita, nuevaFactura: result.factura });

  } catch (error: any) {
    console.error(error);

    // 1. DETECCIÓN DEL ERROR DE DISPONIBILIDAD (Conflicto)
    if (error.message === 'El psicólogo ya tiene una cita agendada en este horario.') {
      return res.status(409).json({ error: error.message });
    }

    // 2. ERRORES DE VALIDACIÓN (Fechas pasadas, Hora inválida, Paciente Inactivo)
    // Devolvemos 400 para que el frontend muestre el mensaje específico del servicio
    return res.status(400).json({ error: error.message });
  }
};

// PUT: Editar Cita
export const updateCita = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const { fecha, hora, motivo, tipoCitaId, pacienteId, psicologoId, precio, metodoPagoId, direccion } = req.body;

    const result = await CitaService.update(parseInt(id), { 
      fecha, 
      hora, 
      motivo,
      tipoCitaId: parseInt(tipoCitaId),
      pacienteId: parseInt(pacienteId),
      psicologoId: parseInt(psicologoId),
      precio: parseFloat(precio) || 0,
      metodoPagoId: parseInt(metodoPagoId),
      // Mantenemos estructura DTO
      direccion: direccion || { pais: 'Nicaragua', departamento: '', ciudad: '', barrio: '', calle: '' }
    });

    res.json(result);

  } catch (error: any) {
    console.error(error);
    
    // 1. DETECCIÓN DEL ERROR DE DISPONIBILIDAD
    if (error.message === 'El psicólogo ya tiene una cita agendada en este horario.') {
      return res.status(409).json({ error: error.message });
    }
    
    // 2. ERRORES DE VALIDACIÓN (Fechas pasadas, etc.)
    return res.status(400).json({ error: error.message });
  }
};

// PATCH: Cancelar Cita
export const cancelCita = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { motivoId, notas } = req.body; 

    if (!motivoId) return res.status(400).json({ error: "Debe seleccionar un motivo." });

    await CitaService.cancel(Number(id), motivoId, notas);
    res.json({ message: 'Cita cancelada correctamente' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};