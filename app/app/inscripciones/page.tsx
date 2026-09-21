"use client";

import { useState } from "react";
import { ChainList } from "@/components/payments/ChainList";
import { ChainStatus } from "@/components/payments/ChainStatus";
import { usePaymentChain } from "@/hooks/usePaymentChain";
import { useCadenaIntegrada } from "@/hooks/useCadenaIntegrada";
import { ServicioInscripciones } from "@/lib/inscripciones/ServicioInscripciones";
import { Inscripcion } from "@/lib/inscripciones/Inscripcion";

export default function InscripcionesPage() {
  const pagos = usePaymentChain();
  const { snapshot } = useCadenaIntegrada();

  const chain = pagos.store.getChain();
  const repo = pagos.store.getRepository();
  const servicio = chain && repo ? new ServicioInscripciones(chain, repo) : null;

  const [nombre, setNombre] = useState("");
  const [grado, setGrado] = useState("Jardín");
  const [acudiente, setAcudiente] = useState("");
  const [periodo, setPeriodo] = useState("2026-1");
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function inscribir(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!servicio) {
      setError("La cadena aún está cargando, intenta de nuevo.");
      return;
    }
    if (!nombre.trim() || !acudiente.trim()) {
      setError("Completa estudiante y acudiente.");
      return;
    }
    const r = servicio.inscribir({ estudianteNombre: nombre.trim(), grado, acudienteNombre: acudiente.trim(), periodo: periodo.trim() });
    if (r.ok) {
      setMsg(`Estudiante ${r.inscripcion?.estudianteNombre} inscrito correctamente.`);
      setError(null);
      setNombre("");
      setAcudiente("");
      pagos.store.refresh();
    } else {
      setError(r.error ?? "No se pudo inscribir.");
    }
  }

  const inscCount = snapshot.blocks.filter((b) => Inscripcion.parse(b.data)).length;

  return (
    <main className="flex flex-col gap-4 p-6 max-w-3xl">
      <h1 className="text-2xl font-semibold">Kids Zone — Inscripciones</h1>
      <p className="text-sm text-zinc-600">Registra nuevos estudiantes. Cada inscripción queda guardada de forma permanente en la misma cadena que pagos y certificados.</p>
      <ChainStatus status={snapshot.loaded ? (snapshot.validation.ok ? "Registros íntegros." : `Se detectó una alteración en el registro ${ (snapshot.validation as { i: number }).i }.`) : "Cargando…"} ok={snapshot.validation.ok} />

      <form onSubmit={inscribir} className="flex flex-col gap-3 max-w-md border rounded p-4">
        <h2 className="font-medium">Inscribir estudiante</h2>
        <label className="flex flex-col gap-1 text-sm">
          Estudiante
          <input placeholder="Nombre completo" value={nombre} onChange={(e) => setNombre(e.target.value)} className="border rounded px-2 py-1" required />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Grado
          <select value={grado} onChange={(e) => setGrado(e.target.value)} className="border rounded px-2 py-1">
            <option>Jardín</option>
            <option>Transición</option>
            <option>Primero</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Acudiente
          <input placeholder="Nombre del acudiente" value={acudiente} onChange={(e) => setAcudiente(e.target.value)} className="border rounded px-2 py-1" required />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Periodo
          <input placeholder="2026-1" value={periodo} onChange={(e) => setPeriodo(e.target.value)} className="border rounded px-2 py-1" />
        </label>
        <button type="submit" className="border rounded px-4 py-2 w-fit bg-black text-white hover:bg-zinc-800">Inscribir estudiante</button>
        {msg ? <p className="text-sm text-green-700">{msg}</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </form>

      <section className="border rounded p-3 text-sm">
        <p>Estudiantes inscritos: <b>{inscCount}</b> — Total de registros en la cadena: <b>{snapshot.blocks.length}</b></p>
        <p className="text-zinc-600">Los pagos y certificados de cada estudiante se validan automáticamente para el cierre de periodo.</p>
      </section>

      <hr />
      <h2 className="font-medium">Historial de registros</h2>
      <ChainList blocks={snapshot.blocks} annulled={pagos.annulled} onAnnul={pagos.annulPayment} />
    </main>
  );
}
