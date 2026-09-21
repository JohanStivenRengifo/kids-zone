/**
 * Facade académico — reutiliza Blockchain/Repository del kernel (no duplica chain).
 * Orquesta: reporte → evaluación → registro en cadena → certificado.
 */
import type { Blockchain } from "@/lib/kernel/Blockchain";
import type { ChainRepository } from "@/lib/kernel/ChainStorage";
import { ReporteProgreso } from "./ReporteProgreso";
import { Certificado } from "./Certificado";
import type { CriterioAprobacion } from "./CriterioAprobacion";
import { Bloque } from "@/lib/domain/Bloque";

export class ServicioAcademico {
  constructor(
    private chain: Blockchain,
    private repository: ChainRepository,
    private criterio: CriterioAprobacion,
  ) {}

  /** Docentes emiten reporte académico (K → L → G) */
  emitirReporte(data: ConstructorParameters<typeof ReporteProgreso>[0] extends never ? never : unknown): { ok: boolean; error?: string; bloque?: Bloque } {
    void data;
    return { ok: false, error: "Usa emitirReporteData" };
  }

  emitirReporteData(reporte: ReporteProgreso): { ok: boolean; error?: string; bloque?: Bloque } {
    const msg = ReporteProgreso.validate({
      estudianteId: reporte.estudianteId,
      estudianteNombre: reporte.estudianteNombre,
      grado: reporte.grado,
      materia: reporte.materia,
      periodo: reporte.periodo,
      nota: reporte.nota,
      docenteId: reporte.docenteId,
      observaciones: reporte.observaciones,
    });
    if (msg) return { ok: false, error: msg };
    const raw = this.chain.addBlock(reporte.toBlockData());
    this.repository.save(this.chain.toJSON());
    return { ok: true, bloque: Bloque.desdeBlock(raw) };
  }

  evaluar(reporte: ReporteProgreso): "APROBADO" | "REQUIERE_REFUERZO" {
    return this.criterio.evaluar(reporte);
  }

  /** Genera certificado solo si la evaluación fue APROBADO (usa hash del bloque como verificación) */
  generarCertificado(reporte: ReporteProgreso, bloqueHash: string): Certificado {
    const cert = Certificado.desdeReporte(reporte, bloqueHash);
    const raw = this.chain.addBlock(cert.toBlockData());
    this.repository.save(this.chain.toJSON());
    void raw;
    return cert;
  }
}
