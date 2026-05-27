// src/hooks/useForgotPassword.ts
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '../services/api';

export const useForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [cargando, setCargando] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!email.trim()) {
            toast.warning('Por favor, ingresa tu correo electrónico');
            return;
        }

        setCargando(true);
        try {
            // Nota: Si tu esquema de Zod (forgotPasswordSchema) pide el campo con mayúscula, 
            // cambia esto a { Email: email }
            await api.post('/auth/forgot-password', { email });
            
            toast.success("Si el correo está registrado, recibirás un enlace pronto.");
            
            // Redirección automática tras 2.5 segundos para permitir leer el mensaje
            setTimeout(() => {
                navigate('/'); // Te devuelve a la pantalla de Presentacion
            }, 2500);

        } catch (error: unknown) {
            // Nuestro wrapper api.ts ya formatea los errores y lanza un Error con el mensaje exacto
            const msg = error instanceof Error ? error.message : "Error al procesar la solicitud";
            toast.error(msg);
        } finally {
            setCargando(false);
        }
    };

    return { email, setEmail, cargando, handleSubmit };
};