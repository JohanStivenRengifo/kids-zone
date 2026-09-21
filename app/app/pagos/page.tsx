"use client";

import { ChainList } from "@/components/payments/ChainList";
import { ChainStatus } from "@/components/payments/ChainStatus";
import { PaymentForm } from "@/components/payments/PaymentForm";
import { usePaymentChain } from "@/hooks/usePaymentChain";
import { getEstudiantesInscritos } from "@/lib/inscripciones/registry";

export default function PagosPage() {
  const { blocks, annulled, validation, status, loaded, error, addPaymentDominio, annulPayment, store } =
    usePaymentChain();

  const estudiantes = getEstudiantesInscritos(store.getChain());
  const pagosValidos = blocks.filter((b) => !b.data.startsWith("ANULACIÓN") && !b.data.startsWith("INSCRIPCION") && !b.data.startsWith("DIPLOMA") && b.index !== 0).length;

  return (
    <main className="flex flex-col gap-4 p-6 max-w-2xl">
      <h1 className="text-2xl font-semibold">Kids Zone - Pagos</h1>
      <p className="text-sm text-slate-600">Solo estudiantes inscritos pueden registrar pagos. Cada pago queda guardado de forma permanente.</p>
      <ChainStatus status={loaded ? status : "Cargando…"} ok={validation.ok} />
      <PaymentForm onSubmit={addPaymentDominio} externalError={error} estudiantes={estudiantes} />
      <section className="border rounded p-3 text-sm">
        <p>Pagos registrados: <b>{pagosValidos}</b> — Total de registros: <b>{blocks.length}</b></p>
      </section>
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
