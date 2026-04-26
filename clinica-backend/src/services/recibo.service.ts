import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const ReciboService = {
  
  getAll: async () => {
    return await prisma.recibo.findMany({
      include: {
        Cita: {
          include: {
            Paciente: {
              include: {
                PacienteAdulto: true,
                // CORRECCIÓN: Nombre con guion bajo según el db pull de SQL Server
                Paciente_Menor: {
                  include: {
                    Tutor_PacienteMenor: { 
                      include: {
                        Tutor: true
                      }
                    }
                  }
                }
              }
            },
            Psicologo: true,
            // CORRECCIÓN: Verifica si es TipoDeCita o TipoDe_Cita (Prisma suele poner guion bajo)
            TipoDeCita: true 
          }
        },
        Divisa: true,
        // CORRECCIÓN: Verifica si es MetodoPago o Metodo_Pago
        MetodoPago: true 
      },
      orderBy: { 
        Cod_Recibo: 'desc' 
      }
    });
  },

  getById: async (id: number) => {
    return await prisma.recibo.findUnique({
      where: { 
        Cod_Recibo: id 
      },
      include: {
        Cita: {
          include: {
            Paciente: true,
            Psicologo: true,
            TipoDeCita: true
          }
        },
        Divisa: true,
        MetodoPago: true
      }
    });
  }
};