// src/hooks/useReloj.ts
import { useState, useEffect } from 'react';

export const useReloj = () => {
  const [fechaHora, setFechaHora] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setFechaHora(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return fechaHora;
};