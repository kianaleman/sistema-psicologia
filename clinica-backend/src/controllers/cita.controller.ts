import type { Request, Response } from 'express';
import { CitaService } from '../services/cita.service.js';
import { SesionService } from '../services/sesion.service.js'; // 🟢 Importación agregada

export const getCitas = async (req: Request, res: Response) => {
  try {
    // 🟢 Extraemos el usuario inyectado por el middleware verificarToken
    const user = (req as any).user;
    let citas;

    // 🟢 REGLA DE ORO: Si es Admin (Rol 1), acceso total. Si no, filtrar por su ID de Psicólogo.
    if (user && user.idRol === 1) {
      citas = await CitaService.getAll();
    } else {
      citas = await CitaService.getAll(user.id);
    }

    res.json(citas);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener citas' });
  }
};

export const getCatalogosCitas = async (req: Request, res: Response) => {
  try {
    // 🟢 Unificamos catálogos de Citas y Sesión en una sola respuesta
    const [catalogosCitas, catalogosSesion] = await Promise.all([
      CitaService.getFilters(),
      SesionService.getCatalogosSesion()
    ]);

    res.json({
      ...catalogosCitas,
      ...catalogosSesion
    });
  } catch (error) {
    res.status(500).json({ error: 'Error cargando catálogos' });
  }
};

export const createCita = async (req: Request, res: Response) => {
  try {
    // 🟢 VALIDACIÓN DE SEGURIDAD: Horario Laboral (8:00 AM - 7:00 PM)
    const { hora } = req.body;
    if (hora) {
      const horaCita = parseInt(hora.split(':')[0]);
      if (horaCita < 8 || horaCita >= 19) {
        return res.status(400).json({ error: 'Horario fuera de rango laboral (8:00 AM - 7:00 PM)' });
      }
    }

    // El servicio ya retorna el objeto creado (o el resultado de la transacción)
    const result = await CitaService.create(req.body);

    // Simplificamos la respuesta: devolvemos directamente el resultado
    res.json(result);

  } catch (error: any) {
    if (error.message.includes('agendada')) {
      return res.status(409).json({ error: error.message });
    }
    res.status(400).json({ error: error.message });
  }
};

export const updateCita = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    // 🟢 VALIDACIÓN DE SEGURIDAD: Horario Laboral al actualizar
    const { hora } = req.body;
    if (hora) {
      const horaCita = parseInt(hora.split(':')[0]);
      if (horaCita < 8 || horaCita >= 19) {
        return res.status(400).json({ error: 'Horario fuera de rango laboral (8:00 AM - 7:00 PM)' });
      }
    }

    const result = await CitaService.update(Number(id), req.body);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const cancelCita = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { motivoId, notas } = req.body;
    await CitaService.cancel(Number(id), Number(motivoId), notas);
    res.json({ message: 'Cita cancelada correctamente' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};