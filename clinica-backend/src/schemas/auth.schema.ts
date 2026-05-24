import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string({ message : 'El email es obligatorio' })
      .email('Debe proporcionar un formato de correo válido'),
    rolId: z.number({ message : 'El rolId es obligatorio' })
      .int('El rolId debe ser un número entero')
      .positive('El rolId debe ser un ID válido'),
    psicologoId: z.number().int().positive().optional(),
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string({ message : 'El email es obligatorio' })
      .email('Formato de correo inválido'),
    passwordRaw: z.string({ message : 'La contraseña es obligatoria' })
      .min(1, 'La contraseña no puede estar vacía'),
  })
});

export const cambiarPasswordSchema = z.object({
  body: z.object({
    passwordNuevaRaw: z.string({ message : 'La nueva contraseña es obligatoria' })
      .min(6, 'La contraseña debe tener al menos 6 caracteres'),
  })
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string({ message : 'El email es obligatorio' })
      .email('Formato de correo inválido'),
  })
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string({ message : 'El token de seguridad es obligatorio' }),
    passwordNuevaRaw: z.string({ message : 'La nueva contraseña es obligatoria' })
      .min(6, 'La nueva contraseña debe tener al menos 6 caracteres'),
  })
});