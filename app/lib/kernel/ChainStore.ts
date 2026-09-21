import { Blockchain, type ChainValidation } from './Blockchain';
import type { ChainRepository } from './ChainStorage';
import { defaultHashStrategy, type HashStrategy } from './HashStrategy';
import type { SerializedBlock } from './Block';

export interface ChainSnapshot {
  blocks: SerializedBlock[];
  validation: ChainValidation;
  loaded: boolean;
  error: string | null;
}

const initial: ChainSnapshot = {
  blocks: [],
  validation: { ok: true },
  loaded: false,
  error: null,
};

/**
 * Kernel Store genérico — única fuente de verdad para los 3 módulos.
 * No conoce pagos/académico: solo Blockchain + Repository (patrón Observer + Facade).
 * Los dominios extienden o usan este store sin duplicar Block/Blockchain.
 */
export class ChainStore {
  protected chain: Blockchain | null = null;
  protected snapshot: ChainSnapshot = initial;
  protected listeners = new Set<() => void>();

  constructor(
    protected repository: ChainRepository,
    protected strategy: HashStrategy = defaultHashStrategy,
    protected genesisText: string,
    protected difficulty: string,
    protected firstBlockText?: string
  ) {}

  getServerSnapshot = (): ChainSnapshot => initial;
  getSnapshot = (): ChainSnapshot => this.snapshot;
  subscribe = (l: () => void) => {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  };
  protected emit(): void {
    this.listeners.forEach((l) => l());
  }
  protected sync(error: string | null = null): void {
    if (!this.chain) return;
    this.snapshot = {
      blocks: this.chain.chain.map((b) => b.toJSON()),
      validation: this.chain.isValid(),
      loaded: true,
      error,
    };
  }
  ensureLoaded(): void {
    if (typeof window === 'undefined' || this.chain) return;
    const saved = this.repository.load();
    if (saved) {
      this.chain = Blockchain.fromJSON(saved, this.strategy);
    } else {
      this.chain = new Blockchain(
        this.genesisText,
        this.difficulty,
        this.strategy
      );
      if (this.firstBlockText) this.chain.addBlock(this.firstBlockText);
      this.repository.save(this.chain.toJSON());
    }
    this.sync();
    this.emit();
  }
  getChain(): Blockchain | null {
    return this.chain;
  }
  getRepository(): ChainRepository {
    return this.repository;
  }
  refresh(): void {
    if (!this.chain) return;
    this.sync();
    this.emit();
  }
  setError(msg: string): void {
    if (!this.chain) return;
    this.sync(msg);
    this.emit();
  }
  append(data: string): boolean {
    if (!this.chain) return false;
    this.chain.addBlock(data);
    this.repository.save(this.chain.toJSON());
    this.sync();
    this.emit();
    return true;
  }
}
