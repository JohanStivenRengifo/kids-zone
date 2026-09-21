'use client';

import { useEffect, useMemo, useSyncExternalStore } from 'react';
import {
  chainStore as legacyStore,
  obtenerStore,
  obtenerStoreGenerico,
} from '@/lib/kernel/chainSingleton';
import type { Modulo } from '@/lib/kernel/scopedChains';

export function useScopedChain(
  modulo: Modulo,
  estudianteNombre: string | null
) {
  const store = useMemo(() => {
    if (!estudianteNombre?.trim()) return legacyStore;
    if (modulo === 'pagos')
      return obtenerStore({ modulo, estudianteId: estudianteNombre.trim() });
    return obtenerStoreGenerico({
      modulo,
      estudianteId: estudianteNombre.trim(),
    });
  }, [modulo, estudianteNombre]);

  useEffect(() => {
    store.ensureLoaded();
  }, [store]);

  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot
  );

  const status = useMemo(
    () =>
      snapshot.validation.ok
        ? snapshot.loaded
          ? 'Cadena íntegra (todos los hashes coinciden).'
          : 'Cargando cadena…'
        : `Cadena alterada en el bloque ${(snapshot.validation as { i: number }).i} (se detectó una modificación).`,
    [snapshot.validation, snapshot.loaded]
  );

  return { store, snapshot, status };
}
