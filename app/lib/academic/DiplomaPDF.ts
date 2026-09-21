/**
 * Objeto Archivo PDF — diploma_carlos_cali (diagrama: B)
 * 1. Genera el PDF (simulado) y calcula hashUnico
 * Usa HashStrategy del kernel — no duplica SHA256.
 */
import { defaultHashStrategy } from "@/lib/kernel/HashStrategy";

export class DiplomaPDF {
  constructor(
    public readonly estudiante: string,
    public readonly nivel: string,
    public readonly fechaEmision: string,
    public readonly hashUnico: string,
    public readonly contenido: string,
  ) {}

  static generar(estudiante: string, nivel: string, fechaEmision: string): DiplomaPDF {
    const contenido = `Diploma — ${estudiante} — ${nivel} — ${fechaEmision}`;
    const hashUnico = defaultHashStrategy.hash(contenido).slice(0, 12).toUpperCase();
    return new DiplomaPDF(estudiante, nivel, fechaEmision, hashUnico, contenido);
  }

  /** 6. Verifica que el Hash del PDF coincida (diagrama) */
  verificarHash(hashGuardado: string): boolean {
    return this.hashUnico === hashGuardado;
  }
}
