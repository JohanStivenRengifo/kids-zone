import { Block, type SerializedBlock } from "./Block";
import { defaultHashStrategy, type HashStrategy } from "./HashStrategy";

export type ChainValidation = { ok: true } | { ok: false; i: number };

export interface SerializedChain {
  dif: string;
  chain: SerializedBlock[];
}

/**
 * Kernel genérico append-only — reutilizable por pagos, académico, certificados.
 * No conoce dominio: solo hash, enlace, altura y dificultad.
 */
export class Blockchain {
  public chain: Block[];
  public dif: string;
  protected strategy: HashStrategy;

  constructor(genesis: string, dif = "00", strategy: HashStrategy = defaultHashStrategy) {
    this.dif = dif;
    this.strategy = strategy;
    const genesisBlock = new Block(0, genesis, "", undefined, 0, null, strategy);
    genesisBlock.mine(this.dif, this.strategy);
    this.chain = [genesisBlock];
  }

  static fromJSON(state: SerializedChain, strategy: HashStrategy = defaultHashStrategy): Blockchain {
    const bc = Object.create(Blockchain.prototype) as Blockchain;
    bc.dif = state.dif;
    bc.strategy = strategy;
    bc.chain = state.chain.map((c) => Block.fromJSON(c, strategy));
    return bc;
  }

  toJSON(): SerializedChain {
    return { dif: this.dif, chain: this.chain.map((b) => b.toJSON()) };
  }

  getLast(): Block {
    return this.chain[this.chain.length - 1];
  }

  findByIndex(index: number): Block | undefined {
    return this.chain.find((b) => b.index === index);
  }

  /** Única escritura: agregar al final. Todo lo demás es lectura. */
  addBlock(data: string): Block {
    const prev = this.getLast();
    const block = new Block(prev.index + 1, data, prev.hash ?? "", undefined, 0, null, this.strategy);
    block.mine(this.dif, this.strategy);
    this.chain.push(block);
    return block;
  }

  isValid(): ChainValidation {
    if (this.chain.length === 0) return { ok: false, i: 0 };
    const genesis = this.chain[0];
    if (genesis.index !== 0 || genesis.previousHash !== "") return { ok: false, i: 0 };
    if (genesis.hash !== genesis.createHash(this.strategy)) return { ok: false, i: 0 };
    if (!genesis.hash?.startsWith(this.dif)) return { ok: false, i: 0 };
    for (let i = 1; i < this.chain.length; i += 1) {
      const block = this.chain[i];
      if (block.index !== i) return { ok: false, i };
      if (block.hash !== block.createHash(this.strategy)) return { ok: false, i };
      if (!block.hash?.startsWith(this.dif)) return { ok: false, i };
      if (block.previousHash !== this.chain[i - 1].hash) return { ok: false, i };
    }
    return { ok: true };
  }
}
