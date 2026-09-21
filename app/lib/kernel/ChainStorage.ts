import type { SerializedChain } from "./Blockchain";

/** Repository: abstrae dónde se guarda la cadena (localStorage, API, archivo…). */
export interface ChainRepository {
  save(state: SerializedChain): void;
  load(): SerializedChain | null;
}

export class LocalStorageChainRepository implements ChainRepository {
  constructor(private key: string) {}

  save(state: SerializedChain): void {
    try {
      localStorage.setItem(this.key, JSON.stringify(state));
    } catch {
      // almacenamiento lleno o no disponible: la cadena sigue en memoria
    }
  }

  load(): SerializedChain | null {
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as SerializedChain;
      if (!parsed || !Array.isArray(parsed.chain) || parsed.chain.length === 0) return null;
      return parsed;
    } catch {
      return null;
    }
  }
}
