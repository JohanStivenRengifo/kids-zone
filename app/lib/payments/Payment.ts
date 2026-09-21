import type { Concepto, Mes, Metodo } from "./constants";

export const REVERSAL_PREFIX = "ANULACIÓN";

export interface PaymentData {
  estudiante: string;
  concepto: string;
  valor: number;
  metodo: string;
  mes: string;
}

/**
 * Value Object: representa un pago y el formato string heredado
 * "Estudiante | Concepto | $valor | Metodo | Mes".
 * Se mantiene el string como dato del bloque para no romper
 * la cadena guardada en localStorage (compat con bases/pagos.html).
 */
export class Payment {
  constructor(
    public readonly estudiante: string,
    public readonly concepto: string,
    public readonly valor: number,
    public readonly metodo: string,
    public readonly mes: string,
  ) {}

  static validate(data: PaymentData): string | null {
    if (!data.estudiante.trim()) return "Debe ingresar el nombre del estudiante.";
    if (!Number.isFinite(data.valor) || data.valor <= 0)
      return "Debe ingresar un valor válido mayor a 0.";
    if (!data.concepto) return "Debe elegir un concepto.";
    if (!data.metodo) return "Debe elegir un método de pago.";
    if (!data.mes) return "Debe elegir el mes.";
    return null;
  }

  toString(): string {
    return `${this.estudiante.trim()} | ${this.concepto} | $${this.valor} | ${this.metodo} | ${this.mes}`;
  }

  /** Intenta parsear un pago; null si es reversión o texto libre (génesis, etc). */
  static parse(raw: string): Payment | null {
    if (raw.startsWith(REVERSAL_PREFIX)) return null;
    const parts = raw.split("|").map((p) => p.trim());
    if (parts.length < 5) return null;
    const [estudiante, concepto, valorRaw, metodo, mes] = parts;
    const valor = Number(valorRaw.replace(/^\$/, ""));
    if (!estudiante || !Number.isFinite(valor)) return null;
    return new Payment(estudiante, concepto, valor, metodo, mes);
  }
}

export interface ParsedReversal {
  originalIndex: number;
  payment: Payment;
  motivo: string;
}

/**
 * Value Object: contra-asiento append-only.
 * Formato: "ANULACIÓN #i | Estudiante | Concepto | $valor | Metodo | Mes [| motivo]".
 * Anular NO toca el bloque original: agrega historia, como en contabilidad.
 */
export class Reversal {
  static toString(originalIndex: number, payment: Payment, motivo: string): string {
    const base = `${REVERSAL_PREFIX} #${originalIndex} | ${payment.toString()}`;
    const reason = motivo.trim();
    return reason ? `${base} | ${reason}` : base;
  }

  static parse(raw: string): ParsedReversal | null {
    const match = raw.match(new RegExp(`^${REVERSAL_PREFIX} #(\\d+) \\| (.*)$`));
    if (!match) return null;
    const originalIndex = Number(match[1]);
    const rest = match[2].split("|").map((p) => p.trim());
    if (rest.length < 5) return null;
    const [estudiante, concepto, valorRaw, metodo, mes, ...motivoParts] = rest;
    const valor = Number(valorRaw.replace(/^\$/, ""));
    if (!estudiante || !Number.isFinite(valor)) return null;
    return {
      originalIndex,
      payment: new Payment(estudiante, concepto, valor, metodo, mes),
      motivo: motivoParts.join(" | "),
    };
  }
}

export type { Concepto, Mes, Metodo };
