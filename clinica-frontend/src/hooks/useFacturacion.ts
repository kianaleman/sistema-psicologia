import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../services/api';
import type { Recibo } from '../types';

export const useFacturacion = () => {
  // Cambiamos el tipo Factura por Recibo según nuestro types/index.ts
  const [recibos, setRecibos] = useState<Recibo[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros locales
  const [filtros, setFiltros] = useState({
    busqueda: '',
    fechaInicio: '',
    fechaFin: ''
  });

  const fetchFacturas = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.facturas.getAll();
      setRecibos(data);
    } catch (error: unknown) {
      console.error("Error al cargar recibos/facturas:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFacturas();
  }, [fetchFacturas]);

  // --- LÓGICA DE FILTRADO AVANZADA ---
  const facturasFiltradas = useMemo(() => {
    return recibos.filter(f => {
      // 1. Filtro de Fechas (Ahora usamos f.FechaRecibo)
      const fechaFac = f.FechaRecibo ? f.FechaRecibo.toString().split('T')[0] : '';
      
      if (filtros.fechaInicio && fechaFac < filtros.fechaInicio) return false;
      if (filtros.fechaFin && fechaFac > filtros.fechaFin) return false;

      // 2. Filtro de Búsqueda (Texto)
      if (!filtros.busqueda) return true;

      const term = filtros.busqueda.toLowerCase();
      
      // Datos Paciente (Usamos Optional Chaining para evitar crasheos)
      const pacienteNombre = f.Cita?.Paciente 
        ? `${f.Cita.Paciente.Nombre} ${f.Cita.Paciente.Apellido}`.toLowerCase() 
        : '';
      const cedulaPaciente = f.Cita?.Paciente?.PacienteAdulto?.No_Cedula?.toLowerCase() || '';
      
      // Ajustado a Paciente_Menor y PartidaDeNacimiento según la BD actual
      const partidaNacimiento = f.Cita?.Paciente?.Paciente_Menor?.PartidaDeNacimiento?.toLowerCase() || '';

      // Datos Doctor
      const doctorNombre = f.Cita?.Psicologo 
        ? `${f.Cita.Psicologo.Nombre} ${f.Cita.Psicologo.Apellido}`.toLowerCase() 
        : '';
      // Ajustado a CodigoMinsa
      const codigoMinsa = f.Cita?.Psicologo?.CodigoMinsa?.toLowerCase() || ''; 

      // Datos Factura (Ajustado a Cod_Recibo)
      const numFactura = f.Cod_Recibo.toString();

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
  }, [recibos, filtros]);

  // --- CÁLCULO DE TOTALES (KPIs) ---
  const totales = useMemo(() => {
    // MontoTotal ahora es opcional en la BD, nos aseguramos de que sea un número válido
    const ingresos = facturasFiltradas.reduce((acc, curr) => acc + Number(curr.MontoTotal || 0), 0);
    const transacciones = facturasFiltradas.length;
    const ticketPromedio = transacciones > 0 ? ingresos / transacciones : 0;

    return { ingresos, transacciones, ticketPromedio };
  }, [facturasFiltradas]);

  const setFiltro = (key: keyof typeof filtros, value: string) => {
    setFiltros(prev => ({ ...prev, [key]: value }));
  };

  const limpiarFiltros = () => {
    setFiltros({ busqueda: '', fechaInicio: '', fechaFin: '' });
  };

  return {
    // Exportamos 'facturas' en el objeto para no romper tu UI (Facturacion.tsx)
    // aunque internamente ahora estamos manejando 'recibos'
    facturas: facturasFiltradas,
    loading,
    filtros,
    totales,
    setFiltro,
    limpiarFiltros,
    recargar: fetchFacturas
  };
};