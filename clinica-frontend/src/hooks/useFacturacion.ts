import { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import type { Factura } from '../types';

export const useFacturacion = () => {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros locales
  const [filtros, setFiltros] = useState({
    busqueda: '',
    fechaInicio: '',
    fechaFin: ''
  });

  const fetchFacturas = async () => {
    setLoading(true);
    try {
      const data = await api.facturas.getAll();
      setFacturas(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacturas();
  }, []);

  // --- LÓGICA DE FILTRADO AVANZADA ---
  const facturasFiltradas = useMemo(() => {
    return facturas.filter(f => {
      // 1. Filtro de Fechas
      const fechaFac = f.FechaFactura.split('T')[0];
      if (filtros.fechaInicio && fechaFac < filtros.fechaInicio) return false;
      if (filtros.fechaFin && fechaFac > filtros.fechaFin) return false;

      // 2. Filtro de Búsqueda (Texto)
      if (!filtros.busqueda) return true;

      const term = filtros.busqueda.toLowerCase();
      
      // Datos Paciente
      const pacienteNombre = `${f.Cita.Paciente.Nombre} ${f.Cita.Paciente.Apellido}`.toLowerCase();
      const cedulaPaciente = f.Cita.Paciente.PacienteAdulto?.No_Cedula?.toLowerCase() || '';
      const partidaNacimiento = f.Cita.Paciente.PacienteMenor?.PartNacimiento?.toLowerCase() || '';

      // Datos Doctor
      const doctorNombre = `${f.Cita.Psicologo.Nombre} ${f.Cita.Psicologo.Apellido}`.toLowerCase();
      const codigoMinsa = f.Cita.Psicologo.CodigoDeMinsa?.toLowerCase() || ''; // Asumiendo que el backend lo envía en el include

      // Datos Factura
      const numFactura = f.Cod_Factura.toString();

      // Verificamos coincidencias
      return (
        pacienteNombre.includes(term) ||
        cedulaPaciente.includes(term) ||
        partidaNacimiento.includes(term) ||
        doctorNombre.includes(term) ||
        codigoMinsa.includes(term) ||
        numFactura.includes(term)
      );
    });
  }, [facturas, filtros]);

  // --- CÁLCULO DE TOTALES (KPIs) ---
  const totales = useMemo(() => {
    const ingresos = facturasFiltradas.reduce((acc, curr) => acc + Number(curr.MontoTotal), 0);
    const transacciones = facturasFiltradas.length;
    const ticketPromedio = transacciones > 0 ? ingresos / transacciones : 0;

    return { ingresos, transacciones, ticketPromedio };
  }, [facturasFiltradas]);

  const setFiltro = (key: string, value: string) => {
    setFiltros(prev => ({ ...prev, [key]: value }));
  };

  const limpiarFiltros = () => {
    setFiltros({ busqueda: '', fechaInicio: '', fechaFin: '' });
  };

  return {
    facturas: facturasFiltradas,
    loading,
    filtros,
    totales,
    setFiltro,
    limpiarFiltros,
    recargar: fetchFacturas
  };
};