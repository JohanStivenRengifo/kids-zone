/**
 * Diagrama:
 *  Auditoria { id_auditoria, id_pago, resultado, fecha, verificarHash() }
 *  Auditoria "1" --> "1" Bloque : verifica
 */
import type { Blockchain } from "@/lib/kernel/Blockchain";
import type { Bloque } from "./Bloque";

export class Auditoria {
  constructor(
    public readonly id_auditoria: string,
    public readonly id_pago: string,
    public resultado: string,
    public fecha: Date,
    public readonly bloque: Bloque,
    private chain: Blockchain,
  ) {}

  /** Diagrama: verificarHash() */
  verificarHash(): { ok: boolean; bloque: number | null; detalle: string } {
    const v = this.chain.isValid();
    if (v.ok) {
      this.resultado = "íNTEGRA";
      return { ok: true, bloque: null, detalle: "Cadena íntegra (todos los hashes coinciden)." };
    }
    this.resultado = `ALTERADA en bloque ${v.i}`;
    return { ok: false, bloque: v.i, detalle: `Cadena alterada en el bloque ${v.i}.` };
  }

  static auditarBloque(bloque: Bloque, chain: Blockchain): Auditoria {
    const a = new Auditoria(
      `aud-${bloque.id_pago}-${Date.now()}`,
      bloque.id_pago,
      "pendiente",
      new Date(),
      bloque,
      chain,
    );
    a.verificarHash();
    return a;
  }

  static auditarCadena(chain: Blockchain, bloqueRepresentativo: Bloque): Auditoria {
    return Auditoria.auditarBloque(bloqueRepresentativo, chain);
  }
}
