import { z } from 'zod';

const passwordSchema = z.string({
  message: 'La contraseña es obligatoria',
})
  .trim()
  .min(6, 'La contraseña debe tener al menos 6 caracteres');

export const registerSchema = z.object({
  body: z.object({
    email: z.string({
      message: 'El correo electrónico es obligatorio',
    }).trim().email('El correo electrónico tiene un formato inválido'),
    rolId: z.number({
      message: 'El rol es obligatorio',
    }).int().positive('El rol debe ser válido'),
    psicologoId: z.number().int().positive().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string({
      message: 'El correo electrónico es obligatorio',
    }).trim().email('El correo electrónico tiene un formato inválido'),
    passwordRaw: z.string({
      message: 'La contraseña es obligatoria',
    }).min(1, 'La contraseña es obligatoria'),
  }),
});

export const cambiarPasswordSchema = z.object({
  body: z.object({
    passwordNuevaRaw: passwordSchema,
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string({
      message: 'El correo electrónico es obligatorio',
    }).trim().email('El correo electrónico tiene un formato inválido'),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string({
      message: 'El token es obligatorio',
    }).trim().min(1, 'El token es obligatorio'),
    passwordNuevaRaw: passwordSchema,
  }),
});
