"use client";

import { useState } from "react";
import type { ConsultaIndividual, ConsultaConjunta } from "@/lib/academic/Consultas";

export function ConsultasPanel({ individual, conjunta }: { individual: ConsultaIndividual | null; conjunta: ConsultaConjunta | null }) {
  const [nombre, setNombre] = useState("");
  const [perfil, setPerfil] = useState<ReturnType<ConsultaIndividual["perfil"]> | null>(null);

  if (!individual || !conjunta) return null;
  const stats = conjunta.estadisticasGlobales();
  const porGrado = conjunta.informesPorGrado();

  return (
    <div className="border rounded p-3 flex flex-col gap-2">
      <b>Consulta Individual (S) y Conjunta (T)</b>
      <div className="flex gap-2">
        <input placeholder="Estudiante" value={nombre} onChange={(e) => setNombre(e.target.value)} className="border rounded px-2 py-1" />
        <button type="button" onClick={() => setPerfil(individual.perfil(nombre))} className="border rounded px-3 py-1">
          Ver perfil
        </button>
      </div>
      {perfil ? (
        <p className="text-sm">Perfil: {perfil.pagos} pagos · {perfil.reportes} reportes · {perfil.certificados} certificados — Progreso: {JSON.stringify(individual.progresoPorMateria(nombre))}</p>
      ) : null}
      <p className="text-sm">Informes por grado (T1): {JSON.stringify(porGrado)} — Estadísticas (T2): {JSON.stringify(stats)} — Controles: cadena {stats.cadenaValida ? "válida" : "alterada"}</p>
    </div>
  );
}
