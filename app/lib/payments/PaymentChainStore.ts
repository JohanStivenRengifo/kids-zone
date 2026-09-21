import { ChainStore, type ChainSnapshot } from '../kernel/ChainStore';
import type { ChainRepository } from '../kernel/ChainStorage';
import type { HashStrategy } from '../kernel/HashStrategy';
import { defaultHashStrategy } from '../kernel/HashStrategy';
import {
  GENESIS_TEXT,
  DIFFICULTY,
  FIRST_PAYMENT_TEXT,
} from '../kernel/constants';
import { Blockchain } from './Blockchain';
import { Payment, Reversal, type PaymentData } from './Payment';
import type { SerializedBlock } from '../kernel/Block';
import type { ChainValidation } from '../kernel/Blockchain';

export interface PaymentChainSnapshot extends ChainSnapshot {
  annulled: number[];
  blocks: SerializedBlock[];
  validation: ChainValidation;
}

const initialPayment: PaymentChainSnapshot = {
  blocks: [],
  annulled: [],
  validation: { ok: true },
  loaded: false,
  error: null,
};

// Dominio Pagos
export class PaymentChainStore extends ChainStore {
  protected override snapshot: PaymentChainSnapshot = initialPayment;

  constructor(
    repo: ChainRepository,
    strategy: HashStrategy = defaultHashStrategy,
    genesisText: string = GENESIS_TEXT,
    firstBlockText: string | undefined = FIRST_PAYMENT_TEXT
  ) {
    super(repo, strategy, genesisText, DIFFICULTY, firstBlockText);
  }

  override getServerSnapshot = (): PaymentChainSnapshot => initialPayment;
  override getSnapshot = (): PaymentChainSnapshot =>
    this.snapshot as PaymentChainSnapshot;

  protected override sync(error: string | null = null): void {
    if (!this.chain) return;
    const chain = this.chain as Blockchain;
    const annulled = chain.getAnnulledIndexes?.() ?? new Set<number>();
    this.snapshot = {
      blocks: chain.chain.map((b) => b.toJSON()),
      annulled: [...annulled],
      validation: chain.isValid(),
      loaded: true,
      error,
    };
  }

  // Asegura que el chain sea el de pagos (con getAnnulledIndexes).
  // Usa el génesis del alcance cuando el store es por estudiante.
  override ensureLoaded(): void {
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
      if (this.firstBlockText)
        (this.chain as Blockchain).addBlock(this.firstBlockText);
      this.repository.save(this.chain.toJSON());
    }
    this.sync();
    this.emit();
  }

  addPayment(data: PaymentData): boolean {
    const chain = this.chain as Blockchain | null;
    if (!chain) return false;
    const msg = Payment.validate(data);
    if (msg) {
      this.sync(msg);
      this.emit();
      return false;
    }
    const p = new Payment(
      data.estudiante,
      data.concepto,
      data.valor,
      data.metodo,
      data.mes
    );
    chain.addBlock(p.toString());
    this.getRepository().save(chain.toJSON());
    this.sync();
    this.emit();
    return true;
  }

  annulPayment(index: number, motivo: string): boolean {
    const chain = this.chain as Blockchain | null;
    if (!chain || index <= 0) return false;
    const target = chain.findByIndex(index);
    if (!target || Reversal.parse(target.data)) return false;
    const payment = Payment.parse(target.data);
    if (!payment || chain.getAnnulledIndexes().has(index)) return false;
    chain.addBlock(Reversal.toString(index, payment, motivo));
    this.getRepository().save(chain.toJSON());
    this.sync();
    this.emit();
    return true;
  }
}
