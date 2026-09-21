/**
 * Diagrama:
 *  Acudiente "1" --> "1" Estudiante : es_responsable_de
 *  Estudiante "1" --> "*" EstadoPago : tiene
 *  Comprobante "1" --> "1" Estudiante : actualiza_estado_de
 */
import type { EstadoPago } from "./EstadoPago";
import type { Comprobante } from "./Comprobante";

export class Estudiante {
  constructor(
    public readonly id_estudiante: string,
    public nombre: string,
    public grado: string,
    public estado_cuenta: string = "al día",
    private estados: EstadoPago[] = [],
  ) {}

  setEstados(estados: EstadoPago[]): void {
    this.estados = estados;
  }

  getEstados(): EstadoPago[] {
    return [...this.estados];
  }

  getEstadosPendientes(): EstadoPago[] {
    return this.estados.filter((e) => e.saldo_pendiente > 0);
  }

  /** Diagrama: Comprobante actualiza_estado_de Estudiante */
  aplicarComprobante(comprobante: Comprobante): void {
    const pago = comprobante.bloque.getRaw().data;
    // Si el comprobante coincide con un EstadoPago pendiente, abónalo
    for (const estado of this.estados) {
      if (pago.includes(estado.concepto.tipo) && estado.saldo_pendiente > 0) {
        // monto del pago inferido del bloque (no duplica lógica de parsing)
        estado.abonar(estado.saldo_pendiente);
        break;
      }
    }
    const pendientes = this.getEstadosPendientes();
    this.estado_cuenta = pendientes.length === 0 ? "al día" : `pendiente: ${pendientes.length} obligación(es)`;
  }
}
