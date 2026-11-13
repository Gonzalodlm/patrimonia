import Link from "next/link";
import type { DatosGenerados } from "@/motor/generado";
import { GraficoFrontera } from "@/componentes/GraficoFrontera";

export function Encabezado() {
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-8">
      <Link href="/" className="font-titular text-[26px] leading-none tracking-tight">
        Patrimonia
      </Link>
      <nav className="flex items-center gap-6 text-[15px]">
        <a href="#como-funciona" className="hidden text-[var(--gris)] hover:text-[var(--tinta)] sm:inline">
          Cómo funciona
        </a>
        <a href="#preguntas" className="hidden text-[var(--gris)] hover:text-[var(--tinta)] sm:inline">
          Preguntas
        </a>
        <Link href="/plan" className="rounded-[3px] bg-[var(--tinta)] px-4 py-2 text-[var(--fondo)] hover:bg-black">
          Armar mi plan
        </Link>
      </nav>
    </header>
  );
}

export function Apertura({ datos }: { datos: DatosGenerados }) {
  return (
    <section className="mx-auto grid max-w-6xl gap-12 px-4 pt-12 pb-20 sm:px-8 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-16 lg:pt-20">
      <div className="max-w-[34rem]">
        <h1 className="font-titular text-[44px] leading-[1.02] tracking-[-0.02em] sm:text-[64px]">
          Tu plata, con un plan de largo plazo.
        </h1>
        <p className="mt-7 text-[19px] leading-[1.55] text-[var(--gris)]">
          Patrimonia te ayuda a armar una cartera de inversión y un plan para tu patrimonio, con los supuestos que J.P. Morgan publica cada año.
        </p>
        <p className="mt-3 text-[19px] leading-[1.55] text-[var(--gris)]">Es gratis, no vende nada y el código es abierto.</p>
        <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link href="/plan" className="rounded-[3px] bg-[var(--tinta)] px-6 py-3.5 text-[16px] text-[var(--fondo)] hover:bg-black">
            Armar mi plan
          </Link>
          <span className="text-[14px] text-[var(--gris)]">Sin registrarte. Tus datos no salen de tu navegador.</span>
        </div>
      </div>
      <GraficoFrontera
        datos={datos}
        titulo="Frontera eficiente: el mayor retorno esperado posible para cada nivel de riesgo"
      />
    </section>
  );
}
