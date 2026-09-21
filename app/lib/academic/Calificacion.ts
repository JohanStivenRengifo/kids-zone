/**
 * Diagrama (calificaciones):
 *  Calificacion { estado: Aprobado | Refuerzo, registradaPor: docente }
 *  Docente "1" --> "*" Calificacion : crea
 *  Calificacion "*" --> "1" Estudiante : pertenece_a
 *
 * La calificación se escribe como bloque inmutable con prefijo CALIFICACION.
 */
export type EstadoCalificacion = "Aprobado" | "Refuerzo";

export interface CalificacionData {
  estudiante: string;
  grado: string;
  estado: EstadoCalificacion;
  registradaPor: string;
  fecha: string;
}

export class Calificacion {
  constructor(
    public readonly estudiante: string,
    public readonly grado: string,
    public readonly estado: EstadoCalificacion,
    public readonly registradaPor: string,
    public readonly fecha: string,
  ) {}

  static validar(d: CalificacionData): string | null {
    if (!d.estudiante.trim()) return "Estudiante requerido.";
    if (!d.grado.trim()) return "Grado requerido.";
    if (d.estado !== "Aprobado" && d.estado !== "Refuerzo") return "Estado debe ser Aprobado o Refuerzo.";
    if (!d.registradaPor.trim()) return "Docente (Registrar nota) requerido.";
    if (!d.fecha.trim()) return "Fecha requerida.";
    return null;
  }

  toBlockData(): string {
    return `CALIFICACION | ${this.estudiante} | ${this.grado} | ${this.estado} | ${this.registradaPor} | ${this.fecha}`;
  }

  static parse(raw: string): Calificacion | null {
    if (!raw.startsWith("CALIFICACION |")) return null;
    const parts = raw.split("|").map((p) => p.trim());
    if (parts.length < 6) return null;
    const [, estudiante, grado, estado, registradaPor, fecha] = parts;
    if (!estudiante || !grado || (estado !== "Aprobado" && estado !== "Refuerzo") || !registradaPor || !fecha) return null;
    return new Calificacion(estudiante, grado, estado as EstadoCalificacion, registradaPor, fecha);
  }
}