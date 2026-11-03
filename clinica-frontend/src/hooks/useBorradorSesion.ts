import { useSyncExternalStore, type SetStateAction } from 'react';
import { borradoresSesion, claveBorrador, type BorradorSesion } from '../services/borradoresSesion';
import type { Cita } from '../types';
export function useBorradorSesion(cita: Cita, inicio: string | null) {
    const clave = claveBorrador(cita);
    const borrador = useSyncExternalStore(borradoresSesion.subscribe, () => borradoresSesion.obtener(clave, inicio));
    const setter = <K extends keyof BorradorSesion>(campo: K) => (value: SetStateAction<BorradorSesion[K]>) => {
        const actual = borradoresSesion.obtener(clave, inicio);
        const next = typeof value === 'function' ? (value as (v: BorradorSesion[K]) => BorradorSesion[K])(actual[campo]) : value;
        borradoresSesion.actualizar(clave, { [campo]: next });
    };
    return { borrador, setter, clave };
}
