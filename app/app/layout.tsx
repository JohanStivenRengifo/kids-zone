import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kids Zone",
  description: "Gestión escolar Kids Zone — inscripciones, pagos y certificados en una sola cadena",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased light`} style={{ colorScheme: "light" }}>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <header className="sticky top-0 z-10 border-b bg-white">
          <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
            <Link href="/" className="font-semibold tracking-tight">Kids Zone</Link>
            <div className="flex gap-2 text-sm">
              <Link href="/inscripciones" className="rounded px-3 py-1.5 hover:bg-slate-100">Inscripciones</Link>
              <Link href="/pagos" className="rounded px-3 py-1.5 hover:bg-slate-100">Pagos</Link>
              <Link href="/certificados" className="rounded px-3 py-1.5 hover:bg-slate-100">Certificados</Link>
            </div>
          </nav>
        </header>
        <div className="flex-1">{children}</div>
        <footer className="border-t bg-white py-3 text-center text-xs text-slate-500">
          Misma cadena integrada para los 3 módulos — registros íntegros y verificables
        </footer>
      </body>
    </html>
  );
}
