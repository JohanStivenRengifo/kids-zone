// registra bloque en la cadena
import type { Block } from '@/lib/kernel/Block';
import type { Pago } from './Pago';
import { Comprobante } from './Comprobante';

export class Bloque {
  public readonly hash: string;
  public readonly hash_anterior: string;
  public readonly id_pago: string;
  public monto: number;
  public fecha: Date;
  public estado: string;

  private constructor(
    private raw: Block,
    pago?: Pago
  ) {
    this.hash = raw.hash ?? '';
    this.hash_anterior = raw.previousHash;
    this.id_pago = pago?.id_pago ?? `bloque-${raw.index}`;
    this.monto = pago?.monto ?? 0;
    this.fecha = new Date(raw.date);
    this.estado = pago?.estado ?? 'confirmado';
  }

  static desdeBlock(raw: Block, pago?: Pago): Bloque {
    return new Bloque(raw, pago);
  }

  registrarTransaccion(): Block {
    return this.raw;
  }

  getRaw(): Block {
    return this.raw;
  }

  /** Diagrama: Bloque genera Comprobante */
  generarComprobante(): Comprobante {
    return Comprobante.generar(this);
  }
}
