"use client";

import { useState } from "react";
import type { VerificacionEstado } from "@/lib/academic/VerificacionEstado";

export function VerificacionPanel({ verificacion }: { verificacion: VerificacionEstado | null }) {
  const [nombre, setNombre] = useState("");
  const [periodo, setPeriodo] = useState("2026-1");
  const [res, setRes] = useState<ReturnType<VerificacionEstado["verificar"]> | null>(null);

  if (!verificacion) return null;
  return (
    <div className="border rounded p-3 flex flex-col gap-2 max-w-md">
      <b>Verificación Automática de Estado (M) — Hito Clave</b>
      <span className="text-sm">a) Pagos al día? b) Aprobación académica completa?</span>
      <input placeholder="Estudiante" value={nombre} onChange={(e) => setNombre(e.target.value)} className="border rounded px-2 py-1" />
      <input placeholder="Periodo" value={periodo} onChange={(e) => setPeriodo(e.target.value)} className="border rounded px-2 py-1" />
      <button type="button" onClick={() => setRes(verificacion.verificar(nombre, periodo))} className="border rounded px-3 py-1 w-fit">
        Verificar
      </button>
      {res ? (
        <p className={`text-sm ${res.puedeCertificar ? "text-green-700" : "text-red-700"}`}>
          {res.detalle} — pagos:{res.pagosAlDia ? "sí" : "no"} · aprobación:{res.aprobacionCompleta ? "sí" : "no"} {res.puedeCertificar ? "→ N: Cierre y Certificación" : "→ O/F: Pendiente/Refuerzo"}
        </p>
      ) : null}
    </div>
  );
}
