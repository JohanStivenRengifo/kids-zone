'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  verificarHashGlobal,
  type ResultadoVerificacion,
  type RutaVerificable,
} from '@/lib/qr/verificar';

/**
 * Verificación automática al escanear un QR: lee `?v=<hash>` de la URL,
 * busca el bloque en la cadena legada o en las cadenas por
 * (estudiante, módulo) y muestra el resultado.
 * Debe usarse dentro de un <Suspense> (usa useSearchParams).
 */
export function VerificacionEscaneada({ ruta }: { ruta: RutaVerificable }) {
  const params = useSearchParams();
  const hash = params.get('v');

  const res: ResultadoVerificacion | null = useMemo(() => {
    if (!hash) return null;
    return verificarHashGlobal(hash);
  }, [hash]);

  if (!hash) return null;

  if (!res) {
    return (
      <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Verificando código{' '}
        <span className="font-mono">{hash.slice(0, 12)}…</span> en las cadenas
        del dispositivo…
      </section>
    );
  }

  return (
    <section
      className={`rounded-xl border p-4 ${res.ok ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}
    >
      <h2 className="font-medium">
        {res.ok ? '✅ Verificación exitosa' : '❌ Verificación rechazada'}
      </h2>
      <p className="text-sm">{res.detalle}</p>
      {res.alcance ? (
        <p className="mt-1 text-xs text-zinc-600">
          Cadena: <b>{res.alcance}</b>
        </p>
      ) : null}
      {res.registro ? (
        <p className="mt-1 text-sm">
          <b>{res.registro.etiqueta}</b> — {res.registro.detalle}
        </p>
      ) : null}
      {res.bloque ? (
        <p className="mt-1 text-xs text-zinc-600">
          Bloque #{res.bloque.index} ·{' '}
          {new Date(res.bloque.fecha).toLocaleString()}
        </p>
      ) : null}
      <a href={ruta} className="mt-2 inline-block text-sm underline">
        Verificar otro código
      </a>
    </section>
  );
}
