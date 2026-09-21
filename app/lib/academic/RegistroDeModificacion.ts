/**
 * Diagrama (calificaciones):
 *  RegistroDeModificacion { calificacion, autorizadoPor: admin, motivo, fecha }
 *  Administrador "1" --> "*" RegistroDeModificacion : autoriza_cambio_con_motivo
 *  RegistroDeModificacion "1" --> "1" Calificacion : actualiza
 *  Calificacion "1" --> "*" RegistroDeModificacion : queda_registrada_en
 *
 * La cadena es inmutable: modificar NO muta la calificación original, agrega
 * un bloque MODIFICACION que referencia el hash de la calificación, registra
 * el nuevo estado y exige justificación (motivo). El estado vigente se deriva
 * de la última modificación.
 */
import type { EstadoCalificacion } from "./Calificacion";

export interface ModificacionData {
  calificacionHash: string;
  estudiante: string;
  nuevoEstado: EstadoCalificacion;
  autorizadoPor: string;
  motivo: string;
  fecha: string;
}

export class RegistroDeModificacion {
  constructor(
    public readonly calificacionHash: string,
    public readonly estudiante: string,
    public readonly nuevoEstado: EstadoCalificacion,
    public readonly autorizadoPor: string,
    public readonly motivo: string,
    public readonly fecha: string,
  ) {}

  static validar(d: ModificacionData): string | null {
    if (!d.calificacionHash.trim()) return "Calificación a modificar requerida.";
    if (!d.estudiante.trim()) return "Estudiante requerido.";
    if (d.nuevoEstado !== "Aprobado" && d.nuevoEstado !== "Refuerzo") return "Estado debe ser Aprobado o Refuerzo.";
    if (!d.autorizadoPor.trim()) return "Autorizador (Coordinación) requerido.";
    if (!d.motivo.trim()) return "Justificación (motivo) requerida: el cambio se audita en la cadena.";
    if (!d.fecha.trim()) return "Fecha requerida.";
    return null;
  }

  toBlockData(): string {
    return `MODIFICACION | ${this.calificacionHash} | ${this.estudiante} | ${this.nuevoEstado} | ${this.autorizadoPor} | ${this.motivo} | ${this.fecha}`;
  }

  static parse(raw: string): RegistroDeModificacion | null {
    if (!raw.startsWith("MODIFICACION |")) return null;
    const parts = raw.split("|").map((p) => p.trim());
    if (parts.length < 7) return null;
    const [, calificacionHash, estudiante, nuevoEstado, autorizadoPor, motivo, fecha] = parts;
    if (!calificacionHash || !estudiante || (nuevoEstado !== "Aprobado" && nuevoEstado !== "Refuerzo") || !autorizadoPor || !motivo || !fecha) return null;
    return new RegistroDeModificacion(calificacionHash, estudiante, nuevoEstado as EstadoCalificacion, autorizadoPor, motivo, fecha);
  }
}