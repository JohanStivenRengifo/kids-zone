/**
 * Actores del diagrama de calificaciones:
 *  docente1 (Docente)            → permiso: Registrar nota
 *  admin1   (Coordinación)       → permisos: Modificar + justificar
 *  padre1   (Padre de familia)   → permiso: Solo lectura
 *
 * Los permisos se verifican en ServicioCalificaciones (enforcement central).
 */
export type Permiso = "Registrar nota" | "Modificar" | "Justificar" | "Solo lectura";

export class Actor {
  constructor(
    public readonly id: string,
    public readonly rol: string,
    public readonly permisos: readonly Permiso[],
  ) {}

  puede(permiso: Permiso): boolean {
    return this.permisos.includes(permiso);
  }
}

export const DOCENTE = new Actor("docente1", "Docente", ["Registrar nota"]);
export const ADMINISTRADOR = new Actor("admin1", "Coordinación", ["Modificar", "Justificar"]);
export const PADRE_DE_FAMILIA = new Actor("padre1", "Padre de familia", ["Solo lectura"]);

export const ACTORES: readonly Actor[] = [DOCENTE, ADMINISTRADOR, PADRE_DE_FAMILIA];

export function actorPorId(id: string): Actor {
  return ACTORES.find((a) => a.id === id) ?? PADRE_DE_FAMILIA;
}