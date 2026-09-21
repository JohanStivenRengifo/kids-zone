/**
 * Diagrama:
 *  Administracion { id_admin, nombre, consultarHistorial(), auditarPagos() }
 *  Administracion "1" --> "*" Pago : consulta
 *  Administracion "1" --> "*" Auditoria : ejecuta
 *
 * No duplica almacenamiento: consulta el historial derivado de la cadena
 * y delega la verificación a Auditoria (que usa Blockchain.isValid).
 */
import type { Blockchain } from "@/lib/kernel/Blockchain";
import type { Bloque } from "./Bloque";
import { Auditoria } from "./Auditoria";
import { Payment } from "@/lib/payments";

export class Administracion {
  constructor(
    public readonly id_admin: string,
    public nombre: string,
    private chain: Blockchain,
  ) {}

  /** Diagrama: consultarHistorial() — deriva pagos de los bloques (sin array duplicado) */
  consultarHistorial(filtro?: { estudianteNombre?: string; periodo?: string }): { index: number; pago: ReturnType<typeof Payment.parse> }[] {
    return this.chain.chain
      .map((b) => ({ index: b.index, pago: Payment.parse(b.data) }))
      .filter((x): x is { index: number; pago: NonNullable<ReturnType<typeof Payment.parse>> } => x.pago !== null)
      .filter((x) => {
        if (filtro?.estudianteNombre && x.pago.estudiante !== filtro.estudianteNombre) return false;
        if (filtro?.periodo && x.pago.mes !== filtro.periodo) return false;
        return true;
      });
  }

  /** Diagrama: auditarPagos() */
  auditarPagos(bloque: Bloque): Auditoria {
    return Auditoria.auditarBloque(bloque, this.chain);
  }

  getChain(): Blockchain {
    return this.chain;
  }
}
