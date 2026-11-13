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

/** Muestra de la segunda sección, para comparar cómo se ven los números. */
export function MuestraNumeros({ datos }: { datos: DatosGenerados }) {
  const cifras = [
    ["31", "ediciones anuales del informe"],
    ["10 a 15", "años de horizonte de las estimaciones"],
    ["200+", "activos analizados por más de 90 especialistas"],
    ["7,0%", "retorno anual esperado de una cartera 60% acciones y 40% bonos"],
  ];
  return (
    <section className="border-t border-[var(--linea)]">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-8">
        <p className="rotulo">De dónde salen los números</p>
        <h2 className="font-titular mt-4 max-w-[22ch] text-[34px] leading-[1.08] tracking-[-0.015em] sm:text-[44px]">
          Una estimación de largo plazo, no un pronóstico del año que viene.
        </h2>
        <p className="mt-6 max-w-[62ch] text-[18px] leading-[1.6] text-[var(--gris)]">
          Una vez por año, J.P. Morgan Asset Management, uno de los administradores de inversiones más grandes del mundo,
          publica cuánto espera que rinda cada tipo de inversión en los próximos 10 a 15 años, cuánto puede oscilar y cómo se
          mueven unas respecto de otras. Patrimonia usa la edición {datos.fuente.edicion}.
        </p>
        <dl className="mt-14 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {cifras.map(([cifra, texto]) => (
            <div key={texto} className="border-t border-[var(--tinta)] pt-4">
              <dt className="font-titular text-[44px] leading-none [font-variant-numeric:lining-nums]">{cifra}</dt>
              <dd className="mt-3 text-[15px] leading-[1.45] text-[var(--gris)]">{texto}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
