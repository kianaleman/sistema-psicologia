import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Catálogos Generales
export const getCatalogos = async (req: Request, res: Response) => {
  try {
    const [ocupaciones, estadosCiviles, parentescos, tutores, especialidades, estadosActividad] = await Promise.all([
      prisma.ocupacion.findMany(),
      prisma.estadoCivil.findMany(),
      prisma.parentesco.findMany(),
      prisma.tutor.findMany({ include: { Parentesco: true } }),
      prisma.especialidadPsicologo.findMany(),
      prisma.estadoDeActividad.findMany()
    ]);
    res.json({ ocupaciones, estadosCiviles, parentescos, tutores, especialidades, estadosActividad });
  } catch (error) {
    res.status(500).json({ error: 'Error cargando catálogos' });
  }
};

// GET: Estadísticas Dashboard
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    // Fecha "Hoy" en Nicaragua
    const hoyNica = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Managua"}));
    const inicioDia = new Date(hoyNica); inicioDia.setHours(0, 0, 0, 0);
    const finDia = new Date(hoyNica); finDia.setHours(23, 59, 59, 999);

    const [totalPacientes, psicologosActivos, citasHoy, ingresosTotales] = await Promise.all([
      prisma.paciente.count({ where: { ID_EstadoDeActividad: 1 } }),
      prisma.psicologo.count({ where: { ID_EstadoDeActividad: 1 } }),
      prisma.cita.count({
        where: {
          ID_EstadoCita: 1,
          FechaCita: { gte: inicioDia, lte: finDia }
        }
      }),
      prisma.factura.aggregate({ _sum: { MontoTotal: true } })
    ]);

    res.json({
      totalPacientes,
      psicologosActivos,
      citasHoy,
      ingresosTotales: ingresosTotales._sum.MontoTotal || 0 
    });
  } catch (error) {
    res.status(500).json({ error: 'Error cargando estadísticas' });
  }
};

// GET: Historial de Citas + Sesiones (Reporte General)
export const getHistorialGeneral = async (req: Request, res: Response) => {
    try {
      const sesiones = await prisma.sesion.findMany({
        include: { Paciente: true, Psicologo: true, Expediente: true },
        orderBy: { HoraDeInicio: 'desc' }
      });
  
      const citas = await prisma.cita.findMany({
         where: { ID_EstadoCita: 2 }, 
         include: { TipoDeCita: true }
      });
  
      const historialCombinado = sesiones.map(sesion => {
         const citaMatch = citas.find(c => 
            c.ID_Psicologo === sesion.ID_Psicologo &&
            new Date(c.HoraCita).toLocaleTimeString('en-GB', {timeZone: 'UTC', hour: '2-digit', minute: '2-digit'}) ===
            new Date(sesion.HoraDeInicio).toLocaleTimeString('en-GB', {timeZone: 'UTC', hour: '2-digit', minute: '2-digit'})
         );
  
         return {
            ...sesion,
            FechaReal: citaMatch ? citaMatch.FechaCita : new Date(), 
            DatosCita: {
               Motivo: citaMatch?.MotivoConsulta || 'Sin registro de cita',
               Tipo: citaMatch?.TipoDeCita?.NombreDeCita || 'N/A'
            }
         };
      });
  
      res.json(historialCombinado);
    } catch (error) {
      res.status(500).json({ error: 'Error generando el historial' });
    }
};