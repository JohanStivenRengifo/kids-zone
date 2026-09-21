"use client";

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { type PaymentData } from "@/lib/payments";
import { chainStore as store } from "@/lib/kernel/chainSingleton";
import { Acudiente } from "@/lib/domain/Acudiente";
import { Estudiante } from "@/lib/domain/Estudiante";
import { SmartContract } from "@/lib/domain/SmartContract";
import { CATALOGO_CONCEPTOS } from "@/lib/domain/catalog";
import { Administracion } from "@/lib/domain/Administracion";
import { Bloque } from "@/lib/domain/Bloque";
import { getEstudiantesInscritos } from "@/lib/inscripciones/registry";

export function usePaymentChain() {
  useEffect(() => {
    store.ensureLoaded();
  }, []);

  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );

  const status = useMemo(
    () =>
      snapshot.validation.ok
        ? snapshot.loaded
          ? "Cadena íntegra (todos los hashes coinciden)."
          : "Cargando cadena…"
        : `Cadena alterada en el bloque ${(snapshot.validation as { i: number }).i} (se detectó una modificación).`,
    [snapshot.validation, snapshot.loaded],
  );

  const addPaymentDominio = useCallback(
    (data: PaymentData) => {
      const chain = store.getChain();
      const repo = store.getRepository();
      if (!chain) return store.addPayment(data);

      const inscritos = getEstudiantesInscritos(chain);
      const inscrito = inscritos.find((e) => e.nombre === data.estudiante);
      if (!inscrito) {
        store.setError("El estudiante no está inscrito. Regístralo primero en Inscripciones.");
        return false;
      }

      const estudiante = new Estudiante(`est-${inscrito.nombre}`, inscrito.nombre, inscrito.grado);

      const concepto = CATALOGO_CONCEPTOS.find((c) => c.tipo === data.concepto) ?? CATALOGO_CONCEPTOS[0];

      const acudiente = new Acudiente(
        `acu-${estudiante.id_estudiante}`,
        `Acudiente de ${estudiante.nombre}`,
        "0x0",
        estudiante,
      );

      const pago = acudiente.realizarPago({
        conceptoId: concepto.tipo,
        monto: data.valor,
        metodo: data.metodo,
        periodo: data.mes,
      });

      const contrato = new SmartContract("kids-contrato-1", "0xKidsZone", "1.0", chain, repo);
      const res = contrato.recibirTransaccion(pago);
      if (!res.ok) return false;

      const bloque = Bloque.desdeBlock(chain.getLast(), pago);
      const comprobante = bloque.generarComprobante();
      comprobante.aplicarAEstudiante(estudiante);
      store.refresh();
      return true;
    },
    [],
  );

  const chain = store.getChain();
  const administracion = chain ? new Administracion("admin-1", "Administración Kids Zone", chain) : null;

  return {
    store,
    blocks: snapshot.blocks,
    annulled: snapshot.annulled,
    validation: snapshot.validation,
    status,
    loaded: snapshot.loaded,
    error: snapshot.error,
    addPayment: (data: PaymentData) => store.addPayment(data),
    addPaymentDominio,
    annulPayment: (index: number, motivo: string) => store.annulPayment(index, motivo),
    administracion,
  };
}
