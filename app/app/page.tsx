import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kids Zone",
  description: "Panel principal de Kids Zone",
};

const modulos = [
  {
    paso: "1",
    titulo: "Inscripciones",
    href: "/inscripciones",
    descripcion: "Registra al estudiante y su acudiente. Crea el expediente inicial.",
  },
  {
    paso: "2",
    titulo: "Pagos",
    href: "/pagos",
    descripcion: "Registra mensualidades. Cada pago queda guardado de forma permanente.",
  },
  {
    paso: "3",
    titulo: "Certificados",
    href: "/certificados",
    descripcion: "Genera el diploma y verifica su código. Misma cadena que los pasos anteriores.",
  },
] as const;

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Kids Zone</h1>
        <p className="max-w-2xl text-slate-600">
          Tres pasos conectados en una sola cadena: inscribes, registras el pago y emites el certificado. Todo queda guardado y verificable en el mismo lugar.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {modulos.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className="flex flex-col gap-3 rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">{m.paso}</span>
            <span className="text-lg font-medium">{m.titulo}</span>
            <span className="text-sm text-slate-600">{m.descripcion}</span>
            <span className="mt-auto text-sm font-medium text-slate-900">Ir →</span>
          </Link>
        ))}
      </section>

      <section className="rounded-xl border bg-white p-5">
        <h2 className="font-medium">Cómo se conectan</h2>
        <p className="mt-1 text-sm text-slate-600">
          <b>Inscripciones</b> crea el estudiante → <b>Pagos</b> deja el comprobante en la cadena → <b>Certificados</b> genera el diploma usando ese mismo registro. Si falta el pago, la verificación lo indica y te lleva de vuelta a pagos.
        </p>
      </section>
    </main>
  );
}
