/**
 * Objeto Emisor — Jardín Infantil Carrusel (diagrama: A)
 * «Objeto: Emisor» — genera PDF y firma en blockchain
 */
export class Emisor {
  constructor(
    public readonly nombre: string,
    public readonly billeteraDigital: string,
  ) {}

  static readonly CARRUSEL = new Emisor("Jardín Infantil Carrusel", "0x71C...3A9");
}
