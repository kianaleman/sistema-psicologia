import { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import type { Recibo } from '../types'; // Cambio: Factura -> Recibo

export const useFacturacion = () => {
  const [recibos, setRecibos] = useState<Recibo[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [filtros, setFiltros] = useState({
    busqueda: '',
    fechaInicio: '',
    fechaFin: '',
    idDivisa: '' // Nuevo filtro por moneda
  });

  const fetchRecibos = async () => {
    setLoading(true);
    try {
      // Usamos el módulo de recibos que configuramos en api.ts
      const data = await api.recibos.getAll();
      setRecibos(data);
    } catch (error) {
      console.error("Error al cargar recibos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecibos();
  }, []);

  // --- LÓGICA DE FILTRADO ADAPTADA A SNAKE_CASE ---
  const recibosFiltrados = useMemo(() => {
    return recibos.filter(r => {
      // 1. Filtro de Fechas (Sincronizado con FechaRecibo)
      const fechaRec = r.FechaRecibo.split('T')[0];
      if (filtros.fechaInicio && fechaRec < filtros.fechaInicio) return false;
      if (filtros.fechaFin && fechaRec > filtros.fechaFin) return false;

      // 2. Filtro por Moneda (Nuevo)
      if (filtros.idDivisa && r.ID_Divisa.toString() !== filtros.idDivisa) return false;

      // 3. Filtro de Búsqueda (Texto)
      if (!filtros.busqueda) return true;
      const term = filtros.busqueda.toLowerCase();
      
      // Datos Paciente (PascalCase de Prisma)
      const paciente = r.Cita?.Paciente;
      const pacienteNombre = `${paciente?.Nombre} ${paciente?.Apellido}`.toLowerCase();
      const identificacion = 
        paciente?.PacienteAdulto?.No_Cedula?.toLowerCase() || 
        paciente?.Paciente_Menor?.PartidaDeNacimiento?.toLowerCase() || '';

      // Datos Psicólogo
      const doctor = r.Cita?.Psicologo;
      const doctorNombre = `${doctor?.Nombre} ${doctor?.Apellido}`.toLowerCase();
      const minsa = doctor?.CodigoMinsa?.toLowerCase() || '';

      // Datos Recibo
      const numRecibo = r.Cod_Recibo.toString();

      return (
        pacienteNombre.includes(term) ||
        identificacion.includes(term) ||
        doctorNombre.includes(term) ||
        minsa.includes(term) ||
        numRecibo.includes(term)
      );
    });
  }, [recibos, filtros]);

  // --- CÁLCULO DE TOTALES BIMONEDA (KPIs) ---
  const totales = useMemo(() => {
    const ingresosNIO = recibosFiltrados
      .filter(r => r.ID_Divisa === 1) // Asumiendo 1 = NIO
      .reduce((acc, curr) => acc + Number(curr.MontoTotal), 0);

    const ingresosUSD = recibosFiltrados
      .filter(r => r.ID_Divisa === 2) // Asumiendo 2 = USD
      .reduce((acc, curr) => acc + Number(curr.MontoTotal), 0);

    const transacciones = recibosFiltrados.length;

    return { 
      ingresosNIO, 
      ingresosUSD, 
      transacciones 
    };
  }, [recibosFiltrados]);

  const setFiltro = (key: string, value: string) => {
    setFiltros(prev => ({ ...prev, [key]: value }));
  };

  const limpiarFiltros = () => {
    setFiltros({ busqueda: '', fechaInicio: '', fechaFin: '', idDivisa: '' });
  };

  return {
    facturas: recibosFiltrados, // Mantenemos el nombre de la variable para no romper el componente visual por ahora
    loading,
    filtros,
    totales,
    setFiltro,
    limpiarFiltros,
    recargar: fetchRecibos
  };
};