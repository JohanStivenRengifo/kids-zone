/**
 * Objeto Teléfono Móvil — aplicacion_padres (diagrama: C)
 * 3. Se envía a la familia — 4. Comparten PDF y QR
 */
import type { DiplomaPDF } from "./DiplomaPDF";
import type { RegistroBlockchain } from "./RegistroBlockchain";

export class AplicacionPadres {
  constructor(
    public readonly usuario: string,
    public readonly documentoAdjunto: string,
    public readonly codigoQR: string,
    public readonly diploma: DiplomaPDF,
    public readonly registro: RegistroBlockchain,
  ) {}

  static enviarFamilia(
    diploma: DiplomaPDF,
    registro: RegistroBlockchain,
    usuario = "Familia Cali",
    codigoQR = `Enlace a ${registro.idTransaccion}`,
  ): AplicacionPadres {
    return new AplicacionPadres(
      usuario,
      `diploma_${diploma.estudiante.toLowerCase().replace(/\s+/g, "_")}.pdf`,
      codigoQR,
      diploma,
      registro,
    );
  }
}
