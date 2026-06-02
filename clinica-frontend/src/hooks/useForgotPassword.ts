import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '../services/api';

export const useForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const emailNormalizado = email.trim();

    if (!emailNormalizado) {
      toast.warning('Por favor, ingresa tu correo electrónico');
      return;
    }

    setCargando(true);

    try {
      await api.post('/auth/forgot-password', {
        email: emailNormalizado,
      });

      toast.success('Si el correo está registrado, recibirás un enlace de recuperación.', {
        duration: 3500,
      });

      window.setTimeout(() => {
        navigate('/');
      }, 3500);
    } catch (error: unknown) {
      const message = error instanceof Error
        ? error.message
        : 'Error al procesar la solicitud';

      toast.error(message);
    } finally {
      setCargando(false);
    }
  };

  return {
    email,
    setEmail,
    cargando,
    handleSubmit,
  };
};
