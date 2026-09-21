/**
 * Verificación Automática de Estado (M) — Hito Clave del flowchart
 * a) Pagos al día?  b) Aprobación académica completa?
 * Chain-of-Responsibility ligero: cada regla es independiente.
 */
import type { Blockchain } from "@/lib/kernel/Blockchain";
import { Payment, Reversal } from "@/lib/payments";
import { ReporteProgreso } from "./ReporteProgreso";
import { CriterioKidsZone } from "./CriterioAprobacion";

export interface EstadoVerificacion {
  pagosAlDia: boolean;
  aprobacionCompleta: boolean;
  puedeCertificar: boolean;
  detalle: string;
}

export class VerificacionEstado {
  constructor(
    private chain: Blockchain,
    private criterio = new CriterioKidsZone(),
  ) {}

  private pagosPendientes(estudianteNombre: string): boolean {
    // Vigentes no anulados del estudiante → al día
    const anulados = new Set<number>();
    for (const b of this.chain.chain) {
      const r = Reversal.parse(b.data);
      if (r) anulados.add(r.originalIndex);
    }
    const vigentes = this.chain.chain.filter((b, i) => {
      const p = Payment.parse(b.data);
      return p !== null && p.estudiante === estudianteNombre && !anulados.has(i);
    });
    return vigentes.length > 0;
  }

  private aprobacionCompleta(estudianteNombre: string, periodo: string): boolean {
    const reportes = this.chain.chain
      .map((b) => ReporteProgreso.parse(b.data))
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .filter((r) => r.estudianteNombre === estudianteNombre && r.periodo === periodo);
    if (reportes.length === 0) return false;
    return reportes.every((r) => this.criterio.evaluar(r) === "APROBADO");
  }

  verificar(estudianteNombre: string, periodo: string): EstadoVerificacion {
    const pagosAlDia = this.pagosPendientes(estudianteNombre);
    const aprobacionCompleta = this.aprobacionCompleta(estudianteNombre, periodo);
    const puedeCertificar = pagosAlDia && aprobacionCompleta;
    return {
      pagosAlDia,
      aprobacionCompleta,
      puedeCertificar,
      detalle: puedeCertificar
        ? "Cierre de Período, Aprobación y Certificación (N)"
        : !pagosAlDia
          ? "PAGOS PENDIENTES (O) → requiere refuerzo"
          : "REQUIERE REFUERZO académico",
    };
  }
}
