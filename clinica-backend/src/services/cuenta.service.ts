import { prisma } from '../lib/prisma.js';

export const CuentaService = {
  obtenerAcceso: (idUsuario: number) => prisma.usuario.findUnique({
    where: { ID_Usuario: idUsuario },
    select: {
      ID_Usuario: true,
      Email: true,
      Activo: true,
      RequiereCambioPassword: true,
      Psicologo: { select: { ID_Psicologo: true } },
      Usuario_Rol: { select: { Rol: { select: { Nombre_Rol: true } } } },
    },
  }),
};
