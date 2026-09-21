"use client";

import { Suspense, useState } from "react";
import { ChainList } from "@/components/payments/ChainList";
import { ChainStatus } from "@/components/payments/ChainStatus";
import { QRCodeView } from "@/components/qr/QRCodeView";
import { VerificacionEscaneada } from "@/components/qr/VerificacionEscaneada";
import { usePaymentChain } from "@/hooks/usePaymentChain";
import { useCadenaIntegrada } from "@/hooks/useCadenaIntegrada";
import { ServicioInscripciones } from "@/lib/inscripciones/ServicioInscripciones";
import { Inscripcion } from "@/lib/inscripciones/Inscripcion";
import { getEstudiantesInscritos } from "@/lib/inscripciones/registry";
import { ServicioCalificaciones } from "@/lib/academic/ServicioCalificaciones";
import { ACTORES, actorPorId, DOCENTE, ADMINISTRADOR } from "@/lib/academic/Actores";
import type { EstadoCalificacion } from "@/lib/academic/Calificacion";
import { buildVerificationUrl } from "@/lib/qr/verificar";

const GRADOS = ["Pre-Jardín", "Jardín", "Transición"];
const HOY = new Date().toISOString().slice(0, 10);

export default function InscripcionesPage() {
  const pagos = usePaymentChain();
  const { snapshot } = useCadenaIntegrada();

  const chain = pagos.store.getChain();
  const repo = pagos.store.getRepository();
  const servicio = chain && repo ? new ServicioInscripciones(chain, repo) : null;
  const servicioCal = chain && repo ? new ServicioCalificaciones(chain, repo) : null;

  const estudiantes = getEstudiantesInscritos(chain);
  const calificaciones = servicioCal?.listar() ?? [];

  const [nombre, setNombre] = useState("");
  const [grado, setGrado] = useState(GRADOS[0]);
  const [acudiente, setAcudiente] = useState("");
  const [periodo, setPeriodo] = useState("2026-1");
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [qrHash, setQrHash] = useState<string | null>(null);

  const [rolId, setRolId] = useState<string>(DOCENTE.id);
  const rol = actorPorId(rolId);

  const [calEstudiante, setCalEstudiante] = useState("");
  const [calEstado, setCalEstado] = useState<EstadoCalificacion>("Aprobado");
  const [calFecha, setCalFecha] = useState(HOY);
  const [calMsg, setCalMsg] = useState<string | null>(null);
  const [calError, setCalError] = useState<string | null>(null);

  const [modCalHash, setModCalHash] = useState("");
  const [modEstado, setModEstado] = useState<EstadoCalificacion>("Aprobado");
  const [modMotivo, setModMotivo] = useState("");
  const [modFecha, setModFecha] = useState(HOY);
  const [modMsg, setModMsg] = useState<string | null>(null);
  const [modError, setModError] = useState<string | null>(null);

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
      const nuevoBloque = pagos.store.getChain()?.getLast();
      setQrHash(nuevoBloque?.hash ?? null);
    } else {
      setError(r.error ?? "No se pudo inscribir.");
    }
  }

  function registrarCal(e: React.FormEvent) {
    e.preventDefault();
    setCalMsg(null);
    setCalError(null);
    if (!servicioCal) {
      setCalError("La cadena aún está cargando, intenta de nuevo.");
      return;
    }
    const insc = estudiantes.find((s) => s.nombre === calEstudiante);
    const r = servicioCal.registrarCalificacion(
      { estudiante: calEstudiante, grado: insc?.grado ?? grado, estado: calEstado, registradaPor: DOCENTE.id, fecha: calFecha },
      rol,
    );
    if (r.ok) {
      setCalMsg(`Calificación registrada por ${rol.rol} (${rol.id}).`);
      setCalError(null);
      pagos.store.refresh();
    } else {
      setCalError(r.error ?? "No se pudo registrar.");
    }
  }

  function modificarCal(e: React.FormEvent) {
    e.preventDefault();
    setModMsg(null);
    setModError(null);
    if (!servicioCal) {
      setModError("La cadena aún está cargando, intenta de nuevo.");
      return;
    }
    const r = servicioCal.modificarCalificacion(
      { calificacionHash: modCalHash, nuevoEstado: modEstado, autorizadoPor: ADMINISTRADOR.id, motivo: modMotivo.trim(), fecha: modFecha },
      rol,
    );
    if (r.ok) {
      setModMsg("Modificación autorizada y registrada en la cadena (con justificación).");
      setModError(null);
      setModMotivo("");
      pagos.store.refresh();
    } else {
      setModError(r.error ?? "No se pudo modificar.");
    }
  }

  const inscCount = snapshot.blocks.filter((b) => Inscripcion.parse(b.data)).length;

  return (
    <main className="flex flex-col gap-4 p-6 max-w-3xl">
      <h1 className="text-2xl font-semibold">Kids Zone — Inscripciones</h1>
      <p className="text-sm text-zinc-600">
        Inscribe estudiantes y gestiona sus calificaciones con roles del diagrama: el <b>docente</b> registra la nota, la <b>coordinación</b> la
        modifica con justificación y el <b>padre de familia</b> solo consulta. Todo queda en la misma cadena que pagos y certificados.
      </p>
      <ChainStatus status={snapshot.loaded ? (snapshot.validation.ok ? "Registros íntegros." : `Se detectó una alteración en el registro ${ (snapshot.validation as { i: number }).i }.`) : "Cargando…"} ok={snapshot.validation.ok} />

      <Suspense fallback={null}>
        <VerificacionEscaneada ruta="/inscripciones" />
      </Suspense>

      <form onSubmit={inscribir} className="flex flex-col gap-3 max-w-md border rounded p-4">
        <h2 className="font-medium">Inscribir estudiante</h2>
        <label className="flex flex-col gap-1 text-sm">
          Estudiante
          <input placeholder="Nombre completo" value={nombre} onChange={(e) => setNombre(e.target.value)} className="border rounded px-2 py-1" required />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Grado
          <select value={grado} onChange={(e) => setGrado(e.target.value)} className="border rounded px-2 py-1">
            {GRADOS.map((g) => (
              <option key={g}>{g}</option>
            ))}
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

      <section className="border rounded p-4 flex flex-col gap-3">
        <div>
          <h2 className="font-medium">Actor del módulo (permisos)</h2>
          <p className="text-xs text-zinc-600">El rol seleccionado define qué acciones permite el servicio central de calificaciones.</p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          Actuar como
          <select value={rol.id} onChange={(e) => setRolId(e.target.value)} className="border rounded px-2 py-1">
            {ACTORES.map((a) => (
              <option key={a.id} value={a.id}>{a.rol} ({a.id})</option>
            ))}
          </select>
          <span className="text-xs text-zinc-600">Permisos: {rol.permisos.join(" · ")}</span>
        </label>

        {rol.id === DOCENTE.id ? (
          <form onSubmit={registrarCal} className="flex flex-col gap-2 border-t pt-3">
            <b>Docente → Calificación (1. Crea)</b>
            <label className="flex flex-col gap-1 text-xs">
              Estudiante
              <select value={calEstudiante} onChange={(e) => setCalEstudiante(e.target.value)} className="border rounded px-2 py-1" required>
                <option value="" disabled>Selecciona un estudiante inscrito</option>
                {estudiantes.map((s) => (
                  <option key={s.nombre} value={s.nombre}>{s.nombre} ({s.grado})</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs">
              Estado
              <select value={calEstado} onChange={(e) => setCalEstado(e.target.value as EstadoCalificacion)} className="border rounded px-2 py-1">
                <option value="Aprobado">Aprobado</option>
                <option value="Refuerzo">Refuerzo</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs">
              Fecha
              <input type="date" value={calFecha} onChange={(e) => setCalFecha(e.target.value)} className="border rounded px-2 py-1" />
            </label>
            <button type="submit" disabled={estudiantes.length === 0} className="border rounded px-3 py-1 w-fit disabled:opacity-40">Registrar calificación</button>
            {estudiantes.length === 0 ? <p className="text-xs text-amber-700">Primero inscribe al estudiante arriba.</p> : null}
            {calMsg ? <p className="text-sm text-green-700">{calMsg}</p> : null}
            {calError ? <p className="text-sm text-red-600">{calError}</p> : null}
          </form>
        ) : null}

        {rol.id === ADMINISTRADOR.id ? (
          <form onSubmit={modificarCal} className="flex flex-col gap-2 border-t pt-3">
            <b>Coordinación → Registro de modificación (2. Autoriza · 3. Actualiza)</b>
            <label className="flex flex-col gap-1 text-xs">
              Calificación a modificar
              <select value={modCalHash} onChange={(e) => { setModCalHash(e.target.value); }} className="border rounded px-2 py-1" required>
                <option value="" disabled>Selecciona una calificación</option>
                {calificaciones.map((c) => (
                  <option key={c.hash} value={c.hash}>{c.calificacion.estudiante} — {c.calificacion.grado} — vigente: {c.estadoActual}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs">
              Nuevo estado
              <select value={modEstado} onChange={(e) => setModEstado(e.target.value as EstadoCalificacion)} className="border rounded px-2 py-1">
                <option value="Aprobado">Aprobado</option>
                <option value="Refuerzo">Refuerzo</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs">
              Fecha
              <input type="date" value={modFecha} onChange={(e) => setModFecha(e.target.value)} className="border rounded px-2 py-1" />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              Justificación (motivo)
              <textarea value={modMotivo} onChange={(e) => setModMotivo(e.target.value)} placeholder="Ej: Corrección de digitación" className="border rounded px-2 py-1" required />
            </label>
            <button type="submit" disabled={calificaciones.length === 0} className="border rounded px-3 py-1 w-fit disabled:opacity-40">Autorizar modificación</button>
            {calificaciones.length === 0 ? <p className="text-xs text-amber-700">No hay calificaciones aún; regístralas como docente primero.</p> : null}
            {modMsg ? <p className="text-sm text-green-700">{modMsg}</p> : null}
            {modError ? <p className="text-sm text-red-600">{modError}</p> : null}
          </form>
        ) : null}

        {rol.id === "padre1" ? (
          <div className="border-t pt-3 text-sm">
            <b>Padre de familia → Consulta (solo lectura)</b>
            <p className="text-xs text-zinc-600 mt-1">
              Como {rol.rol} ({rol.id}) tu permiso es <b>Solo lectura</b>: no puedes registrar ni modificar calificaciones. Revisa la tabla de
              calificaciones vigentes y el detalle de modificación de cada estudiante.
            </p>
          </div>
        ) : null}
      </section>

      <section className="border rounded p-4 text-sm flex flex-col gap-2">
        <h2 className="font-medium">Calificaciones vigentes</h2>
        {calificaciones.length === 0 ? (
          <p className="text-xs text-zinc-600">Aún no hay calificaciones. El docente puede registrar la primera nota.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {calificaciones.map((c) => (
              <li key={c.hash} className="border rounded p-2 flex flex-col gap-1">
                <div className="flex justify-between gap-2">
                  <span><b>{c.calificacion.estudiante}</b> · {c.calificacion.grado}</span>
                  <span className={`font-medium ${c.estadoActual === "Aprobado" ? "text-green-700" : "text-red-700"}`}>{c.estadoActual}</span>
                </div>
                <span className="text-xs text-zinc-600">
                  Registrada por {c.calificacion.registradaPor} · {c.calificacion.fecha} · bloque #{c.index} ·{" "}
                  <span className="font-mono">{c.hash.slice(0, 12)}…</span>
                </span>
                {c.modificaciones.length > 0 ? (
                  <ul className="text-xs text-amber-700 flex flex-col gap-1">
                    {c.modificaciones.map((m, i) => (
                      <li key={i}>
                        Modificación #{i + 1} → {m.nuevoEstado} · autorizada por {m.autorizadoPor} el {m.fecha}: «{m.motivo}»
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="border rounded p-3 text-sm">
        <p>Estudiantes inscritos: <b>{inscCount}</b> — Total de registros en la cadena: <b>{snapshot.blocks.length}</b></p>
        <p className="text-zinc-600">Los pagos y certificados de cada estudiante se validan automáticamente para el cierre de periodo.</p>
      </section>

      {qrHash ? (
        <section className="border rounded p-4 flex flex-col gap-2 max-w-md">
          <h2 className="font-medium">Carné digital (QR)</h2>
          <QRCodeView payload={buildVerificationUrl("/inscripciones", qrHash)} caption="Escanea para verificar la inscripción en la cadena." />
          <p className="text-xs text-zinc-600 font-mono break-all">{buildVerificationUrl("/inscripciones", qrHash)}</p>
        </section>
      ) : null}

      <hr />
      <h2 className="font-medium">Historial de registros</h2>
      <ChainList blocks={snapshot.blocks} annulled={pagos.annulled} onAnnul={pagos.annulPayment} />
    </main>
  );
}