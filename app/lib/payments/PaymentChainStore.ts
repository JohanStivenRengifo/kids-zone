import { ChainStore, type ChainSnapshot } from "../kernel/ChainStore";
import type { ChainRepository } from "../kernel/ChainStorage";
import type { HashStrategy } from "../kernel/HashStrategy";
import { defaultHashStrategy } from "../kernel/HashStrategy";
import { GENESIS_TEXT, DIFFICULTY, FIRST_PAYMENT_TEXT } from "../kernel/constants";
import { Blockchain } from "./Blockchain";
import { Payment, Reversal, type PaymentData } from "./Payment";
import type { SerializedBlock } from "../kernel/Block";
import type { ChainValidation } from "../kernel/Blockchain";

export interface PaymentChainSnapshot extends ChainSnapshot {
  annulled: number[];
  blocks: SerializedBlock[];
  validation: ChainValidation;
}

const initialPayment: PaymentChainSnapshot = { blocks: [], annulled: [], validation: { ok: true }, loaded: false, error: null };

/**
 * Dominio Pagos — extiende el kernel sin duplicar Block/Blockchain/Repository.
 * La cadena es la misma que usan inscripciones y certificados (STORAGE_KEY único).
 */
export class PaymentChainStore extends ChainStore {
  protected override snapshot: PaymentChainSnapshot = initialPayment;

  constructor(repo: ChainRepository, strategy: HashStrategy = defaultHashStrategy) {
    super(repo, strategy, GENESIS_TEXT, DIFFICULTY, FIRST_PAYMENT_TEXT);
  }

  override getServerSnapshot = (): PaymentChainSnapshot => initialPayment;
  override getSnapshot = (): PaymentChainSnapshot => this.snapshot as PaymentChainSnapshot;

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

  // Asegura que el chain sea el de pagos (con getAnnulledIndexes)
  override ensureLoaded(): void {
    if (typeof window === "undefined" || this.chain) return;
    const saved = this.repository.load();
    if (saved) {
      this.chain = Blockchain.fromJSON(saved, this.strategy);
    } else {
      this.chain = new Blockchain(GENESIS_TEXT, DIFFICULTY, this.strategy);
      (this.chain as Blockchain).addBlock(FIRST_PAYMENT_TEXT);
      this.repository.save(this.chain.toJSON());
    }
    this.sync();
    this.emit();
  }

  addPayment(data: PaymentData): boolean {
    const msg = Payment.validate(data);
    if (msg) { this.sync(msg); this.emit(); return false; }
    const p = new Payment(data.estudiante, data.concepto, data.valor, data.metodo, data.mes);
    return this.append(p.toString());
  }

  annulPayment(index: number, motivo: string): boolean {
    const chain = this.chain as Blockchain | null;
    if (!chain || index <= 0) return false;
    const target = chain.findByIndex(index);
    if (!target || Reversal.parse(target.data)) return false;
    const payment = Payment.parse(target.data);
    if (!payment || chain.getAnnulledIndexes().has(index)) return false;
    chain.addBlock(Reversal.toString(index, payment, motivo));
    this.repository.save(chain.toJSON());
    this.sync();
    this.emit();
    return true;
  }
}
