/**
 * Catálogo inicial derivado de constants — evita duplicar listas.
 * Provee Estudiante/ConceptoPago/EstadoPago coherentes con el diagrama.
 */
import { CONCEPTOS, MESES } from "@/lib/payments";
import { ConceptoPago } from "./ConceptoPago";
import { Estudiante } from "./Estudiante";
import { EstadoPago } from "./EstadoPago";

export const CATALOGO_CONCEPTOS: ConceptoPago[] = CONCEPTOS.map(
  (tipo, i) => new ConceptoPago(`concepto-${i + 1}`, tipo, 280000, MESES[0]),
);

export const ESTUDIANTES_SEED: Estudiante[] = [
  new Estudiante("est-1", "Ana Ruiz", "Jardín", "al día"),
  new Estudiante("est-2", "Luis Pérez", "Transición", "al día"),
];

export function crearEstadosIniciales(estudiante: Estudiante, conceptos: ConceptoPago[]): EstadoPago[] {
  return conceptos.slice(0, 2).map(
    (c, i) =>
      new EstadoPago(
        `estado-${estudiante.id_estudiante}-${i}`,
        estudiante.id_estudiante,
        c.monto,
        new Date(),
        c,
      ),
  );
}

// Inicializa estados para los estudiantes seed (una vez)
for (const est of ESTUDIANTES_SEED) {
  est.setEstados(crearEstadosIniciales(est, CATALOGO_CONCEPTOS));
}
