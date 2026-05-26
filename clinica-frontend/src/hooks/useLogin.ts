// src/hooks/useLogin.ts
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '../services/api';

// Interfaz temporal para depurar sin que ESLint se queje
  interface LoginResponse {
    token?: string;
    data?: { token?: string };
    body?: { token?: string };
    [key: string]: unknown; // Permite que vengan otras propiedades que aún no conocemos
  }

export const useLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      toast.warning('Por favor, complete todos los campos');
      return;
    }

    setLoading(true);
    try {
      // 1. Ponemos 'any' temporalmente para ver qué nos manda realmente el backend
      const response = await api.post<LoginResponse>('/auth/login', { 
        email : email, 
        passwordRaw : password 
      });

      // 2. IMPRIMIMOS LA RESPUESTA EN CONSOLA PARA INVESTIGAR
      console.log("Respuesta del servidor:", response);

      // 3. Intentamos atrapar el token en las estructuras más comunes de Express
      const tokenRecibido = response.token || response.data?.token || response.body?.token;

      // 4. Si el token no existe, detenemos todo y avisamos
      if (!tokenRecibido) {
        toast.error("Error estructural: El servidor respondió, pero no encontramos el Token.");
        console.error("No se encontró el token. Revisa el objeto impreso arriba.");
        return; // Detiene la ejecución para que no te expulse App.tsx
      }

      // 5. Si todo está bien, guardamos e ingresamos
      localStorage.setItem('token', tokenRecibido);
      toast.success('Acceso autorizado. Bienvenido.');
      navigate('/dashboard');
      
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Credenciales inválidas';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return { email, setEmail, password, setPassword, loading, handleLogin };
};