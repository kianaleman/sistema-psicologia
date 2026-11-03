import type { ErrorRequestHandler } from 'express';

export const manejarErrorJson: ErrorRequestHandler = (error: unknown, _req, res, next) => {
  const type = typeof error === 'object' && error !== null && 'type' in error
    ? error.type : undefined;

  const errores: Record<string, { status: number; mensaje: string }> = {
    'entity.parse.failed': { status: 400, mensaje: 'El cuerpo JSON no es válido.' },
    'entity.too.large': { status: 413, mensaje: 'El cuerpo de la petición supera el límite permitido.' },
    'encoding.unsupported': { status: 415, mensaje: 'La codificación de la petición no es compatible.' },
    'charset.unsupported': { status: 415, mensaje: 'El juego de caracteres no es compatible.' },
    'request.size.invalid': { status: 400, mensaje: 'El tamaño de la petición no es válido.' },
    'request.aborted': { status: 400, mensaje: 'La petición se interrumpió.' },
  };
  const detalle = typeof type === 'string' ? errores[type] : undefined;

  if (!detalle) {
    next(error);
    return;
  }

  res.status(detalle.status).json({ error: detalle.mensaje });
};
