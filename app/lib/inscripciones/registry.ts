import { Inscripcion } from './Inscripcion';
import type { Blockchain } from '@/lib/kernel/Blockchain';
import { listarEstudiantes } from './StudentRegistry';

// Lista unificada de estudiantes
export function getEstudiantesInscritos(
  chain: Blockchain | null
): { nombre: string; grado: string; periodo: string }[] {
  const map = new Map<
    string,
    { nombre: string; grado: string; periodo: string }
  >();
  for (const e of listarEstudiantes()) {
    map.set(e.nombre, { nombre: e.nombre, grado: e.grado, periodo: e.periodo });
  }
  if (chain) {
    for (const b of chain.chain) {
      const ins = Inscripcion.parse(b.data);
      if (ins && !map.has(ins.estudianteNombre)) {
        map.set(ins.estudianteNombre, {
          nombre: ins.estudianteNombre,
          grado: ins.grado,
          periodo: ins.periodo,
        });
      }
    }
  }
  return [...map.values()].sort((a, b) => a.nombre.localeCompare(b.nombre));
}
