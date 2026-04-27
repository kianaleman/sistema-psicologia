import type { Request, Response, NextFunction } from 'express'; // 🟢 Se agregó 'type'

/**
 * Middleware para restringir el acceso a rutas según el ID del Rol.
 * @param rolesPermitidos - Lista de IDs de roles (1=Admin, 2=Psicólogo, etc.)
 */
export const permitirRoles = (...rolesPermitidos: number[]) => {
    return (req: any, res: Response, next: NextFunction) => {
        // Extraemos el usuario inyectado por el middleware de validación de token
        const user = req.user;

        if (!user || !rolesPermitidos.includes(user.idRol)) {
            return res.status(403).json({ 
                error: 'Acceso denegado: Tu rol no tiene permisos para esta acción.' 
            });
        }
        
        next();
    };
};