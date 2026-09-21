// Servicio Inscripciones
 */
import type { Blockchain } from "@/lib/kernel/Blockchain";
import type { ChainRepository } from "@/lib/kernel/ChainStorage";
import { Inscripcion, type InscripcionData } from "./Inscripcion";
import { registrarEstudiante } from "./StudentRegistry";
import { Estudiante } from "@/lib/domain/Estudiante";
import { Acudiente } from "@/lib/domain/Acudiente";
import { EstadoPago } from "@/lib/domain/EstadoPago";
import { CATALOGO_CONCEPTOS } from "@/lib/domain/catalog";

export class ServicioInscripciones {
  constructor(
    private chain?: Blockchain | null,
    private repository?: ChainRepository | null,
  ) {}

  /** Inscribe en el registro compartido y crea EstadoPago iniciales (F: pagos cuotas/servicios) */
  inscribir(data: InscripcionData): { ok: boolean; error?: string; inscripcion?: Inscripcion } {
    const msg = Inscripcion.validate(data);
    if (msg) return { ok: false, error: msg };

    const ins = new Inscripcion(
      `ins-${Date.now()}`,
      data.estudianteNombre,
      data.grado,
      data.acudienteNombre,
      data.periodo,
      new Date(),
    );
    // Único compartido: lista de estudiantes. Sin bloques globales.
    registrarEstudiante({
      nombre: data.estudianteNombre,
      grado: data.grado,
      periodo: data.periodo,
      acudienteNombre: data.acudienteNombre,
    });

    // Crea estudiante/acudiente y estados pendientes (conecta con /pagos)
    const est = new Estudiante(`est-${Date.now()}`, data.estudianteNombre, data.grado);
    const estados = CATALOGO_CONCEPTOS.slice(0, 2).map(
      (c, i) => new EstadoPago(`estado-${est.id_estudiante}-${i}`, est.id_estudiante, c.monto, new Date(), c),
    );
    est.setEstados(estados);
    void new Acudiente(`acu-${est.id_estudiante}`, data.acudienteNombre, "0x0", est);

    return { ok: true, inscripcion: ins };
  }

  /** Q: Actualización Registro Académico Unificado — bloque al final (append-only) */
  registrarAvance(estudianteNombre: string, materia: string, periodo: string): void {
    if (!this.chain || !this.repository) throw new Error("Sin cadena de notas del estudiante.");
    this.chain.addBlock(`REGISTRO | ${estudianteNombre} | ${materia} | ${periodo}`);
    this.repository.save(this.chain.toJSON());
  }
}
