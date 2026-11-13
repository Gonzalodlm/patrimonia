"use client";

import { useState } from "react";
import type { DatosGenerados } from "@/motor/generado";
import { numero } from "@/lib/formato";
import { BarraMezcla } from "./BarraMezcla";
import { FronteraInteractiva } from "./FronteraInteractiva";

export function Explicacion({ datos, onSeguir }: { datos: DatosGenerados; onSeguir: () => void }) {
  const cartera = datos.carteras.diversificada;
  const frontera = cartera.frontera;
  const clases = datos.clases.filter((c) => cartera.clases.includes(c.id));
  const inicial = frontera.findIndex((p) => p.volatilidad >= 10);
  const [indice, setIndice] = useState(inicial < 0 ? Math.floor(frontera.length / 2) : inicial);
  const punto = frontera[indice];
  const pesos = Object.fromEntries(cartera.clases.map((id, i) => [id, punto.pesos[i]]));
  const sharpe = cartera.maximoSharpe;
  const liquidez = datos.clases.find((c) => c.id === "liquidez_usd")!;

  return (
    <div>
      <p className="rotulo">Antes de empezar</p>
      <h1 className="font-titular mt-3 text-[38px] leading-[1.05] tracking-[-0.015em] sm:text-[52px]">Dos ideas que usa Patrimonia.</h1>

      <section className="mt-12 grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
        <div className="max-w-[60ch]">
          <h2 className="font-titular text-[30px] leading-tight">1. La frontera eficiente</h2>
          <div className="mt-4 space-y-4 text-[17px] leading-[1.6] text-[var(--gris)]">
            <p>
              La formuló Harry Markowitz en 1952, y en 1990 le valió el Nobel de Economía. La idea es que, combinando inversiones que
              no suben y bajan al mismo tiempo, se consigue más retorno para un mismo riesgo.
            </p>
            <p>
              La frontera es la línea de las mejores combinaciones posibles: para cada nivel de riesgo, la de mayor retorno esperado.
              Debajo de ella siempre hay una cartera mejor.
            </p>
            <p className="text-[var(--tinta)]">Mové el punto por la línea y mirá cómo cambia la mezcla.</p>
          </div>
        </div>

        <div>
          <FronteraInteractiva
            frontera={frontera}
            clases={clases}
            elegido={{ volatilidad: punto.volatilidad, retorno: punto.retornoCompuesto }}
            marcas={[{ volatilidad: sharpe.volatilidad, retorno: sharpe.retornoCompuesto, etiqueta: "Máximo Sharpe" }]}
            onElegir={setIndice}
            titulo="Frontera eficiente con el punto elegido"
          />
          <label className="mt-4 block">
            <span className="sr-only">Riesgo de la cartera</span>
            <input
              type="range"
              min={0}
              max={frontera.length - 1}
              value={indice}
              onChange={(e) => setIndice(Number(e.target.value))}
              className="w-full accent-[var(--acento)]"
              aria-valuetext={`Riesgo ${numero(punto.volatilidad, 1)}%, retorno esperado ${numero(punto.retornoCompuesto, 1)}% por año`}
            />
          </label>
          <dl className="tabular mt-5 grid grid-cols-3 gap-4 border-t border-[var(--linea)] pt-4">
            <div>
              <dt className="text-[13px] text-[var(--gris)]">Riesgo</dt>
              <dd className="mt-1 text-[22px]">{numero(punto.volatilidad, 1)}%</dd>
            </div>
            <div>
              <dt className="text-[13px] text-[var(--gris)]">Retorno por año</dt>
              <dd className="mt-1 text-[22px]">{numero(punto.retornoCompuesto, 1)}%</dd>
            </div>
            <div>
              <dt className="text-[13px] text-[var(--gris)]">Sharpe</dt>
              <dd className="mt-1 text-[22px]">{numero(punto.sharpe, 2)}</dd>
            </div>
          </dl>
          <div className="mt-6">
            <BarraMezcla pesos={pesos} clases={clases} />
          </div>
        </div>
      </section>

      <section className="mt-20 max-w-[60ch]">
        <h2 className="font-titular text-[30px] leading-tight">2. El ratio de Sharpe</h2>
        <div className="mt-4 space-y-4 text-[17px] leading-[1.6] text-[var(--gris)]">
          <p>
            Lo propuso William Sharpe, que compartió ese Nobel con Markowitz. Mide cuánto retorno extra recibís por cada unidad de riesgo
            que asumís, comparado con dejar la plata en algo seguro.
          </p>
          <p>Sirve para comparar dos carteras: a igual riesgo, es mejor la de Sharpe más alto.</p>
          <p>
            Con los supuestos de este año, la cartera de mayor Sharpe es casi toda renta fija, con un riesgo de{" "}
            {numero(sharpe.volatilidad, 1)}%. Rinde menos que otras, pero cada punto de riesgo paga más. Por eso Patrimonia no le da a
            todos esa cartera: cada persona se ubica en el punto de la frontera que corresponde a su perfil.
          </p>
        </div>
        <details className="mt-5 text-[16px]">
          <summary className="cursor-pointer text-[var(--gris)] hover:text-[var(--tinta)]">Ver la fórmula</summary>
          <div className="mt-3 border-l-2 border-[var(--linea)] pl-4 text-[var(--gris)]">
            <p className="font-titular text-[22px] text-[var(--tinta)]">Sharpe = (R − R<sub>f</sub>) / σ</p>
            <p className="mt-2 leading-[1.6]">
              R es el retorno esperado de la cartera, R<sub>f</sub> el de la liquidez en dólares ({numero(liquidez.retornoAritmetico, 1)}%
              según el informe) y σ la volatilidad de la cartera. Como en el informe, se usa el retorno aritmético.
            </p>
          </div>
        </details>
      </section>

      <div className="mt-16 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-[var(--linea)] pt-8">
        <button type="button" onClick={onSeguir} className="rounded-[3px] bg-[var(--tinta)] px-6 py-3.5 text-[16px] text-[var(--fondo)] hover:bg-black">
          Empezar el test
        </button>
        <span className="text-[14px] text-[var(--gris)]">Diez preguntas, una por pantalla.</span>
      </div>
    </div>
  );
}
