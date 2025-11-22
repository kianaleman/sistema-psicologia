import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const FacturaService = {
  
  getAll: async () => {
    return await prisma.factura.findMany({
      include: {
        Cita: {
          include: {
            // Mantenemos la estructura crítica para identificar al cliente
            Paciente: {
              include: {
                PacienteAdulto: true, // Cédula/Teléfono si es adulto
                PacienteMenor: {
                  include: {
                    Tutor: true       // Datos del Tutor si es menor
                  }
                }
              }
            },
            Psicologo: true,
            TipoDeCita: true
          }
        },
        DetalleFactura: {
          include: {
            MetodoPago: true
          }
        }
      },
      orderBy: { Cod_Factura: 'desc' }
    });
  },

  // Agrego este método por si necesitas imprimir una factura individual en el futuro
  getById: async (id: number) => {
    return await prisma.factura.findUnique({
      where: { Cod_Factura: id },
      include: {
        Cita: {
          include: {
            Paciente: {
              include: {
                PacienteAdulto: true,
                PacienteMenor: { include: { Tutor: true } }
              }
            },
            Psicologo: true,
            TipoDeCita: true
          }
        },
        DetalleFactura: { include: { MetodoPago: true } }
      }
    });
  }
};