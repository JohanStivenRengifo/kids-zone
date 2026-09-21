/**
 * Diagrama:
 *  Pago { id_pago, monto, metodo, fecha, estado, confirmarPago() }
 *  Acudiente "1" --> "*" Pago : realiza
 *  Pago "1" --> "1" SmartContract : es_procesado_por
 *
 * Reusa Payment (lib/payments) para validación/serialización — evita duplicar reglas.
 */
import type { Estudiante } from "./Estudiante";
import { Payment as InfraPayment } from "@/lib/payments";

export type EstadoPagoTransaccion = "pendiente" | "confirmado" | "anulado" | "rechazado";

export class Pago {
  public readonly id_pago: string;
  public monto: number;
  public metodo: string;
  public fecha: Date;
  public estado: EstadoPagoTransaccion;
  public readonly acudienteId: string;
  public readonly estudiante: Estudiante;
  public readonly conceptoId: string;
  public periodo: string;

  constructor(args: {
    id_pago: string;
    monto: number;
    metodo: string;
    periodo: string;
    conceptoId: string;
    acudienteId: string;
    estudiante: Estudiante;
    fecha?: Date;
    estado?: EstadoPagoTransaccion;
  }) {
    this.id_pago = args.id_pago;
    this.monto = args.monto;
    this.metodo = args.metodo;
    this.periodo = args.periodo;
    this.conceptoId = args.conceptoId;
    this.acudienteId = args.acudienteId;
    this.estudiante = args.estudiante;
    this.fecha = args.fecha ?? new Date();
    this.estado = args.estado ?? "pendiente";
  }

  /** Diagrama: confirmarPago() */
  confirmarPago(): void {
    if (this.estado !== "pendiente") return;
    this.estado = "confirmado";
    this.fecha = new Date();
  }

  anular(): void {
    this.estado = "anulado";
  }

  /** Valida con la misma regla que la cadena existente */
  validar(): string | null {
    return InfraPayment.validate({
      estudiante: this.estudiante.nombre,
      concepto: this.conceptoId,
      valor: this.monto,
      metodo: this.metodo,
      mes: this.periodo,
    });
  }

  /** Compat con el formato string de la cadena append-only existente */
  toBlockData(): string {
    return new InfraPayment(
      this.estudiante.nombre,
      this.conceptoId,
      this.monto,
      this.metodo,
      this.periodo,
    ).toString();
  }
}
