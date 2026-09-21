import { Inscripcion } from "./Inscripcion";
import type { Blockchain } from "@/lib/kernel/Blockchain";

export function getEstudiantesInscritos(chain: Blockchain | null): { nombre: string; grado: string; periodo: string }[] {
  if (!chain) return [];
  const map = new Map<string, { nombre: string; grado: string; periodo: string }>();
  for (const b of chain.chain) {
    const ins = Inscripcion.parse(b.data);
    if (ins) map.set(ins.estudianteNombre, { nombre: ins.estudianteNombre, grado: ins.grado, periodo: ins.periodo });
  }
  return [...map.values()].sort((a, b) => a.nombre.localeCompare(b.nombre));
}
