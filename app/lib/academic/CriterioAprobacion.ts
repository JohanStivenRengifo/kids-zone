/**
 * Strategy: criterio de aprobación (flowchart: Capa Académica y de Aprobación)
 * Permite cambiar reglas sin tocar ReporteProgreso ni Blockchain.
 */
import type { ReporteProgreso } from "./ReporteProgreso";

export interface CriterioAprobacion {
  evaluar(reporte: ReporteProgreso): "APROBADO" | "REQUIERE_REFUERZO";
}

export class CriterioKidsZone implements CriterioAprobacion {
  constructor(private notaMinima = 3.0) {}

  evaluar(reporte: ReporteProgreso): "APROBADO" | "REQUIERE_REFUERZO" {
    return reporte.nota >= this.notaMinima ? "APROBADO" : "REQUIERE_REFUERZO";
  }
}
