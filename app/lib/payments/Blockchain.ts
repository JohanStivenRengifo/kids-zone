import { Blockchain as KernelBlockchain } from '../kernel/Blockchain';
import { Reversal } from './Payment';

// Extensión de dominio pagos sobre el kernel genérico

export class Blockchain extends KernelBlockchain {
  getAnnulledIndexes(): Set<number> {
    const annulled = new Set<number>();
    for (const block of this.chain) {
      const reversal = Reversal.parse(block.data);
      if (reversal) annulled.add(reversal.originalIndex);
    }
    return annulled;
  }

  static override fromJSON(
    state: import('../kernel/Blockchain').SerializedChain,
    strategy?: import('../kernel/HashStrategy').HashStrategy
  ): Blockchain {
    const base = KernelBlockchain.fromJSON(state, strategy) as Blockchain;
    Object.setPrototypeOf(base, Blockchain.prototype);
    return base;
  }
}

export type { ChainValidation, SerializedChain } from '../kernel/Blockchain';
