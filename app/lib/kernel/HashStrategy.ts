import SHA256 from "crypto-js/sha256";

/** Strategy: permite cambiar el algoritmo de hash sin tocar Block/Blockchain. */
export interface HashStrategy {
  hash(input: string): string;
}

export class CryptoJsHashStrategy implements HashStrategy {
  hash(input: string): string {
    return SHA256(input).toString();
  }
}

export const defaultHashStrategy = new CryptoJsHashStrategy();
