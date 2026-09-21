// cadena independiente por estudiante y módulo, con génesis trazable y persistencia local
import { Blockchain } from './Blockchain';
import {
  LocalStorageChainRepository,
  type ChainRepository,
} from './ChainStorage';
import { DIFFICULTY } from './constants';
import { defaultHashStrategy, type HashStrategy } from './HashStrategy';
export type Modulo = 'pagos' | 'notas' | 'certificados';
export const MODULOS: Modulo[] = ['pagos', 'notas', 'certificados'];
export interface ChainScope {
  modulo: Modulo;
  estudianteId: string;
}
export function slugifyEstudiante(raw: string): string {
  const slug = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return slug || 'sin-nombre';
}

/** Clave de almacenamiento independiente por cadena. */
export function chainKeyFor(scope: ChainScope): string {
  return `kidsChain:${scope.modulo}:${slugifyEstudiante(scope.estudianteId)}`;
}

/** Génesis trazable: ata la cadena a su (módulo, estudiante). */
export function genesisFor(scope: ChainScope): string {
  return `GENESIS | ${scope.modulo.toUpperCase()} | ${slugifyEstudiante(scope.estudianteId)}`;
}

export function isValidGenesis(data: string, scope: ChainScope): boolean {
  return data.trim() === genesisFor(scope);
}

export function repositoryFor(scope: ChainScope): ChainRepository {
  return new LocalStorageChainRepository(chainKeyFor(scope));
}

/**
 * Carga la cadena del alcance o la crea con génesis minado propio.
 * Cada cadena es independiente: fallar en una no afecta a las demás.
 */
export function loadOrCreateScopedChain(
  scope: ChainScope,
  strategy: HashStrategy = defaultHashStrategy
): { chain: Blockchain; repository: ChainRepository } {
  const repository = repositoryFor(scope);
  if (typeof window === 'undefined') {
    return {
      chain: new Blockchain(genesisFor(scope), DIFFICULTY, strategy),
      repository,
    };
  }
  const saved = repository.load();
  if (saved) {
    const chain = Blockchain.fromJSON(saved, strategy);
    return { chain, repository };
  }
  const chain = new Blockchain(genesisFor(scope), DIFFICULTY, strategy);
  repository.save(chain.toJSON());
  return { chain, repository };
}

export interface BlockAudit {
  index: number;
  hash: string;
  previousHash: string;
  ok: boolean;
  error: string | null;
}

/** Trazabilidad bloque por bloque sin romper las demás cadenas. */
export function auditarCadena(
  chain: Blockchain,
  scope: ChainScope
): { ok: boolean; genesisOk: boolean; bloques: BlockAudit[] } {
  const bloques: BlockAudit[] = [];
  const genesisOk =
    chain.chain.length > 0 && isValidGenesis(chain.chain[0].data, scope);
  const validation = chain.isValid();
  const invalidIndex = 'i' in validation ? validation.i : -1;
  for (const b of chain.chain) {
    const recomputed = b.hash === b.createHash();
    const perBlockOk =
      recomputed && (b.index === 0 ? genesisOk : b.index !== invalidIndex);
    bloques.push({
      index: b.index,
      hash: b.hash ?? '',
      previousHash: b.previousHash,
      ok: perBlockOk,
      error: recomputed ? null : `hash no coincide en bloque ${b.index}`,
    });
  }
  return { ok: validation.ok && genesisOk, genesisOk, bloques };
}

export function isValidScoped(chain: Blockchain, scope: ChainScope): boolean {
  return auditarCadena(chain, scope).ok;
}
