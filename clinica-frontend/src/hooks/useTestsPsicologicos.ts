import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api } from '../services/api';
import type {
  CrearAplicacionTestDTO,
  CrearAplicacionTestResponse,
  TestAplicacionResumen,
  TestPsicologico,
} from '../types';

export function useTestsPsicologicos(options?: { autoLoad?: boolean }) {
  const [tests, setTests] = useState<TestPsicologico[]>([]);
  const [resultados, setResultados] = useState<TestAplicacionResumen[]>([]);
  const [loadingTests, setLoadingTests] = useState(false);
  const [loadingResultados, setLoadingResultados] = useState(false);
  const [saving, setSaving] = useState(false);

  const cargarTests = useCallback(async () => {
    try {
      setLoadingTests(true);
      const data = await api.tests.getAll();
      setTests(data);
      return data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'No se pudieron cargar los tests psicológicos.';
      toast.error(message);
      setTests([]);
      return [];
    } finally {
      setLoadingTests(false);
    }
  }, []);

  const cargarResultadosPaciente = useCallback(async (idPaciente: number) => {
    try {
      setLoadingResultados(true);
      const data = await api.tests.getResultadosPaciente(idPaciente);
      setResultados(data);
      return data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'No se pudieron cargar los resultados del paciente.';
      toast.error(message);
      setResultados([]);
      return [];
    } finally {
      setLoadingResultados(false);
    }
  }, []);

  const cargarResultadosSesion = useCallback(async (idSesion: number) => {
    try {
      setLoadingResultados(true);
      const data = await api.tests.getResultadosSesion(idSesion);
      setResultados(data);
      return data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'No se pudieron cargar los resultados de la sesión.';
      toast.error(message);
      setResultados([]);
      return [];
    } finally {
      setLoadingResultados(false);
    }
  }, []);

  const crearAplicacion = useCallback(async (payload: CrearAplicacionTestDTO): Promise<CrearAplicacionTestResponse | null> => {
    try {
      setSaving(true);
      const result = await api.tests.crearAplicacion(payload);
      toast.success('Test psicológico generado correctamente.');
      return result;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'No se pudo generar el test psicológico.';
      toast.error(message);
      return null;
    } finally {
      setSaving(false);
    }
  }, []);

  const anularAplicacion = useCallback(async (idAplicacion: number) => {
    try {
      setSaving(true);
      const result = await api.tests.anularAplicacion(idAplicacion);
      toast.success('Aplicación de test anulada correctamente.');
      return result;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'No se pudo anular la aplicación del test.';
      toast.error(message);
      return null;
    } finally {
      setSaving(false);
    }
  }, []);

  useEffect(() => {
    if (options?.autoLoad === false) return;
    void cargarTests();
  }, [cargarTests, options?.autoLoad]);

  return {
    tests,
    resultados,
    loadingTests,
    loadingResultados,
    saving,
    cargarTests,
    cargarResultadosPaciente,
    cargarResultadosSesion,
    crearAplicacion,
    anularAplicacion,
    setResultados,
  };
}
