/**
 * Servicio Calificaciones — orquesta el diagrama:
 *  DOC → 1. Crea  CAL (registra nota)
 *  CAL → pertenece_a  EST
 *  ADM → 2. Autoriza cambio + motivo  MOD
 *  MOD → 3. Actualiza  CAL  (bloque nuevo, cadena inmutable)
 *  PAD → consulta la lectura (solo lectura)
 *
 * Los permisos se validan aquí (enforcement central) sobre los actores
 * del diagrama; en modo lectura nunca se escribe en la cadena.
 */
import type { Blockchain } from "@/lib/kernel/Blockchain";
import type { ChainRepository } from "@/lib/kernel/ChainStorage";
import { Calificacion, type EstadoCalificacion } from "./Calificacion";
import { RegistroDeModificacion } from "./RegistroDeModificacion";
import { DOCENTE, ADMINISTRADOR, type Actor } from "./Actores";

export interface CalificacionVigente {
  hash: string;
  index: number;
  calificacion: Calificacion;
  estadoActual: EstadoCalificacion;
  modificaciones: RegistroDeModificacion[];
}

export class ServicioCalificaciones {
  constructor(
    private chain: Blockchain,
    private repository: ChainRepository,
  ) {}

  /** 1. DOC crea una calificación (permiso: Registrar nota). */
  registrarCalificacion(
    data: { estudiante: string; grado: string; estado: EstadoCalificacion; registradaPor: string; fecha: string },
    actor: Actor = DOCENTE,
  ): { ok: boolean; error?: string; id?: string } {
    if (!actor.puede("Registrar nota")) return { ok: false, error: `${actor.rol} (${actor.id}) no tiene permiso "Registrar nota".` };
    const msg = Calificacion.validar(data);
    if (msg) return { ok: false, error: msg };
    const cal = new Calificacion(data.estudiante, data.grado, data.estado, data.registradaPor, data.fecha);
    const bloque = this.chain.addBlock(cal.toBlockData());
    this.repository.save(this.chain.toJSON());
    return { ok: true, id: bloque.hash ?? undefined };
  }

  /** 2+3. ADM autoriza la modificación con justificación (permisos: Modificar + Justificar). */
  modificarCalificacion(
    data: { calificacionHash: string; nuevoEstado: EstadoCalificacion; autorizadoPor: string; motivo: string; fecha: string },
    actor: Actor = ADMINISTRADOR,
  ): { ok: boolean; error?: string } {
    if (!actor.puede("Modificar") || !actor.puede("Justificar"))
      return { ok: false, error: `${actor.rol} (${actor.id}) requiere permisos "Modificar" y "Justificar".` };
    const target = this.chain.chain.find((b) => b.hash === data.calificacionHash);
    const cal = target ? Calificacion.parse(target.data) : null;
    if (!target || !cal) return { ok: false, error: "La calificación seleccionada no existe en la cadena." };
    let estadoActual = cal.estado;
    for (const b of this.chain.chain) {
      const m = RegistroDeModificacion.parse(b.data);
      if (m && m.calificacionHash === data.calificacionHash) estadoActual = m.nuevoEstado;
    }
    if (estadoActual === data.nuevoEstado) return { ok: false, error: "El nuevo estado es igual al vigente; no hay cambio que justificar." };
    const msg = RegistroDeModificacion.validar({
      calificacionHash: data.calificacionHash,
      estudiante: cal.estudiante,
      nuevoEstado: data.nuevoEstado,
      autorizadoPor: data.autorizadoPor,
      motivo: data.motivo,
      fecha: data.fecha,
    });
    if (msg) return { ok: false, error: msg };
    const mod = new RegistroDeModificacion(
      data.calificacionHash,
      cal.estudiante,
      data.nuevoEstado,
      data.autorizadoPor,
      data.motivo,
      data.fecha,
    );
    this.chain.addBlock(mod.toBlockData());
    this.repository.save(this.chain.toJSON());
    return { ok: true };
  }

  /** Lectura (PAD / docentes / admin): estado vigente derivado de la última modificación. */
  listar(): CalificacionVigente[] {
    const modsPorHash = new Map<string, RegistroDeModificacion[]>();
    const cales: { hash: string; index: number; calificacion: Calificacion }[] = [];
    for (const b of this.chain.chain) {
      const m = RegistroDeModificacion.parse(b.data);
      if (m) {
        const arr = modsPorHash.get(m.calificacionHash) ?? [];
        arr.push(m);
        modsPorHash.set(m.calificacionHash, arr);
        continue;
      }
      const c = Calificacion.parse(b.data);
      if (c && b.hash) cales.push({ hash: b.hash, index: b.index, calificacion: c });
    }
    return cales.map(({ hash, index, calificacion }) => {
      const modificaciones = modsPorHash.get(hash) ?? [];
      const ultima = modificaciones[modificaciones.length - 1];
      return {
        hash,
        index,
        calificacion,
        estadoActual: ultima?.nuevoEstado ?? calificacion.estado,
        modificaciones,
      };
    });
  }

  consultarPorEstudiante(estudiante: string): CalificacionVigente[] {
    return this.listar().filter((c) => c.calificacion.estudiante === estudiante);
  }
}