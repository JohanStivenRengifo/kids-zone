"use client";

import { useState } from "react";

interface Props {
  onSubmit: (data: { estudianteNombre: string; grado: string; materia: string; periodo: string; nota: number; docenteId: string; observaciones?: string }) => { ok: boolean; error?: string };
}

export function ReporteForm({ onSubmit }: Props) {
  const [estudianteNombre, setEstudiante] = useState("");
  const [grado, setGrado] = useState("Jardín");
  const [materia, setMateria] = useState("Matemáticas");
  const [periodo, setPeriodo] = useState("2026-1");
  const [nota, setNota] = useState("");
  const [docenteId, setDocente] = useState("doc-1");
  const [obs, setObs] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  function handle(e: React.FormEvent) {
    e.preventDefault();
    const r = onSubmit({ estudianteNombre, grado, materia, periodo, nota: Number(nota), docenteId, observaciones: obs });
    setMsg(r.ok ? "Reporte registrado en la cadena integrada (G)." : r.error ?? "Error");
    if (r.ok) {
      setNota("");
      setObs("");
    }
  }

  return (
    <form onSubmit={handle} className="flex flex-col gap-2 max-w-md border rounded p-3">
      <b>Docentes → Reportes de Progreso (C)</b>
      <input placeholder="Estudiante" value={estudianteNombre} onChange={(e) => setEstudiante(e.target.value)} className="border rounded px-2 py-1" />
      <input placeholder="Grado" value={grado} onChange={(e) => setGrado(e.target.value)} className="border rounded px-2 py-1" />
      <input placeholder="Materia" value={materia} onChange={(e) => setMateria(e.target.value)} className="border rounded px-2 py-1" />
      <input placeholder="Periodo" value={periodo} onChange={(e) => setPeriodo(e.target.value)} className="border rounded px-2 py-1" />
      <input type="number" min={0} max={5} step={0.1} placeholder="Nota 0-5" value={nota} onChange={(e) => setNota(e.target.value)} className="border rounded px-2 py-1" />
      <input placeholder="Docente ID" value={docenteId} onChange={(e) => setDocente(e.target.value)} className="border rounded px-2 py-1" />
      <input placeholder="Observaciones" value={obs} onChange={(e) => setObs(e.target.value)} className="border rounded px-2 py-1" />
      <button type="submit" className="border rounded px-3 py-1 w-fit">Registrar reporte</button>
      {msg ? <p className="text-sm">{msg}</p> : null}
    </form>
  );
}
