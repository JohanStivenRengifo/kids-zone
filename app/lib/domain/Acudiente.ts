/**
 * Diagrama:
 *  Acudiente "1" --> "1" Estudiante : es_responsable_de
 *  Acudiente "1" --> "*" Pago : realiza
 */
import type { EstadoPago } from './EstadoPago';
import { Pago } from './Pago';
import type { Estudiante } from './Estudiante';

export class Acudiente {
  constructor(
    public readonly id_acudiente: string,
    public nombre: string,
    public wallet_address: string,
    private estudiante: Estudiante
  ) {}

  getEstudiante(): Estudiante {
    return this.estudiante;
  }

  /** Diagrama: consultarObligacion() */
  consultarObligacion(): EstadoPago[] {
    return this.estudiante.getEstadosPendientes();
  }

  // crea un Pago
  realizarPago(args: {
    conceptoId: string;
    monto: number;
    metodo: string;
    periodo: string;
  }): Pago {
    return new Pago({
      id_pago: `pago-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      acudienteId: this.id_acudiente,
      estudiante: this.estudiante,
      conceptoId: args.conceptoId,
      monto: args.monto,
      metodo: args.metodo,
      periodo: args.periodo,
    });
  }
}
