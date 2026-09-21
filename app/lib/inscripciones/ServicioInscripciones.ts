/**
 * Servicio Inscripciones — reutiliza kernel (Blockchain/Repository) sin duplicar.
 * Orquesta I→J→K→L→G y Q/R (Registro Académico Unificado / Participación)
 */
import type { Blockchain } from "@/lib/kernel/Blockchain";
import type { ChainRepository } from "@/lib/kernel/ChainStorage";
import { Inscripcion, type InscripcionData } from "./Inscripcion";
import { Estudiante } from "@/lib/domain/Estudiante";
import { Acudiente } from "@/lib/domain/Acudiente";
import { EstadoPago } from "@/lib/domain/EstadoPago";
import { CATALOGO_CONCEPTOS } from "@/lib/domain/catalog";

export class ServicioInscripciones {
  constructor(
    private chain: Blockchain,
    private repository: ChainRepository,
  ) {}

  /** Inscribe y crea EstadoPago iniciales (F: pagos cuotas/servicios) */
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
    this.chain.addBlock(ins.toBlockData());
    this.repository.save(this.chain.toJSON());

    // Crea estudiante/acudiente y estados pendientes (conecta con /pagos)
    const est = new Estudiante(`est-${Date.now()}`, data.estudianteNombre, data.grado);
    const estados = CATALOGO_CONCEPTOS.slice(0, 2).map(
      (c, i) => new EstadoPago(`estado-${est.id_estudiante}-${i}`, est.id_estudiante, c.monto, new Date(), c),
    );
    est.setEstados(estados);
    void new Acudiente(`acu-${est.id_estudiante}`, data.acudienteNombre, "0x0", est);

    return { ok: true, inscripcion: ins };
  }

  /** Q: Actualización Registro Académico Unificado — bloque tipo REGISTRO */
  registrarAvance(estudianteNombre: string, materia: string, periodo: string): void {
    this.chain.addBlock(`REGISTRO | ${estudianteNombre} | ${materia} | ${periodo}`);
    this.repository.save(this.chain.toJSON());
  }
}
