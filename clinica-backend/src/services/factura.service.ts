import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const FacturaService = {
  
  getAll: async () => {
    return await prisma.recibo.findMany({
      include: {
        // Datos financieros directos en el recibo
        MetodoPago: true,
        Divisa: true,
        Banco: true, 
        Cita: {
          include: {
            // Estructura crítica para identificar al cliente
            Paciente: {
              include: {
                PacienteAdulto: true, // Cédula/Teléfono si es adulto
                Paciente_Menor: {     // Renombrado por el nuevo esquema
                  include: {
                    Tutor_PacienteMenor: { // Navegación por tabla intermedia
                      include: {
                        Tutor: true 
                      }
                    }
                  }
                }
              }
            },
            Psicologo: true,
            TipoDeCita: true
          }
        }
      },
      orderBy: { Cod_Recibo: 'desc' } // Renombrado de Cod_Factura
    });
  },

  // Agrego este método por si necesitas imprimir un recibo individual en el futuro
  getById: async (id: number) => {
    return await prisma.recibo.findUnique({
      where: { Cod_Recibo: id },
      include: {
        MetodoPago: true,
        Divisa: true,
        Banco: true,
        Cita: {
          include: {
            Paciente: {
              include: {
                PacienteAdulto: true,
                Paciente_Menor: { 
                  include: { 
                    Tutor_PacienteMenor: { 
                      include: { Tutor: true } 
                    } 
                  } 
                }
              }
            },
            Psicologo: true,
            TipoDeCita: true
          }
        }
      }
    });
  }
};