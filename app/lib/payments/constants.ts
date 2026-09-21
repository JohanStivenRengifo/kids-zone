export { STORAGE_KEY, DIFFICULTY, GENESIS_TEXT, FIRST_PAYMENT_TEXT } from "../kernel/constants";

export const CONCEPTOS = [
  "Mensualidad",
  "Matrícula",
  "Transporte",
  "Alimentación",
  "Materiales",
  "Otro",
] as const;

export const METODOS = [
  "Efectivo",
  "Transferencia",
  "Nequi",
  "Daviplata",
  "Tarjeta",
] as const;

export const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
] as const;

export type Concepto = (typeof CONCEPTOS)[number];
export type Metodo = (typeof METODOS)[number];
export type Mes = (typeof MESES)[number];
