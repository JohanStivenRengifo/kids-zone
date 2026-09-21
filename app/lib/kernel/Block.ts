import { defaultHashStrategy, type HashStrategy } from "./HashStrategy";

export interface SerializedBlock {
  index: number;
  data: string;
  previousHash: string;
  date: string;
  nonce: number;
  hash: string;
}

/** Entity: un bloque de la cadena. La prueba de trabajo vive aquí (mine). */
export class Block {
  constructor(
    public index: number,
    public data: string,
    public previousHash = "",
    public date: string = new Date().toISOString(),
    public nonce = 0,
    public hash: string | null = null,
    private strategy: HashStrategy = defaultHashStrategy,
  ) {
    this.hash = hash ?? this.createHash();
  }

  createHash(strategy: HashStrategy = this.strategy): string {
    return strategy.hash(
      this.index + this.date + this.data + this.previousHash + this.nonce,
    );
  }

  mine(difficulty: string, strategy: HashStrategy = this.strategy): void {
    if (this.hash === null) this.hash = this.createHash(strategy);
    while (!this.hash.startsWith(difficulty)) {
      this.nonce += 1;
      this.hash = this.createHash(strategy);
    }
  }

  static fromJSON(raw: SerializedBlock, strategy: HashStrategy = defaultHashStrategy): Block {
    return new Block(raw.index, raw.data, raw.previousHash, raw.date, raw.nonce, raw.hash, strategy);
  }

  toJSON(): SerializedBlock {
    return {
      index: this.index,
      data: this.data,
      previousHash: this.previousHash,
      date: this.date,
      nonce: this.nonce,
      hash: this.hash ?? "",
    };
  }
}
