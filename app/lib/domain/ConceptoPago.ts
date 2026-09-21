/**
 * Diagrama:
 *  ConceptoPago { id_concepto, tipo, monto, periodo }
 *  EstadoPago "1" --> "1" ConceptoPago : corresponde_a
 */
export class ConceptoPago {
  constructor(
    public readonly id_concepto: string,
    public tipo: string,
    public monto: number,
    public periodo: string,
  ) {}
}
