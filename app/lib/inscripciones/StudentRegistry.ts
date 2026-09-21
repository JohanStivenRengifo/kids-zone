// Registro de estudiantes - lista compartida

export interface EstudianteRegistrado {
  id: string;
  nombre: string;
  grado: string;
  periodo: string;
  acudienteNombre?: string;
}

const REGISTRY_KEY = 'kidsStudents/v1';

function slugId(nombre: string): string {
  const slug = nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return slug || 'sin-nombre';
}

function readRaw(): EstudianteRegistrado[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(REGISTRY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as EstudianteRegistrado[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e) => typeof e?.nombre === 'string' && typeof e?.id === 'string'
    );
  } catch {
    return [];
  }
}

function writeRaw(list: EstudianteRegistrado[]): void {
  try {
    localStorage.setItem(REGISTRY_KEY, JSON.stringify(list));
  } catch {
    // sin almacenamiento: la lista sigue en memoria del turno
  }
}

export function listarEstudiantes(): EstudianteRegistrado[] {
  return [...readRaw()].sort((a, b) => a.nombre.localeCompare(b.nombre));
}

export function buscarEstudiante(nombre: string): EstudianteRegistrado | null {
  const id = slugId(nombre);
  return readRaw().find((e) => e.id === id || e.nombre === nombre) ?? null;
}

export function registrarEstudiante(data: {
  nombre: string;
  grado: string;
  periodo: string;
  acudienteNombre?: string;
}): EstudianteRegistrado {
  const nombre = data.nombre.trim();
  const id = slugId(nombre);
  const list = readRaw();
  const existing = list.find((e) => e.id === id);
  if (existing) {
    existing.grado = data.grado.trim() || existing.grado;
    existing.periodo = data.periodo.trim() || existing.periodo;
    if (data.acudienteNombre?.trim())
      existing.acudienteNombre = data.acudienteNombre.trim();
    writeRaw(list);
    return existing;
  }
  const nuevo: EstudianteRegistrado = {
    id,
    nombre,
    grado: data.grado.trim(),
    periodo: data.periodo.trim(),
    acudienteNombre: data.acudienteNombre?.trim() || undefined,
  };
  list.push(nuevo);
  writeRaw(list);
  return nuevo;
}

/**
 * Migración suave: si existen inscripciones en una cadena legada única,
 * se importan al registro compartido sin mezclar bloques de dominio.
 */
export function importarInscripcionesLegadas(
  inscritos: { nombre: string; grado: string; periodo: string }[]
): EstudianteRegistrado[] {
  const list = readRaw();
  for (const ins of inscritos) {
    const id = slugId(ins.nombre);
    if (!list.some((e) => e.id === id)) {
      list.push({
        id,
        nombre: ins.nombre,
        grado: ins.grado,
        periodo: ins.periodo,
      });
    }
  }
  writeRaw(list);
  return listarEstudiantes();
}
