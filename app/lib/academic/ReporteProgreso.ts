/**
 * ReporteProgreso — creado por Docentes/Padres (flowchart: Reportes de Progreso)
 * Value Object inmutable con serialización a bloque (prefijo REPORTE)
 */
export type EstadoReporte = "pendiente" | "aprobado" | "refuerzo";

export interface ReporteData {
  estudianteId: string;
  estudianteNombre: string;
  grado: string;
  materia: string;
  periodo: string;
  nota: number;
  observaciones?: string;
  docenteId: string;
}

export class ReporteProgreso {
  constructor(
    public readonly estudianteId: string,
    public readonly estudianteNombre: string,
    public readonly grado: string,
    public readonly materia: string,
    public readonly periodo: string,
    public readonly nota: number,
    public readonly docenteId: string,
    public readonly observaciones: string = "",
    public readonly estado: EstadoReporte = "pendiente",
  ) {}

  static validate(data: ReporteData): string | null {
    if (!data.estudianteNombre.trim()) return "Estudiante requerido.";
    if (!data.materia.trim()) return "Materia requerida.";
    if (!data.periodo.trim()) return "Periodo requerido.";
    if (!Number.isFinite(data.nota) || data.nota < 0 || data.nota > 5) return "Nota debe estar entre 0 y 5.";
    if (!data.docenteId) return "Docente requerido.";
    return null;
  }

  toBlockData(): string {
    const base = `REPORTE | ${this.estudianteNombre} | ${this.grado} | ${this.materia} | ${this.periodo} | ${this.nota} | ${this.docenteId}`;
    return this.observaciones ? `${base} | ${this.observaciones}` : base;
  }

  static parse(raw: string): ReporteProgreso | null {
    if (!raw.startsWith("REPORTE |")) return null;
    const parts = raw.split("|").map((p) => p.trim());
    // REPORTE | nombre | grado | materia | periodo | nota | docenteId | [obs]
    if (parts.length < 7) return null;
    const [, nombre, grado, materia, periodo, notaRaw, docenteId, ...obs] = parts;
    const nota = Number(notaRaw);
    if (!nombre || !Number.isFinite(nota)) return null;
    return new ReporteProgreso("", nombre, grado, materia, periodo, nota, docenteId, obs.join(" | "));
  }
}
