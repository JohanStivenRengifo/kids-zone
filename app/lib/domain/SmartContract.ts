/**
 * Diagrama:
 *  SmartContract { id_contrato, direccion, version, recibirTransaccion(), validarTransaccion(), actualizarEstado() }
 *  Pago "1" --> "1" SmartContract : es_procesado_por
 *  SmartContract "1" --> "*" Bloque : registra
 *
 * Envuelve Blockchain+Repository existentes — no reinventa hash/minado/persistencia.
 */
import type { Pago } from "./Pago";
import { Bloque } from "./Bloque";
import type { Blockchain } from "@/lib/kernel/Blockchain";
import type { ChainRepository } from "@/lib/kernel/ChainStorage";

export class SmartContract {
  constructor(
    public readonly id_contrato: string,
    public readonly direccion: string,
    public readonly version: string,
    private chain: Blockchain,
    private repository: ChainRepository,
  ) {}

  /** Diagrama: recibirTransaccion() */
  recibirTransaccion(pago: Pago): { ok: boolean; error?: string } {
    const validation = this.validarTransaccion(pago);
    if (!validation.ok) return validation;
    this.actualizarEstado(pago);
    return { ok: true };
  }

  /** Diagrama: validarTransaccion() — delega a Pago.validar() (regla única) */
  validarTransaccion(pago: Pago): { ok: boolean; error?: string } {
    if (pago.estado !== "pendiente") return { ok: false, error: "El pago ya fue procesado." };
    const msg = pago.validar();
    if (msg) return { ok: false, error: msg };
    return { ok: true };
  }

  /** Diagrama: actualizarEstado() — confirma el pago y registra el bloque */
  actualizarEstado(pago: Pago): Bloque {
    pago.confirmarPago();
    return this.registrar(pago);
  }

  /** Diagrama: SmartContract registra Bloque */
  private registrar(pago: Pago): Bloque {
    const raw = this.chain.addBlock(pago.toBlockData());
    this.repository.save(this.chain.toJSON());
    return Bloque.desdeBlock(raw, pago);
  }

  getChain(): Blockchain {
    return this.chain;
  }
}
