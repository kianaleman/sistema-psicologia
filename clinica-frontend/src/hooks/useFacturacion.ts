import { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { toast } from 'sonner';
import type { Factura } from '../types';

export function useFacturacion() {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(true);

  // Estado unificado para filtros
  const [filtros, setFiltros] = useState({
    busqueda: '',
    fechaInicio: '',
    fechaFin: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await api.facturas.getAll();
      // @ts-ignore (Casting seguro dada la estructura del backend)
      setFacturas(data);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar el historial de facturación");
    } finally {
      setLoading(false);
    }
  };

  // --- LÓGICA DE FILTRADO ---
  const facturasFiltradas = useMemo(() => {
    return facturas.filter(f => {
      const texto = filtros.busqueda.toLowerCase();
      const paciente = `${f.Cita.Paciente.Nombre} ${f.Cita.Paciente.Apellido}`.toLowerCase();
      const psicologo = `${f.Cita.Psicologo.Nombre} ${f.Cita.Psicologo.Apellido}`.toLowerCase();
      
      const matchTexto = 
        !texto || 
        paciente.includes(texto) || 
        psicologo.includes(texto) || 
        f.Cod_Factura.toString().includes(texto);

      const fechaFac = f.FechaFactura.split('T')[0]; 
      let matchFecha = true;
      if (filtros.fechaInicio && fechaFac < filtros.fechaInicio) matchFecha = false;
      if (filtros.fechaFin && fechaFac > filtros.fechaFin) matchFecha = false;

      return matchTexto && matchFecha;
    });
  }, [facturas, filtros]);

  // --- CÁLCULOS AUTOMÁTICOS ---
  const totales = useMemo(() => {
    const ingresos = facturasFiltradas.reduce((sum, f) => sum + Number(f.MontoTotal), 0);
    const transacciones = facturasFiltradas.length;
    return {
      ingresos,
      transacciones,
      ticketPromedio: transacciones > 0 ? ingresos / transacciones : 0
    };
  }, [facturasFiltradas]);

  // Helpers para inputs
  const setFiltro = (campo: keyof typeof filtros, valor: string) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
  };

  const limpiarFiltros = () => setFiltros({ busqueda: '', fechaInicio: '', fechaFin: '' });

  return {
    facturas: facturasFiltradas, // Devolvemos ya filtradas
    loading,
    filtros,
    setFiltro,
    limpiarFiltros,
    totales
  };
}