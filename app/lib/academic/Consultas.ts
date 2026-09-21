/**
 * Consultas — reutilizan la misma cadena integrada (G)
 * Individual (S): perfil, progreso por materia, historial
 * Conjunta (T): informes por grado, estadísticas, controles
 */
import type { Blockchain } from "@/lib/kernel/Blockchain";
import { Payment } from "@/lib/payments";
import { ReporteProgreso } from "./ReporteProgreso";
import { Certificado } from "./Certificado";

export class ConsultaIndividual {
  constructor(private chain: Blockchain) {}

  perfil(estudianteNombre: string): { pagos: number; reportes: number; certificados: number } {
    return {
      pagos: this.chain.chain.filter((b) => Payment.parse(b.data)?.estudiante === estudianteNombre).length,
      reportes: this.chain.chain.filter((b) => ReporteProgreso.parse(b.data)?.estudianteNombre === estudianteNombre).length,
      certificados: this.chain.chain.filter((b) => Certificado.parse(b.data)?.estudianteNombre === estudianteNombre).length,
    };
  }

  progresoPorMateria(estudianteNombre: string): Record<string, number[]> {
    const map: Record<string, number[]> = {};
    for (const b of this.chain.chain) {
      const r = ReporteProgreso.parse(b.data);
      if (r && r.estudianteNombre === estudianteNombre) {
        (map[r.materia] ??= []).push(r.nota);
      }
    }
    return map;
  }

  historial(estudianteNombre: string): string[] {
    return this.chain.chain
      .filter((b) => {
        const p = Payment.parse(b.data);
        const r = ReporteProgreso.parse(b.data);
        const c = Certificado.parse(b.data);
        return p?.estudiante === estudianteNombre || r?.estudianteNombre === estudianteNombre || c?.estudianteNombre === estudianteNombre;
      })
      .map((b) => `${new Date(b.date).toLocaleDateString()} — ${b.data.slice(0, 80)}`);
  }
}

export class ConsultaConjunta {
  constructor(private chain: Blockchain) {}

  informesPorGrado(): Record<string, number> {
    const map: Record<string, number> = {};
    for (const b of this.chain.chain) {
      const r = ReporteProgreso.parse(b.data);
      if (r) map[r.grado] = (map[r.grado] ?? 0) + 1;
    }
    return map;
  }

  estadisticasGlobales(): { totalBloques: number; pagos: number; reportes: number; certificados: number; cadenaValida: boolean } {
    return {
      totalBloques: this.chain.chain.length,
      pagos: this.chain.chain.filter((b) => Payment.parse(b.data)).length,
      reportes: this.chain.chain.filter((b) => ReporteProgreso.parse(b.data)).length,
      certificados: this.chain.chain.filter((b) => Certificado.parse(b.data)).length,
      cadenaValida: this.chain.isValid().ok,
    };
  }
}
