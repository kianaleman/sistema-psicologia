import { PrismaClient } from '@prisma/client';

// Compartido por los módulos protegidos del hito y sustituible en las pruebas.
export const prisma = new PrismaClient();
