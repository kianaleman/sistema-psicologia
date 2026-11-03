export const ROLES = {
  ADMINISTRADOR: 'Administrador',
  PSICOLOGO: 'Psicologo',
  RECEPCION: 'Recepcion',
} as const;

export type RolSistema = (typeof ROLES)[keyof typeof ROLES];
