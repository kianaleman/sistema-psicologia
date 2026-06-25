import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../services/api';
import type { Recibo, Cita, Paciente, Psicologo, MetodoPago, Banco } from '../types';

type DivisaFacturacion = {
  ID_Divisa: number;
  Codigo_ISO: string;
  Nombre: string;
};

type ReciboFacturacion = Recibo & {
  Divisa?: DivisaFacturacion | null;
  MetodoPago?: MetodoPago | null;
  Banco?: Banco | null;
  Cita?: Cita & {
    Paciente?: Paciente;
    Psicologo?: Psicologo;
  };
};

type FiltrosFacturacion = {
  busqueda: string;
  fechaInicio: string;
  fechaFin: string;
};

const filtrosIniciales: FiltrosFacturacion = {
  busqueda: '',
  fechaInicio: '',
  fechaFin: '',
};

function obtenerFechaFiltro(recibo: ReciboFacturacion) {
  return (recibo.FechaDePago || recibo.FechaRecibo || '').toString().split('T')[0];
}

function obtenerNombrePaciente(recibo: ReciboFacturacion) {
  const paciente = recibo.Cita?.Paciente;

  if (!paciente) return '';

  return `${paciente.Nombre || ''} ${paciente.Apellido || ''}`.trim().toLowerCase();
}

function obtenerIdentificacionPaciente(recibo: ReciboFacturacion) {
  const paciente = recibo.Cita?.Paciente;

  return (
    paciente?.PacienteAdulto?.No_Cedula ||
    paciente?.Paciente_Menor?.PartidaDeNacimiento ||
    ''
  ).toLowerCase();
}

function obtenerNombrePsicologo(recibo: ReciboFacturacion) {
  const psicologo = recibo.Cita?.Psicologo;

  if (!psicologo) return '';

  return `${psicologo.Nombre || ''} ${psicologo.Apellido || ''}`.trim().toLowerCase();
}

export const useFacturacion = () => {
  const [recibos, setRecibos] = useState<ReciboFacturacion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filtros, setFiltros] = useState<FiltrosFacturacion>(filtrosIniciales);

  const fetchFacturas = useCallback(async () => {
    try {
      setLoading(true);

      const data = await api.facturas.getAll() as ReciboFacturacion[];

      setRecibos(Array.isArray(data) ? data : []);
    } catch (error: unknown) {
      console.error('Error al cargar recibos/facturas:', error);
      setRecibos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFacturas();
  }, [fetchFacturas]);

  const facturasFiltradas = useMemo(() => {
    const termino = filtros.busqueda.trim().toLowerCase();

    return recibos.filter((recibo) => {
      const fechaRecibo = obtenerFechaFiltro(recibo);

      if (filtros.fechaInicio && fechaRecibo < filtros.fechaInicio) return false;
      if (filtros.fechaFin && fechaRecibo > filtros.fechaFin) return false;

      if (!termino) return true;

      const pacienteNombre = obtenerNombrePaciente(recibo);
      const identificacionPaciente = obtenerIdentificacionPaciente(recibo);
      const psicologoNombre = obtenerNombrePsicologo(recibo);
      const codigoMinsa = recibo.Cita?.Psicologo?.CodigoMinsa?.toLowerCase() || '';
      const numeroRecibo = recibo.Cod_Recibo.toString();
      const metodoPago = recibo.MetodoPago?.Nombre_Metodo?.toLowerCase() || '';
      const banco = recibo.Banco?.Nombre_Banco?.toLowerCase() || '';
      const referencia = recibo.Numero_Referencia?.toLowerCase() || '';

      return (
        pacienteNombre.includes(termino) ||
        identificacionPaciente.includes(termino) ||
        psicologoNombre.includes(termino) ||
        codigoMinsa.includes(termino) ||
        numeroRecibo.includes(termino) ||
        metodoPago.includes(termino) ||
        banco.includes(termino) ||
        referencia.includes(termino)
      );
    });
  }, [recibos, filtros]);

  const totales = useMemo(() => {
    const ingresos = facturasFiltradas.reduce((acc, curr) => acc + Number(curr.MontoTotal || 0), 0);
    const transacciones = facturasFiltradas.length;
    const ticketPromedio = transacciones > 0 ? ingresos / transacciones : 0;

    return {
      ingresos,
      transacciones,
      ticketPromedio,
    };
  }, [facturasFiltradas]);

  const setFiltro = (key: keyof FiltrosFacturacion, value: string) => {
    setFiltros((prev) => ({ ...prev, [key]: value }));
  };

  const limpiarFiltros = () => {
    setFiltros(filtrosIniciales);
  };

  return {
    facturas: facturasFiltradas,
    loading,
    filtros,
    totales,
    setFiltro,
    limpiarFiltros,
    recargar: fetchFacturas,
  };
};

export type { ReciboFacturacion, FiltrosFacturacion };
