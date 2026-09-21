'use client';

import { Suspense, useEffect, useState } from 'react';
import { ChainList } from '@/components/payments/ChainList';
import { ChainStatus } from '@/components/payments/ChainStatus';
import { PaymentForm } from '@/components/payments/PaymentForm';
import { QRCodeView } from '@/components/qr/QRCodeView';
import { VerificacionEscaneada } from '@/components/qr/VerificacionEscaneada';
import { usePaymentChain } from '@/hooks/usePaymentChain';
import { Payment, type PaymentData } from '@/lib/payments';
import { getEstudiantesInscritos } from '@/lib/inscripciones/registry';
import { listarEstudiantes } from '@/lib/inscripciones/StudentRegistry';
import { buildVerificationUrl } from '@/lib/qr/verificar';

export default function PagosPage() {
  const [seleccionado, setSeleccionado] = useState('');
  const [estudiantes, setEstudiantes] = useState<
    { nombre: string; grado: string; periodo: string }[]
  >([]);
  const {
    blocks,
    annulled,
    validation,
    status,
    loaded,
    error,
    addPaymentDominio,
    annulPayment,
    store,
  } = usePaymentChain(seleccionado || undefined);

  useEffect(() => {
    // Único compartido: lista de estudiantes (registro + legada como migración).
    const map = new Map(
      getEstudiantesInscritos(store.getChain()).map((e) => [e.nombre, e])
    );
    for (const e of listarEstudiantes()) {
      if (!map.has(e.nombre))
        map.set(e.nombre, {
          nombre: e.nombre,
          grado: e.grado,
          periodo: e.periodo,
        });
    }
    setEstudiantes(
      [...map.values()].sort((a, b) => a.nombre.localeCompare(b.nombre))
    );
  }, [store, loaded]);
  // En la cadena aislada del estudiante solo hay génesis + pagos + anulanes.
  const pagosValidos = blocks.filter(
    (b) => b.index !== 0 && Payment.parse(b.data) !== null
  ).length;

  const [qr, setQr] = useState<{ hash: string; detalle: string } | null>(null);

  function handlePago(data: PaymentData): boolean {
    const ok = addPaymentDominio(
      seleccionado ? { ...data, estudiante: seleccionado } : data
    );
    if (ok) {
      const last = store.getChain()?.getLast();
      const pago = last ? Payment.parse(last.data) : null;
      setQr(
        pago && last
          ? {
              hash: last.hash ?? '',
              detalle: `${pago.estudiante} — ${pago.concepto} — $${pago.valor} — ${pago.mes}`,
            }
          : null
      );
    }
    return ok;
  }

  return (
    <main className="flex flex-col gap-4 p-6 max-w-2xl">
      <h1 className="text-2xl font-semibold">Kids Zone - Pagos</h1>
      <p className="text-sm text-slate-600">
        Solo estudiantes inscritos pueden registrar pagos. Cada estudiante tiene
        su propia cadena de pagos: un cambio solo afecta a esa cadena.
      </p>
      <label className="flex flex-col gap-1 text-sm max-w-md">
        Estudiante (su cadena de pagos)
        <select
          value={seleccionado}
          onChange={(e) => {
            setSeleccionado(e.target.value);
            setQr(null);
          }}
          className="border rounded px-2 py-1"
          required
        >
          <option value="">Selecciona estudiante</option>
          {estudiantes.map((e) => (
            <option key={e.nombre} value={e.nombre}>
              {e.nombre} — {e.grado}
            </option>
          ))}
        </select>
      </label>
      <ChainStatus status={loaded ? status : 'Cargando…'} ok={validation.ok} />
      <Suspense fallback={null}>
        <VerificacionEscaneada ruta="/pagos" />
      </Suspense>
      {!seleccionado ? (
        <p className="text-sm text-amber-700 border rounded p-3 bg-amber-50 max-w-md">
          Selecciona un estudiante arriba para ver y registrar los pagos de su
          propia cadena.
        </p>
      ) : (
        <PaymentForm
          onSubmit={handlePago}
          externalError={error}
          estudiantes={estudiantes.filter((e) => e.nombre === seleccionado)}
        />
      )}
      <section className="border rounded p-3 text-sm">
        <p>
          Pagos registrados: <b>{pagosValidos}</b> — Total de registros:{' '}
          <b>{blocks.length}</b>
        </p>
      </section>
      {qr ? (
        <section className="border rounded p-4 flex flex-col gap-2 max-w-md">
          <h2 className="font-medium">Comprobante de pago (QR)</h2>
          <p className="text-sm">{qr.detalle}</p>
          <QRCodeView
            payload={buildVerificationUrl('/pagos', qr.hash)}
            caption="Escanea para verificar el comprobante en la cadena."
          />
          <p className="text-xs text-zinc-600 font-mono break-all">
            {buildVerificationUrl('/pagos', qr.hash)}
          </p>
        </section>
      ) : null}
      <hr />
      <h2 className="font-medium">Historial</h2>
      <ChainList blocks={blocks} annulled={annulled} onAnnul={annulPayment} />
      {!validation.ok ? (
        <p className="text-sm text-red-700">
          Se detectó una alteración en el registro{' '}
          {(validation as { i: number }).i}. La cadena no es íntegra.
        </p>
      ) : null}
    </main>
  );
}
