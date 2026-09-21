"use client";

import { Suspense, useState } from "react";
import { ChainStatus } from "@/components/payments/ChainStatus";
import { ChainList } from "@/components/payments/ChainList";
import { QRCodeView } from "@/components/qr/QRCodeView";
import { VerificacionEscaneada } from "@/components/qr/VerificacionEscaneada";
import { useCadenaIntegrada } from "@/hooks/useCadenaIntegrada";
import { usePaymentChain } from "@/hooks/usePaymentChain";
import { DiplomaPDF } from "@/lib/academic/DiplomaPDF";
import { RegistroBlockchain } from "@/lib/academic/RegistroBlockchain";
import { AplicacionPadres } from "@/lib/academic/AplicacionPadres";
import { Verificador } from "@/lib/academic/Verificador";
import { Emisor } from "@/lib/academic/Emisor";
import { getEstudiantesInscritos } from "@/lib/inscripciones/registry";
import { buildVerificationUrl } from "@/lib/qr/verificar";

export default function CertificadosPage() {
  const { snapshot } = useCadenaIntegrada();
  const pagos = usePaymentChain();
  const { store } = useCadenaIntegrada();

  const estudiantes = getEstudiantesInscritos(store.getChain());
  const [estudiante, setEstudiante] = useState("");
  const [nivel, setNivel] = useState("Transición");
  const [fecha, setFecha] = useState("31-Ago-2026");
  const [diploma, setDiploma] = useState<DiplomaPDF | null>(null);
  const [registro, setRegistro] = useState<RegistroBlockchain | null>(null);
  const [app, setApp] = useState<AplicacionPadres | null>(null);
  const [verif, setVerif] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  function generar() {
    setError(null);
    const chain = store.getChain();
    const repo = store.getRepository();
    if (!chain) {
      setError("La cadena aún está cargando.");
      return;
    }
    if (!estudiante) {
      setError("Selecciona un estudiante inscrito.");
      return;
    }
    if (!nivel.trim()) {
      setError("Completa el nivel.");
      return;
    }
    const sel = estudiantes.find((e) => e.nombre === estudiante);
    const nivelFinal = sel?.grado ?? nivel.trim();
    const pdf = DiplomaPDF.generar(estudiante, nivelFinal, fecha.trim());
    const reg = RegistroBlockchain.guardar(pdf.hashUnico, chain, repo, Emisor.CARRUSEL, fecha.trim());
    const url = buildVerificationUrl("/certificados", chain.getLast().hash ?? "");
    const aplic = AplicacionPadres.enviarFamilia(pdf, reg, "Familia Cali", url);
    setDiploma(pdf);
    setRegistro(reg);
    setApp(aplic);
    setQrUrl(url);
    setVerif(null);
    store.refresh();
  }

  function verificar() {
    const chain = store.getChain();
    if (!chain || !diploma) return;
    const v = new Verificador(Verificador.SAN_JOSE.nombre);
    const r = v.verificar(diploma, chain);
    setVerif(r.detalle);
  }

  return (
    <main className="flex flex-col gap-4 p-6 max-w-3xl">
      <h1 className="text-2xl font-semibold">Kids Zone — Certificados</h1>
      <p className="text-sm text-slate-600">Solo estudiantes inscritos pueden recibir diplomas. El código queda guardado en la cadena.</p>
      <ChainStatus status={snapshot.loaded ? (snapshot.validation.ok ? "Registros íntegros." : `Se detectó una alteración en el registro ${(snapshot.validation as { i: number }).i}.`) : "Cargando…"} ok={snapshot.validation.ok} />

      <Suspense fallback={null}>
        <VerificacionEscaneada ruta="/certificados" />
      </Suspense>

      <section className="border rounded p-4 flex flex-col gap-3 max-w-md">
        <h2 className="font-medium">Generar diploma</h2>
        {estudiantes.length === 0 ? (
          <p className="text-sm text-amber-700 border rounded p-3 bg-amber-50">Aún no hay estudiantes inscritos. Ve a <a href="/inscripciones" className="underline">Inscripciones</a>.</p>
        ) : (
          <>
            <label className="flex flex-col gap-1 text-sm">
              Estudiante
              <select value={estudiante} onChange={(e) => { setEstudiante(e.target.value); const sel = estudiantes.find((x) => x.nombre === e.target.value); if (sel) setNivel(sel.grado); }} className="border rounded px-2 py-1" required>
                <option value="">Selecciona estudiante</option>
                {estudiantes.map((e) => (
                  <option key={e.nombre} value={e.nombre}>{e.nombre} — {e.grado}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Nivel
              <input value={nivel} onChange={(e) => setNivel(e.target.value)} placeholder="Transición" className="border rounded px-2 py-1" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Fecha de emisión
              <input value={fecha} onChange={(e) => setFecha(e.target.value)} placeholder="31-Ago-2026" className="border rounded px-2 py-1" />
            </label>
            <button type="button" onClick={generar} className="border rounded px-4 py-2 w-fit bg-black text-white hover:bg-zinc-800">Generar diploma</button>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {diploma ? <p className="text-sm">Diploma de <b>{diploma.estudiante}</b> — Nivel {diploma.nivel} — Código: <span className="font-mono">{diploma.hashUnico}</span></p> : null}
            {registro ? <p className="text-sm">Guardado con código <span className="font-mono">{registro.idTransaccion}</span> — firmado por {registro.firmadoPor}</p> : null}
            {app ? <p className="text-sm">Enviado a {app.usuario} como {app.documentoAdjunto} — QR: <span className="font-mono text-xs">{app.codigoQR}</span></p> : null}
            {qrUrl ? <QRCodeView payload={qrUrl} caption="Código QR del diploma — escanea para verificar." /> : null}
          </>
        )}
      </section>

      <section className="border rounded p-4 flex flex-col gap-3 max-w-md">
        <h2 className="font-medium">Verificar diploma</h2>
        <p className="text-sm text-zinc-600">El colegio verifica que el código del diploma coincida con el guardado en la cadena.</p>
        <button type="button" onClick={verificar} disabled={!diploma} className="border rounded px-4 py-2 w-fit disabled:opacity-50">Verificar en Colegio San José</button>
        {verif ? <p className="text-sm">{verif}</p> : null}
      </section>

      <hr />
      <h2 className="font-medium">Historial de registros</h2>
      <ChainList blocks={snapshot.blocks} annulled={pagos.annulled} onAnnul={pagos.annulPayment} />
    </main>
  );
}
