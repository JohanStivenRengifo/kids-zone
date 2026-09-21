"use client";

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { chainStore as store } from "@/lib/kernel/chainSingleton";
import { CriterioKidsZone } from "@/lib/academic/CriterioAprobacion";
import { ServicioAcademico } from "@/lib/academic/ServicioAcademico";
import { ReporteProgreso } from "@/lib/academic/ReporteProgreso";
import { VerificacionEstado } from "@/lib/academic/VerificacionEstado";
import { ConsultaConjunta, ConsultaIndividual } from "@/lib/academic/Consultas";

export function useCadenaIntegrada() {
  useEffect(() => {
    store.ensureLoaded();
  }, []);

  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);

  const servicio = useMemo(() => {
    if (!snapshot.loaded) return null;
    const chain = store.getChain();
    const repo = store.getRepository();
    if (!chain) return null;
    return new ServicioAcademico(chain, repo, new CriterioKidsZone());
  }, [snapshot]);

  const emitirReporte = useCallback(
    (data: { estudianteNombre: string; grado: string; materia: string; periodo: string; nota: number; docenteId: string; observaciones?: string }) => {
      if (!servicio) return { ok: false as const, error: "Cadena no lista" };
      const reporte = new ReporteProgreso("", data.estudianteNombre, data.grado, data.materia, data.periodo, data.nota, data.docenteId, data.observaciones ?? "");
      const res = servicio.emitirReporteData(reporte);
      if (res.ok) store.refresh();
      return res;
    },
    [servicio],
  );

  const verificacion = useMemo(() => {
    if (!snapshot.loaded) return null;
    const chain = store.getChain();
    if (!chain) return null;
    return new VerificacionEstado(chain);
  }, [snapshot]);

  const individual = useMemo(() => {
    if (!snapshot.loaded) return null;
    const chain = store.getChain();
    if (!chain) return null;
    return new ConsultaIndividual(chain);
  }, [snapshot]);

  const conjunta = useMemo(() => {
    if (!snapshot.loaded) return null;
    const chain = store.getChain();
    if (!chain) return null;
    return new ConsultaConjunta(chain);
  }, [snapshot]);

  return { store, snapshot, emitirReporte, verificacion, individual, conjunta, servicio };
}
