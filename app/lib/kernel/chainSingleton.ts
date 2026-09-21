import { LocalStorageChainRepository } from './ChainStorage';
import { PaymentChainStore } from '../payments/PaymentChainStore';
import { ChainStore } from './ChainStore';
import { STORAGE_KEY, DIFFICULTY } from './constants';
import {
  chainKeyFor,
  genesisFor,
  repositoryFor,
  slugifyEstudiante,
  type ChainScope,
  type Modulo,
} from './scopedChains';
import type { ChainRepository } from './ChainStorage';
import type { Blockchain } from './Blockchain';
import { defaultHashStrategy } from './HashStrategy';
import { loadOrCreateScopedChain } from './scopedChains';
export const chainStore = new PaymentChainStore(
  new LocalStorageChainRepository(STORAGE_KEY)
);
const scopedStores = new Map<string, PaymentChainStore>();
const scopedGenericStores = new Map<string, ChainStore>();
export function obtenerCadena(scope: ChainScope): {
  chain: Blockchain;
  repository: ChainRepository;
} {
  return loadOrCreateScopedChain(scope);
}

export function obtenerStoreGenerico(scope: ChainScope): ChainStore {
  const key = `generic:${scope.modulo}:${slugifyEstudiante(scope.estudianteId)}`;
  const existing = scopedGenericStores.get(key);
  if (existing) return existing;
  const store = new ChainStore(
    repositoryFor(scope),
    defaultHashStrategy,
    genesisFor(scope),
    DIFFICULTY,
    undefined
  );
  scopedGenericStores.set(key, store);
  return store;
}

export function enumerarAlcancesLocales(): ChainScope[] {
  if (typeof window === 'undefined') return [];
  const modulos: Modulo[] = ['pagos', 'notas', 'certificados'];
  const out: ChainScope[] = [];
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key?.startsWith('kidsChain:')) continue;
      const [, modulo, slug] = key.split(':');
      if (!modulo || !slug || !(modulos as string[]).includes(modulo)) continue;
      out.push({ modulo: modulo as Modulo, estudianteId: slug });
    }
  } catch {
    return [];
  }
  return out;
}

export { chainKeyFor };

// almacenamiento
export function obtenerStore(scope: ChainScope): PaymentChainStore {
  const key = `${scope.modulo}:${scope.estudianteId}`;
  const existing = scopedStores.get(key);
  if (existing) return existing;
  const store = new PaymentChainStore(
    repositoryFor(scope),
    defaultHashStrategy,
    genesisFor(scope),
    undefined
  );
  scopedStores.set(key, store);
  return store;
}
