"use client";

import { useState } from "react";
import { CONCEPTOS, MESES, METODOS } from "@/lib/payments";
import type { PaymentData } from "@/lib/payments";

interface Props {
  onSubmit: (data: PaymentData) => boolean;
  externalError: string | null;
  estudiantes: { nombre: string; grado: string }[];
}

/** SRP: solo captura y valida el formulario por filas. Estudiantes vienen de inscripciones. */
export function PaymentForm({ onSubmit, externalError, estudiantes }: Props) {
  const [estudiante, setEstudiante] = useState("");
  const [concepto, setConcepto] = useState<string>(CONCEPTOS[0]);
  const [valorRaw, setValorRaw] = useState("");
  const [metodo, setMetodo] = useState<string>(METODOS[0]);
  const [mes, setMes] = useState<string>(MESES[0]);
  const [localError, setLocalError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!estudiante) {
      setLocalError("Selecciona un estudiante inscrito.");
      return;
    }
    const valor = Number(valorRaw);
    const ok = onSubmit({ estudiante, concepto, valor, metodo, mes });
    if (ok) {
      setValorRaw("");
      setConcepto(CONCEPTOS[0]);
      setMetodo(METODOS[0]);
      setLocalError(null);
    } else {
      setLocalError("Revisa los datos del pago.");
    }
  }

  const error = localError ?? externalError;

  if (estudiantes.length === 0) {
    return <p className="text-sm text-amber-700 border rounded p-3 bg-amber-50">Aún no hay estudiantes inscritos. Ve a <a href="/inscripciones" className="underline">Inscripciones</a> para registrar uno.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-md">
      <label className="flex flex-col gap-1">
        Estudiante
        <select value={estudiante} onChange={(e) => setEstudiante(e.target.value)} className="border rounded px-2 py-1" required>
          <option value="">Selecciona estudiante</option>
          {estudiantes.map((e) => (
            <option key={e.nombre} value={e.nombre}>{e.nombre} — {e.grado}</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        Concepto:
        <select value={concepto} onChange={(e) => setConcepto(e.target.value)} className="border rounded px-2 py-1">
          {CONCEPTOS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        Valor $:
        <input
          type="number"
          min={1}
          step={1}
          value={valorRaw}
          onChange={(e) => setValorRaw(e.target.value)}
          placeholder="280000"
          className="border rounded px-2 py-1"
        />
      </label>
      <label className="flex flex-col gap-1">
        Método:
        <select value={metodo} onChange={(e) => setMetodo(e.target.value)} className="border rounded px-2 py-1">
          {METODOS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        Mes:
        <select value={mes} onChange={(e) => setMes(e.target.value)} className="border rounded px-2 py-1">
          {MESES.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </label>
      {error ? <p role="alert" className="text-sm text-red-600">{error}</p> : null}
      <button type="submit" className="border rounded px-4 py-2 w-fit">
        Registrar pago
      </button>
    </form>
  );
}
