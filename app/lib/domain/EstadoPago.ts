/**
 * Diagrama:
 *  EstadoPago { id_estado, estudiante_id, saldo_pendiente, fecha_generacion }
 *  Estudiante "1" --> "*" EstadoPago : tiene
 *  EstadoPago "1" --> "1" ConceptoPago : corresponde_a
 */
import type { ConceptoPago } from "./ConceptoPago";

export class EstadoPago {
  constructor(
    public readonly id_estado: string,
    public readonly estudiante_id: string,
    public saldo_pendiente: number,
    public fecha_generacion: Date,
    public concepto: ConceptoPago,
  ) {}

  correspondeA(): ConceptoPago {
    return this.concepto;
  }

  abonar(monto: number): void {
    this.saldo_pendiente = Math.max(0, this.saldo_pendiente - monto);
  }
}
