'use client';

import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import { type PaymentData } from '@/lib/payments';
import {
  chainStore as legacyStore,
  obtenerStore,
} from '@/lib/kernel/chainSingleton';
import { Acudiente } from '@/lib/domain/Acudiente';
import { Estudiante } from '@/lib/domain/Estudiante';
import { CATALOGO_CONCEPTOS } from '@/lib/domain/catalog';
import { Administracion } from '@/lib/domain/Administracion';
import { Bloque } from '@/lib/domain/Bloque';
import { buscarEstudiante } from '@/lib/inscripciones/StudentRegistry';

/**
 * Pagos del estudiante en su propia cadena
 */
export function usePaymentChain(estudianteNombre?: string) {
  const store = useMemo(
    () =>
      estudianteNombre?.trim()
        ? obtenerStore({
            modulo: 'pagos',
            estudianteId: estudianteNombre.trim(),
          })
        : legacyStore,
    [estudianteNombre]
  );

  useEffect(() => {
    store.ensureLoaded();
  }, [store]);

  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot
  );

  const scoped = Boolean(estudianteNombre?.trim());

  const status = useMemo(
    () =>
      snapshot.validation.ok
        ? snapshot.loaded
          ? scoped
            ? `Cadena de pagos de ${estudianteNombre?.trim()} íntegra (todos los hashes coinciden).`
            : 'Cadena íntegra (todos los hashes coinciden).'
          : 'Cargando cadena…'
        : `Cadena alterada en el bloque ${(snapshot.validation as { i: number }).i} (se detectó una modificación).`,
    [snapshot.validation, snapshot.loaded, scoped, estudianteNombre]
  );

  const addPaymentDominio = useCallback(
    (data: PaymentData) => {
      const chain = store.getChain();
      const repo = store.getRepository();
      if (!chain) return store.addPayment(data);

      // El estudiante debe existir en el registro compartido
      const inscrito = buscarEstudiante(data.estudiante);
      if (!inscrito) {
        store.setError(
          'El estudiante no está inscrito. Regístralo primero en Inscripciones.'
        );
        return false;
      }

      const estudiante = new Estudiante(
        `est-${inscrito.nombre}`,
        inscrito.nombre,
        inscrito.grado
      );

      const concepto =
        CATALOGO_CONCEPTOS.find((c) => c.tipo === data.concepto) ??
        CATALOGO_CONCEPTOS[0];

      const acudiente = new Acudiente(
        `acu-${estudiante.id_estudiante}`,
        `Acudiente de ${estudiante.nombre}`,
        '0x0',
        estudiante
      );

      const pago = acudiente.realizarPago({
        conceptoId: concepto.tipo,
        monto: data.valor,
        metodo: data.metodo,
        periodo: data.mes,
      });

      // validar → confirmar → agregar al final + minar → persistir.
      if (pago.estado !== 'pendiente') return false;
      const msgPago = pago.validar();
      if (msgPago) {
        store.setError(msgPago);
        return false;
      }
      pago.confirmarPago();
      chain.addBlock(pago.toBlockData());
      repo.save(chain.toJSON());

      const bloque = Bloque.desdeBlock(chain.getLast(), pago);
      const comprobante = bloque.generarComprobante();
      comprobante.aplicarAEstudiante(estudiante);
      store.refresh();
      return true;
    },
    [store]
  );

  const chain = store.getChain();
  const administracion = chain
    ? new Administracion('admin-1', 'Administración Kids Zone', chain)
    : null;

  return {
    store,
    blocks: snapshot.blocks,
    annulled: snapshot.annulled,
    validation: snapshot.validation,
    status,
    loaded: snapshot.loaded,
    error: snapshot.error,
    addPayment: (data: PaymentData) => {
      if (!scoped) {
        store.setError('Seleccione el estudiante');
        return false;
      }
      return store.addPayment(data);
    },
    addPaymentDominio: (data: PaymentData) => {
      if (!scoped) {
        store.setError('Seleccione el estudiante');
        return false;
      }
      return addPaymentDominio(data);
    },
    annulPayment: (index: number, motivo: string) => {
      if (!scoped) return false;
      return store.annulPayment(index, motivo);
    },
    administracion,
  };
}
