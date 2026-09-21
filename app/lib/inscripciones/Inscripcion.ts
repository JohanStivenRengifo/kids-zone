/**
 * Inscripción — Inicio de Clases (I) / Proceso de Aprendizaje (J)
 * Prefijo INSCRIPCION para la cadena integrada G.
 */
export interface InscripcionData {
  estudianteNombre: string;
  grado: string;
  acudienteNombre: string;
  periodo: string;
}

export class Inscripcion {
  constructor(
    public readonly id_inscripcion: string,
    public readonly estudianteNombre: string,
    public readonly grado: string,
    public readonly acudienteNombre: string,
    public readonly periodo: string,
    public readonly fecha: Date,
    public estado: "activa" | "certificada" = "activa",
  ) {}

  static validate(data: InscripcionData): string | null {
    if (!data.estudianteNombre.trim()) return "Estudiante requerido.";
    if (!data.grado.trim()) return "Grado requerido.";
    if (!data.acudienteNombre.trim()) return "Acudiente requerido.";
    if (!data.periodo.trim()) return "Periodo requerido.";
    return null;
  }

  toBlockData(): string {
    return `INSCRIPCION | ${this.estudianteNombre} | ${this.grado} | ${this.acudienteNombre} | ${this.periodo}`;
  }

  static parse(raw: string): Inscripcion | null {
    if (!raw.startsWith("INSCRIPCION |")) return null;
    const parts = raw.split("|").map((p) => p.trim());
    if (parts.length < 5) return null;
    const [, nombre, grado, acudiente, periodo] = parts;
    if (!nombre) return null;
    return new Inscripcion(`ins-${nombre}`, nombre, grado, acudiente, periodo, new Date());
  }
}
