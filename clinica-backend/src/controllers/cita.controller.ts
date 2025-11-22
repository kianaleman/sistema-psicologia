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
    // ... (tu lógica de preparación de datos igual) ...
    const { fecha, hora, motivo, tipoCitaId, pacienteId, psicologoId, precio, metodoPagoId, direccion } = req.body;

    const result = await CitaService.create({ /* ... datos ... */ 
      fecha, hora, motivo, 
      tipoCitaId: parseInt(tipoCitaId), 
      pacienteId: parseInt(pacienteId), 
      psicologoId: parseInt(psicologoId), 
      precio: parseFloat(precio) || 0, 
      metodoPagoId: parseInt(metodoPagoId) ,
      // Pasamos la dirección al servicio (asegurando que exista, o enviando defaults)
      direccion: direccion || { departamento: 'Managua', ciudad: 'Managua', barrio: 'Central', calle: 'Clínica' }
    });

    res.json({ nuevaCita: result.cita, nuevaFactura: result.factura });

  } catch (error: any) {
    console.error(error); // Log en consola para ti
    
    // DETECCIÓN DEL ERROR DE DISPONIBILIDAD
    if (error.message === 'El psicólogo ya tiene una cita agendada en este horario.') {
      // 409 = Conflict (Ideal para duplicados o choques de agenda)
      return res.status(409).json({ error: error.message });
    }

    if (error.message === 'Hora inválida') {
       return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Error interno al agendar la cita' });
  }
};

// PUT: Editar Cita
export const updateCita = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    // ... (tu lógica de preparación) ...
    const { fecha, hora, motivo, tipoCitaId, pacienteId, psicologoId, precio, metodoPagoId } = req.body;

    const result = await CitaService.update(parseInt(id), { /* ... datos ... */ 
      fecha, hora, motivo,
      tipoCitaId: parseInt(tipoCitaId),
      pacienteId: parseInt(pacienteId),
      psicologoId: parseInt(psicologoId),
      precio: parseFloat(precio) || 0,
      metodoPagoId: parseInt(metodoPagoId)
    });

    res.json(result);

  } catch (error: any) {
    console.error(error);
    
    // DETECCIÓN DEL ERROR DE DISPONIBILIDAD
    if (error.message === 'El psicólogo ya tiene una cita agendada en este horario.') {
      return res.status(409).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Error al actualizar la cita' });
  }
};

// PATCH: Cancelar Cita
export const cancelCita = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await CitaService.cancel(parseInt(id));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Error al cancelar cita' });
  }
};