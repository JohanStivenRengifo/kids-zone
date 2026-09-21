/**
 * Objeto Verificador — colegio_san_jose (diagrama: D)
 * 5. Consulta la red → 6. Verifica que el Hash del PDF coincida
 */
import type { Blockchain } from "@/lib/kernel/Blockchain";
import { RegistroBlockchain } from "./RegistroBlockchain";
import type { DiplomaPDF } from "./DiplomaPDF";

export class Verificador {
  constructor(
    public readonly nombre: string,
    public resultadoValidacion: string = "pendiente",
  ) {}

  static readonly SAN_JOSE = new Verificador("Colegio Primario San José");

  verificar(diploma: DiplomaPDF, chain: Blockchain): { ok: boolean; detalle: string } {
    const registro = RegistroBlockchain.buscarHash(diploma.hashUnico, chain);
    if (!registro) {
      this.resultadoValidacion = "❌ No encontrado en blockchain";
      return { ok: false, detalle: this.resultadoValidacion };
    }
    const ok = diploma.verificarHash(registro.hashGuardado);
    this.resultadoValidacion = ok ? "✅ Aprobado (Hashes idénticos)" : "❌ Rechazado (hash no coincide)";
    return { ok, detalle: this.resultadoValidacion };
  }
}
