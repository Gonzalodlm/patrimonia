import Link from "next/link";
import type { DatosGenerados } from "@/motor/generado";
import { GraficoFrontera } from "@/componentes/GraficoFrontera";

export function Encabezado() {
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-8 sm:py-5">
      <Link href="/" className="toque font-titular text-[26px] leading-none tracking-tight">
        Patrimonia
      </Link>
      <nav className="flex items-center gap-6 text-[15px]">
        <Link href="/#como-funciona" className="hidden text-[var(--gris)] hover:text-[var(--tinta)] sm:inline">
          Cómo funciona
        </Link>
        <Link href="/#preguntas" className="hidden text-[var(--gris)] hover:text-[var(--tinta)] sm:inline">
          Preguntas
        </Link>
        <Link href="/plan" className="toque rounded-[3px] bg-[var(--tinta)] px-4 text-[var(--fondo)] hover:bg-black">
          Armar mi plan
        </Link>
      </nav>
    </header>
  );
}

export function Apertura({ datos }: { datos: DatosGenerados }) {
  return (
    <section className="mx-auto grid max-w-6xl gap-10 px-4 pt-8 pb-14 sm:gap-12 sm:px-8 sm:pt-12 sm:pb-20 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-16 lg:pt-20">
      <div className="max-w-[34rem]">
        <h1 className="font-titular text-[42px] leading-[1.02] tracking-[-0.02em] sm:text-[64px]">
          Tu plata, con un plan de largo plazo.
        </h1>
        <p className="mt-6 text-[18px] leading-[1.55] text-[var(--gris)] sm:mt-7 sm:text-[19px]">
          Patrimonia te ayuda a armar una cartera de inversión y un plan para tu patrimonio, con los supuestos que J.P. Morgan publica cada año.
        </p>
        <p className="mt-3 text-[18px] leading-[1.55] text-[var(--gris)] sm:text-[19px]">Es gratis, no vende nada y el código es abierto.</p>
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 sm:mt-9">
          <Link href="/plan" className="block w-full text-center rounded-[3px] bg-[var(--tinta)] px-6 py-3.5 text-[16px] text-[var(--fondo)] hover:bg-black sm:inline-block sm:w-auto">
            Armar mi plan
          </Link>
          <span className="text-[14px] text-[var(--gris)]">Sin registrarte. Patrimonia no guarda lo que cargás.</span>
        </div>
      </div>
      <GraficoFrontera
        datos={datos}
        titulo="Frontera eficiente: el mayor retorno esperado posible para cada nivel de riesgo"
      />
    </section>
  );
}
