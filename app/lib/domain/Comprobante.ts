/**
 * Diagrama:
 *  Comprobante { id_comprobante, id_pago, hash_verificacion, fecha_emision, generar() }
 *  Bloque "1" --> "1" Comprobante : genera
 *  Comprobante "1" --> "1" Estudiante : actualiza_estado_de
 */
import type { Bloque } from "./Bloque";
import type { Estudiante } from "./Estudiante";

export class Comprobante {
  private constructor(
    public readonly id_comprobante: string,
    public readonly id_pago: string,
    public readonly hash_verificacion: string,
    public readonly fecha_emision: Date,
    public readonly bloque: Bloque,
  ) {}

  /** Diagrama: generar() */
  static generar(bloque: Bloque): Comprobante {
    return new Comprobante(
      `comp-${bloque.id_pago}-${Date.now()}`,
      bloque.id_pago,
      bloque.hash,
      new Date(),
      bloque,
    );
  }

  /** Diagrama: actualiza_estado_de Estudiante */
  aplicarAEstudiante(estudiante: Estudiante): void {
    estudiante.aplicarComprobante(this);
  }
}
