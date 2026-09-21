/**
 * Objeto Contrato Inteligente — registro_blockchain_Tx884 (diagrama: E)
 * 2. Guarda solo el Hash — 5. Consulta la red
 * Reutiliza Blockchain/Repository del kernel (no duplica chain).
 */
import type { Blockchain } from "@/lib/kernel/Blockchain";
import type { ChainRepository } from "@/lib/kernel/ChainStorage";
import { Emisor } from "./Emisor";

export class RegistroBlockchain {
  constructor(
    public readonly idTransaccion: string,
    public readonly hashGuardado: string,
    public readonly fechaRegistro: string,
    public readonly firmadoPor: string,
  ) {}

  static guardar(
    hashUnico: string,
    chain: Blockchain,
    repo: ChainRepository,
    emisor: Emisor = Emisor.CARRUSEL,
    fechaRegistro = new Date().toISOString().slice(0, 10),
  ): RegistroBlockchain {
    const idTransaccion = `Tx-${Date.now().toString().slice(-6)}-${hashUnico.slice(0, 3)}`;
    const data = `DIPLOMA | ${hashUnico} | ${emisor.billeteraDigital} | ${fechaRegistro}`;
    chain.addBlock(data);
    repo.save(chain.toJSON());
    return new RegistroBlockchain(idTransaccion, hashUnico, fechaRegistro, `${emisor.billeteraDigital} (${emisor.nombre})`);
  }

  static buscarHash(hash: string, chain: Blockchain): RegistroBlockchain | null {
    for (const b of chain.chain) {
      if (b.data.includes(`DIPLOMA | ${hash}`)) {
        const parts = b.data.split("|").map((p) => p.trim());
        return new RegistroBlockchain(`Tx-${b.index}`, hash, new Date(b.date).toISOString().slice(0, 10), parts[2] ?? "");
      }
    }
    return null;
  }
}
