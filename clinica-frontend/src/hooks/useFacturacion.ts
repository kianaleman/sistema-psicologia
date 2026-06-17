import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../services/api';
import type { Recibo, Cita, Paciente, Psicologo, MetodoPago, Banco, Divisa } from '../types';

type ReciboFacturacion = Recibo & {
  Divisa?: Divisa | null;
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

export function obtenerCodigoDivisaRecibo(recibo: ReciboFacturacion) {
  return (recibo.Divisa?.Codigo_ISO || '').trim().toUpperCase() || 'NIO';
}

export function obtenerSimboloDivisaRecibo(recibo: ReciboFacturacion) {
  return obtenerCodigoDivisaRecibo(recibo) === 'USD' ? '$' : 'C$';
}

export function calcularEquivalenteCordobas(recibo: ReciboFacturacion) {
  const monto = Number(recibo.MontoTotal || 0);
  const codigoDivisa = obtenerCodigoDivisaRecibo(recibo);
  const tasaCambio = Number(recibo.Tasa_Cambio || 1);

  if (codigoDivisa === 'USD') {
    return monto * (Number.isFinite(tasaCambio) && tasaCambio > 0 ? tasaCambio : 0);
  }

  return monto;
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
      const divisa = obtenerCodigoDivisaRecibo(recibo).toLowerCase();

      return (
        pacienteNombre.includes(termino) ||
        identificacionPaciente.includes(termino) ||
        psicologoNombre.includes(termino) ||
        codigoMinsa.includes(termino) ||
        numeroRecibo.includes(termino) ||
        metodoPago.includes(termino) ||
        banco.includes(termino) ||
        referencia.includes(termino) ||
        divisa.includes(termino)
      );
    });
  }, [recibos, filtros]);

  const totales = useMemo(() => {
    const ingresosCordobas = facturasFiltradas
      .filter((recibo) => obtenerCodigoDivisaRecibo(recibo) !== 'USD')
      .reduce((acc, curr) => acc + Number(curr.MontoTotal || 0), 0);

    const ingresosDolares = facturasFiltradas
      .filter((recibo) => obtenerCodigoDivisaRecibo(recibo) === 'USD')
      .reduce((acc, curr) => acc + Number(curr.MontoTotal || 0), 0);

    const equivalenteCordobas = facturasFiltradas
      .reduce((acc, curr) => acc + calcularEquivalenteCordobas(curr), 0);

    const transacciones = facturasFiltradas.length;
    const ticketPromedio = transacciones > 0 ? equivalenteCordobas / transacciones : 0;

    return {
      ingresos: equivalenteCordobas,
      ingresosCordobas,
      ingresosDolares,
      equivalenteCordobas,
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
