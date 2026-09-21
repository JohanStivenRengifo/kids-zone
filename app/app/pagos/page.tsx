"use client";

import { Suspense, useState } from "react";
import { ChainList } from "@/components/payments/ChainList";
import { ChainStatus } from "@/components/payments/ChainStatus";
import { PaymentForm } from "@/components/payments/PaymentForm";
import { QRCodeView } from "@/components/qr/QRCodeView";
import { VerificacionEscaneada } from "@/components/qr/VerificacionEscaneada";
import { usePaymentChain } from "@/hooks/usePaymentChain";
import { Payment, type PaymentData } from "@/lib/payments";
import { getEstudiantesInscritos } from "@/lib/inscripciones/registry";
import { buildVerificationUrl } from "@/lib/qr/verificar";

export default function PagosPage() {
  const { blocks, annulled, validation, status, loaded, error, addPaymentDominio, annulPayment, store } =
    usePaymentChain();

  const estudiantes = getEstudiantesInscritos(store.getChain());
  const pagosValidos = blocks.filter((b) => !b.data.startsWith("ANULACIÓN") && !b.data.startsWith("INSCRIPCION") && !b.data.startsWith("DIPLOMA") && b.index !== 0).length;

  const [qr, setQr] = useState<{ hash: string; detalle: string } | null>(null);

  function handlePago(data: PaymentData): boolean {
    const ok = addPaymentDominio(data);
    if (ok) {
      const last = store.getChain()?.getLast();
      const pago = last ? Payment.parse(last.data) : null;
      setQr(pago && last ? { hash: last.hash ?? "", detalle: `${pago.estudiante} — ${pago.concepto} — $${pago.valor} — ${pago.mes}` } : null);
    }
    return ok;
  }

  return (
    <main className="flex flex-col gap-4 p-6 max-w-2xl">
      <h1 className="text-2xl font-semibold">Kids Zone - Pagos</h1>
      <p className="text-sm text-slate-600">Solo estudiantes inscritos pueden registrar pagos. Cada pago queda guardado de forma permanente.</p>
      <ChainStatus status={loaded ? status : "Cargando…"} ok={validation.ok} />
      <Suspense fallback={null}>
        <VerificacionEscaneada ruta="/pagos" />
      </Suspense>
      <PaymentForm onSubmit={handlePago} externalError={error} estudiantes={estudiantes} />
      <section className="border rounded p-3 text-sm">
        <p>Pagos registrados: <b>{pagosValidos}</b> — Total de registros: <b>{blocks.length}</b></p>
      </section>
      {qr ? (
        <section className="border rounded p-4 flex flex-col gap-2 max-w-md">
          <h2 className="font-medium">Comprobante de pago (QR)</h2>
          <p className="text-sm">{qr.detalle}</p>
          <QRCodeView payload={buildVerificationUrl("/pagos", qr.hash)} caption="Escanea para verificar el comprobante en la cadena." />
          <p className="text-xs text-zinc-600 font-mono break-all">{buildVerificationUrl("/pagos", qr.hash)}</p>
        </section>
      ) : null}
      <hr />
      <h2 className="font-medium">Historial</h2>
      <ChainList blocks={blocks} annulled={annulled} onAnnul={annulPayment} />
      {!validation.ok ? (
        <p className="text-sm text-red-700">
          Se detectó una alteración en el registro {(validation as { i: number }).i}. La cadena no es íntegra.
        </p>
      ) : null}
    </main>
  );
}
