/**
 * Código QR + verificación — compartido por los 3 pasos/rutas de Kids Zone.
 * El QR codifica una URL `${origin}/<ruta>?v=<hash>`; al escanearla, la página
 * busca el bloque por su hash y valida que la cadena esté íntegra.
 */
import type { Blockchain } from "@/lib/kernel/Blockchain";
import { Inscripcion } from "@/lib/inscripciones/Inscripcion";
import { Payment, Reversal } from "@/lib/payments";
import { Calificacion } from "@/lib/academic/Calificacion";
import { RegistroDeModificacion } from "@/lib/academic/RegistroDeModificacion";

export type RutaVerificable = "/inscripciones" | "/pagos" | "/certificados";

/** URL absoluta que se incrusta en el QR (escaneable desde cualquier dispositivo). */
export function buildVerificationUrl(ruta: RutaVerificable, hash: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}${ruta}?v=${encodeURIComponent(hash)}`;
}

export interface RegistroVerificado {
  tipo: "inscripcion" | "pago" | "anulacion" | "diploma" | "calificacion" | "modificacion" | "texto";
  etiqueta: string;
  detalle: string;
}

export interface ResultadoVerificacion {
  ok: boolean;
  detalle: string;
  hash: string;
  bloque: { index: number; fecha: string } | null;
  registro: RegistroVerificado | null;
}

function interpretar(data: string): RegistroVerificado {
  const ins = Inscripcion.parse(data);
  if (ins) {
    return {
      tipo: "inscripcion",
      etiqueta: `Inscripción de ${ins.estudianteNombre}`,
      detalle: `${ins.grado} · ${ins.periodo} · acudiente ${ins.acudienteNombre}`,
    };
  }
  const anulacion = Reversal.parse(data);
  if (anulacion) {
    return {
      tipo: "anulacion",
      etiqueta: `Anulación del pago #${anulacion.originalIndex}`,
      detalle: `${anulacion.payment.estudiante} · ${anulacion.payment.concepto}`,
    };
  }
  const pago = Payment.parse(data);
  if (pago) {
    return {
      tipo: "pago",
      etiqueta: `Pago de ${pago.estudiante}`,
      detalle: `${pago.concepto} · $${pago.valor} · ${pago.mes} · ${pago.metodo}`,
    };
  }
  if (/^DIPLOMA \|/.test(data)) {
    const [, hash, emisor, fecha] = data.split("|").map((p) => p.trim());
    return {
      tipo: "diploma",
      etiqueta: "Diploma emitido",
      detalle: `Hash ${(hash ?? "").slice(0, 12)} · ${emisor ?? "—"} · ${fecha ?? "—"}`,
    };
  }
  const mod = RegistroDeModificacion.parse(data);
  if (mod) {
    return {
      tipo: "modificacion",
      etiqueta: `Modificación de calificación (${mod.estudiante})`,
      detalle: `Estado pasa a ${mod.nuevoEstado} · autorizada por ${mod.autorizadoPor} · justificación: ${mod.motivo}`,
    };
  }
  const cal = Calificacion.parse(data);
  if (cal) {
    return {
      tipo: "calificacion",
      etiqueta: `Calificación de ${cal.estudiante}`,
      detalle: `${cal.grado} · ${cal.estado} · registrada por ${cal.registradaPor} el ${cal.fecha}`,
    };
  }
  return { tipo: "texto", etiqueta: "Registro de la cadena", detalle: data.slice(0, 80) };
}

/** Verifica un código (hash de bloque) contra la cadena integrada. */
export function verificarHash(chain: Blockchain | null, hash: string): ResultadoVerificacion {
  const hashLimpio = hash.trim();
  if (!chain) {
    return { ok: false, detalle: "La cadena aún no está lista.", hash: hashLimpio, bloque: null, registro: null };
  }
  const validacion = chain.isValid();
  if (!validacion.ok) {
    return {
      ok: false,
      detalle: `La cadena no es íntegra: alteración detectada en el registro ${validacion.i}.`,
      hash: hashLimpio,
      bloque: null,
      registro: null,
    };
  }
  const bloque = chain.chain.find((b) => b.hash === hashLimpio);
  if (!bloque) {
    return { ok: false, detalle: `Código ${hashLimpio.slice(0, 12)}… no encontrado en la cadena.`, hash: hashLimpio, bloque: null, registro: null };
  }
  const registro = interpretar(bloque.data);
  return {
    ok: true,
    detalle: `Registro #${bloque.index} verificado (${hashLimpio.slice(0, 12)}…). La cadena está íntegra.`,
    hash: hashLimpio,
    bloque: { index: bloque.index, fecha: bloque.date },
    registro,
  };
}