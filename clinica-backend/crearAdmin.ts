import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando inyección de súper-usuario...');

  // 1. Encriptamos la contraseña "Admin123!" de forma segura
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash('Admin123!', saltRounds);

  // 2. Insertamos el usuario en la Base de Datos usando Prisma
  // NOTA: Ajusta 'usuario' y los campos según el esquema de tu BD
  const admin = await prisma.usuario.create({
    data: {
      Email: 'admin@resiliencia.com',
      PasswordHash: hashedPassword,
      Activo: true,
      // Si tienes un sistema de roles, asegúrate de asignarle el ID del rol Administrador
      // ID_Rol: 1 
    },
  });

  console.log('✅ ¡Administrador creado con éxito!');
  console.log(`📧 Correo: ${admin.Email}`);
  console.log(`🔑 Contraseña: Admin123!`);
}

main()
  .catch((e) => {
    console.error('❌ Error al crear el usuario:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });