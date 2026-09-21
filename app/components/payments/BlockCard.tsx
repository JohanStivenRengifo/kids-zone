"use client";

import { useState } from "react";
import { Payment, Reversal, type SerializedBlock } from "@/lib/payments";

interface Props {
  block: SerializedBlock;
  annulled: boolean;
  onAnnul: (index: number, motivo: string) => boolean;
}

/**
 * SRP: presenta un bloque de solo lectura y ofrece anulación.
 * Los bloques jamás se editan ni se borran (inmutabilidad):
 * corregir = agregar un bloque de reversión al final.
 * Sin prompt()/confirm() del navegador: todo es estado React.
 */
export function BlockCard({ block, annulled, onAnnul }: Props) {
  const reversal = Reversal.parse(block.data);
  const payment = Payment.parse(block.data);
  const [annulling, setAnnulling] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);

  const canAnnul = block.index > 0 && payment !== null && !annulled;

  function confirmAnnul() {
    const ok = onAnnul(block.index, motivo);
    if (ok) {
      setAnnulling(false);
      setMotivo("");
      setError(null);
    } else {
      setError("No se pudo anular (quizá ya está anulado).");
    }
  }

  return (
    <div className="border rounded p-3">
      <b>Pago #{block.index}</b>{" "}
      {reversal ? (
        <span className="text-sm font-semibold">— Anulación del pago #{reversal.originalIndex}</span>
      ) : annulled ? (
        <span className="text-sm font-semibold text-red-700">— ANULADO</span>
      ) : null}
      <br />
      Fecha: {new Date(block.date).toLocaleString()}
      <br />
      {reversal ? (
        <>
          Pago anulado: #{reversal.originalIndex} — {reversal.payment.estudiante} |{" "}
          {reversal.payment.concepto} | ${reversal.payment.valor} | {reversal.payment.metodo} |{" "}
          {reversal.payment.mes}
          {reversal.motivo ? (
            <>
              <br />
              Motivo: {reversal.motivo}
            </>
          ) : null}
        </>
      ) : payment ? (
        <>
          Estudiante: {payment.estudiante}
          <br />
          Concepto: {payment.concepto}
          <br />
          Valor: ${payment.valor}
          <br />
          Método: {payment.metodo}
          <br />
          Mes: {payment.mes}
        </>
      ) : (
        <>Datos: {block.data}</>
      )}
      <br />
      Hash: <span className="break-all font-mono text-xs">{block.hash}</span>
      <br />
      Hash anterior: <span className="break-all font-mono text-xs">{block.previousHash || "—"}</span>
      {annulling ? (
        <div className="flex flex-col gap-2 mt-2">
          <span className="text-sm">
            Anular el pago #{block.index} agrega un bloque de reversión al final. El original
            queda intacto en la historia.
          </span>
          <label className="flex flex-col gap-1">
            Motivo (opcional):
            <input
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: cobro duplicado"
              autoComplete="off"
              className="border rounded px-2 py-1"
            />
          </label>
          <div className="flex gap-2">
            <button type="button" onClick={confirmAnnul} className="border rounded px-3 py-1">
              Confirmar anulación
            </button>
            <button type="button" onClick={() => setAnnulling(false)} className="border rounded px-3 py-1">
              Cancelar
            </button>
          </div>
        </div>
      ) : canAnnul ? (
        <div className="flex gap-2 mt-2">
          <button type="button" onClick={() => { setError(null); setAnnulling(true); }} className="border rounded px-3 py-1">
            Anular
          </button>
        </div>
      ) : null}
      {error ? <p role="alert" className="text-sm text-red-600 mt-1">{error}</p> : null}
    </div>
  );
}
