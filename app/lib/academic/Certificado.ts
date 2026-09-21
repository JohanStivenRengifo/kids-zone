/**
 * Certificado Digital — inmutable, generado tras Cierre de Período (flowchart: H → P)
 * Value Object con prefijo CERTIFICADO
 */
import type { ReporteProgreso } from "./ReporteProgreso";

export class Certificado {
  constructor(
    public readonly id_certificado: string,
    public readonly estudianteId: string,
    public readonly estudianteNombre: string,
    public readonly grado: string,
    public readonly periodo: string,
    public readonly hash_verificacion: string,
    public readonly fecha_emision: Date,
  ) {}

  toBlockData(): string {
    return `CERTIFICADO | ${this.estudianteNombre} | ${this.grado} | ${this.periodo} | ${this.hash_verificacion}`;
  }

  static parse(raw: string): Certificado | null {
    if (!raw.startsWith("CERTIFICADO |")) return null;
    const parts = raw.split("|").map((p) => p.trim());
    if (parts.length < 5) return null;
    const [, nombre, grado, periodo, hash] = parts;
    if (!nombre || !hash) return null;
    return new Certificado(`cert-${hash.slice(0, 8)}`, "", nombre, grado, periodo, hash, new Date());
  }

  static desdeReporte(reporte: ReporteProgreso, hash: string): Certificado {
    return new Certificado(
      `cert-${Date.now()}`,
      reporte.estudianteId,
      reporte.estudianteNombre,
      reporte.grado,
      reporte.periodo,
      hash,
      new Date(),
    );
  }
}
