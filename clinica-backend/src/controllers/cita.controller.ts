import type { Request, Response } from 'express';
import { CitaService } from '../services/cita.service.js'; // Asegura la extensión .js si usas ESM

// GET: Obtener todas las citas
export const getCitas = async (req: Request, res: Response): Promise<void> => {
  try {
    const citas = await CitaService.getAll();
    res.json(citas);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener citas' });
  }
};

// GET: Catálogos
export const getCatalogosCitas = async (req: Request, res: Response): Promise<void> => {
  try {
    const catalogos = await CitaService.getCatalogos();
    res.json(catalogos);
  } catch (error: any) {
    res.status(500).json({ error: 'Error cargando catálogos de citas' });
  }
};

// POST: Crear Cita
export const createCita = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      fecha, hora, motivo, tipoCitaId, pacienteId, psicologoId, 
      precio, divisaId, metodoPagoId, bancoId, numeroReferencia, direccion 
    } = req.body;

    const result = await CitaService.create({
      fecha,
      hora,
      motivo, 
      tipoCitaId: parseInt(tipoCitaId), 
      pacienteId: parseInt(pacienteId), 
      psicologoId: parseInt(psicologoId), 
      precio: parseFloat(precio) || 0, 
      divisaId: parseInt(divisaId) || 1, 
      metodoPagoId: parseInt(metodoPagoId),
      // Inyectamos las propiedades SOLO si existen
      ...(bancoId ? { bancoId: parseInt(bancoId) } : {}),
      ...(numeroReferencia ? { numeroReferencia } : {}),
      direccion: direccion || { municipioId: 1, barrio: 'No especificado', calle: '' }
    });

    // Ahora devolvemos el recibo, alineado a la nueva BD
    res.status(201).json({ nuevaCita: result.cita, nuevoRecibo: result.recibo });

  } catch (error: any) {
    console.error(error);

    // 1. DETECCIÓN DEL ERROR DE DISPONIBILIDAD (Conflicto)
    if (error.message === 'El psicólogo ya tiene una cita agendada en este horario.') {
      res.status(409).json({ error: error.message });
      return;
    }

    // 2. ERRORES DE VALIDACIÓN
    res.status(400).json({ error: error.message });
  }
};

// PUT: Editar Cita
export const updateCita = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
        res.status(400).json({ error: 'El ID proporcionado no es válido' });
        return;
    }

    const { 
      fecha, hora, motivo, tipoCitaId, pacienteId, psicologoId, 
      precio, divisaId, metodoPagoId, bancoId, numeroReferencia, direccion 
    } = req.body;

    const result = await CitaService.update(id, { 
      fecha, 
      hora, 
      motivo,
      tipoCitaId: parseInt(tipoCitaId),
      pacienteId: parseInt(pacienteId),
      psicologoId: parseInt(psicologoId),
      precio: parseFloat(precio) || 0,
      divisaId: parseInt(divisaId) || 1,
      metodoPagoId: parseInt(metodoPagoId),
      // Inyectamos las propiedades SOLO si existen
      ...(bancoId ? { bancoId: parseInt(bancoId) } : {}),
      ...(numeroReferencia ? { numeroReferencia } : {}),
      direccion: direccion || { municipioId: 1, barrio: 'No especificado', calle: '' }
    });

    res.json(result);

  } catch (error: any) {
    console.error(error);
    
    if (error.message === 'El psicólogo ya tiene una cita agendada en este horario.') {
      res.status(409).json({ error: error.message });
      return;
    }
    
    res.status(400).json({ error: error.message });
  }
};

// PATCH: Cancelar Cita
export const cancelCita = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
        res.status(400).json({ error: 'El ID proporcionado no es válido' });
        return;
    }

    const { motivoId, notas } = req.body; 

    if (!motivoId) {
      res.status(400).json({ error: "Debe seleccionar un motivo." });
      return;
    }

    await CitaService.cancel(id, Number(motivoId), notas);
    res.json({ message: 'Cita cancelada correctamente' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};