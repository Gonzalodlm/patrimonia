"use client";

import { useState } from "react";
import type { DatosGenerados } from "@/motor/generado";
import { retornoCompuesto } from "@/motor/matematica";
import { costoPonderado, peorCaidaUnAnio, rangos } from "@/plan/proyecciones";
import { enlaceFicha, terDeReferencia, type ListaEtfs } from "@/plan/etfs";
import { avisos } from "@/lib/avisos";
import { dolares, numero } from "@/lib/formato";
import { BarraMezcla } from "./BarraMezcla";
import { FronteraInteractiva } from "./FronteraInteractiva";
import { colorDeGrupo, pesosPorGrupo } from "./grupos";
import type { TipoCartera } from "./estado";
import { TextoGenerado } from "./TextoGenerado";
import { datosCartera } from "@/textos/armar";
import { plantillaCartera } from "@/textos/plantillas";

interface Props {
  datos: DatosGenerados;
  etfs: ListaEtfs;
  perfil: string;
  /** Qué definió el perfil (ver DatosTextoCartera.motivoPerfil). */
  motivoPerfil: string;
  tipo: TipoCartera;
  monto: number;
  elegidos: Record<string, string>;
  onTipo: (t: TipoCartera) => void;
  onMonto: (m: number) => void;
  onEtf: (clase: string, isin: string) => void;
}

export function Cartera({ datos, etfs, perfil, motivoPerfil, tipo, monto, elegidos, onTipo, onMonto, onEtf }: Props) {
  const c = datos.carteras[tipo];
  const cp = c.perfiles[perfil];
  const nombrePerfil = datos.perfiles.find((p) => p.id === perfil)!.nombre;
  const clases = datos.clases.filter((x) => c.clases.includes(x.id));
  const ter = Object.fromEntries(c.clases.map((id) => [id, terDeReferencia(etfs, id, elegidos[id])]));
  const costo = costoPonderado(cp.pesos, ter);
  const todosElegidos = c.clases.every((id) => (cp.pesos[id] ?? 0) < 0.05 || elegidos[id]);
  const aritNeto = cp.retornoAritmetico - costo;
  const compNeto = retornoCompuesto(aritNeto, cp.volatilidad);
  const tabla = rangos(monto, aritNeto, cp.volatilidad);
  const caida = peorCaidaUnAnio(monto, aritNeto, cp.volatilidad);
  const filas = clases.filter((x) => (cp.pesos[x.id] ?? 0) >= 0.05).sort((a, b) => cp.pesos[b.id] - cp.pesos[a.id]);
  const indicePerfil = datos.perfiles.findIndex((p) => p.id === perfil);
  // Lo que se le manda al modelo: números de la cartera tipo, sin el monto de la persona.
  const datosTexto = datosCartera({
    perfil: nombrePerfil,
    cartera: tipo,
    retorno: compNeto,
    riesgo: cp.volatilidad,
    sharpe: cp.sharpe,
    grupos: pesosPorGrupo(cp.pesos, clases),
    principales: filas.map((f) => ({ nombre: f.nombre, peso: cp.pesos[f.id] })),
    caidaPorcentaje: peorCaidaUnAnio(100, aritNeto, cp.volatilidad),
    riesgoMaximoSharpe: c.maximoSharpe.volatilidad,
    motivoPerfil,
  });

  return (
    <div>
      <p className="rotulo">Tu cartera</p>
      <h1 className="font-titular mt-3 text-[40px] leading-[1.05] tracking-[-0.015em] sm:text-[56px]">
        Perfil {nombrePerfil.toLowerCase()}, cartera {c.nombre.toLowerCase()}.
      </h1>

      {/* Simple o diversificada */}
      <div className="mt-8 inline-flex rounded-[3px] border border-[var(--linea)] p-1" role="radiogroup" aria-label="Tipo de cartera">
        {(["simple", "diversificada"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={tipo === t}
            onClick={() => onTipo(t)}
            className={`rounded-[2px] px-4 py-2 text-[15px] ${tipo === t ? "bg-[var(--tinta)] text-[var(--fondo)]" : "text-[var(--gris)] hover:text-[var(--tinta)]"}`}
          >
            {datos.carteras[t].nombre}
          </button>
        ))}
      </div>
      <p className="mt-3 max-w-[62ch] text-[16px] text-[var(--gris)]">
        {c.descripcion}{" "}
        {tipo === "simple"
          ? "Es más fácil de armar y mantener: dos ETFs."
          : `Con los supuestos de este año, rinde unos ${numero(cp.retornoCompuesto - datos.carteras.simple.perfiles[perfil].retornoCompuesto, 1)} puntos más por año que la simple, con el mismo riesgo.`}
      </p>

      {/* Los tres números */}
      <dl className="tabular mt-12 grid gap-8 border-t border-[var(--tinta)] pt-6 sm:grid-cols-3">
        <div>
          <dt className="text-[14px] text-[var(--gris)]">Retorno esperado por año</dt>
          <dd className="font-titular mt-2 text-[48px] leading-none [font-variant-numeric:lining-nums]">{numero(compNeto, 1)}%</dd>
          <dd className="mt-3 text-[14px] leading-[1.5] text-[var(--gris)]">
            Ya descontado lo que cobran los ETFs ({todosElegidos ? "" : "en promedio, "}
            {numero(costo, 2)}% por año). No incluye comisiones del broker ni impuestos.
          </dd>
        </div>
        <div>
          <dt className="text-[14px] text-[var(--gris)]">Riesgo (volatilidad)</dt>
          <dd className="font-titular mt-2 text-[48px] leading-none [font-variant-numeric:lining-nums]">{numero(cp.volatilidad, 1)}%</dd>
          <dd className="mt-3 text-[14px] leading-[1.5] text-[var(--gris)]">
            Cuánto oscila: en dos de cada tres años el resultado queda a menos de {numero(cp.volatilidad, 0)} puntos del promedio.
          </dd>
        </div>
        <div>
          <dt className="text-[14px] text-[var(--gris)]">Ratio de Sharpe</dt>
          <dd className="font-titular mt-2 text-[48px] leading-none [font-variant-numeric:lining-nums]">{numero(cp.sharpe, 2)}</dd>
          <dd className="mt-3 text-[14px] leading-[1.5] text-[var(--gris)]">Retorno extra por cada punto de riesgo, comparado con la liquidez en dólares.</dd>
        </div>
      </dl>

      {/* Por qué esta cartera */}
      <section className="mt-14 max-w-[64ch]">
        <h2 className="font-titular text-[30px] leading-tight">Por qué esta cartera</h2>
        <div className="mt-4">
          <TextoGenerado pedido={{ tipo: "cartera", datos: datosTexto }} plantilla={plantillaCartera(datosTexto)} />
        </div>
      </section>

      {/* Mezcla y ETFs */}
      <section className="mt-16">
        <h2 className="font-titular text-[30px] leading-tight">Qué hay adentro</h2>
        <div className="mt-6">
          <BarraMezcla pesos={cp.pesos} clases={clases} />
        </div>
        <p className="mt-8 max-w-[62ch] text-[15px] leading-[1.6] text-[var(--gris)]">
          Para cada clase de activo hay algunos ETFs de ejemplo, ordenados por emisor. Ninguno es una recomendación: elegí el que te
          resulte más fácil de comprar donde invertís. Los datos se verificaron en justETF el {etfs.verificado.split("-").reverse().join("/")}.
        </p>
        <ul className="mt-4 border-b border-[var(--linea)]">
          {filas.map((clase) => (
            <FilaClase
              key={clase.id}
              nombre={clase.nombre}
              color={colorDeGrupo(clase.tipo)}
              peso={cp.pesos[clase.id]}
              monto={(monto * cp.pesos[clase.id]) / 100}
              opciones={etfs.clases[clase.id]}
              elegido={elegidos[clase.id]}
              onElegir={(isin) => onEtf(clase.id, isin)}
            />
          ))}
        </ul>
      </section>

      {/* Dónde cae en la frontera */}
      <section className="mt-16 grid gap-10 lg:grid-cols-2 lg:gap-14">
        <div className="max-w-[56ch]">
          <h2 className="font-titular text-[30px] leading-tight">Dónde cae en la frontera</h2>
          <p className="mt-4 text-[17px] leading-[1.6] text-[var(--gris)]">
            Tu cartera es el punto de la frontera {c.nombre.toLowerCase()} con un riesgo de {numero(cp.volatilidad, 0)}%: la de mayor
            retorno esperado sin pasar ese riesgo.
          </p>
          {indicePerfil >= 3 && (
            <p className="mt-4 text-[17px] leading-[1.6] text-[var(--gris)]">
              Fijate que arriba de cierto riesgo la línea casi no sube: asumir más riesgo no siempre paga más.
            </p>
          )}
          <p className="mt-4 text-[17px] leading-[1.6] text-[var(--gris)]">
            La de máximo Sharpe tiene {numero(c.maximoSharpe.volatilidad, 1)}% de riesgo. No es la de todos: cada perfil se ubica donde le
            corresponde.
          </p>
        </div>
        <FronteraInteractiva
          frontera={c.frontera}
          elegido={{ volatilidad: cp.volatilidad, retorno: cp.retornoCompuesto }}
          marcas={[{ volatilidad: c.maximoSharpe.volatilidad, retorno: c.maximoSharpe.retornoCompuesto, etiqueta: "Máximo Sharpe" }]}
          titulo={`Frontera ${c.nombre.toLowerCase()} con tu cartera marcada`}
        />
      </section>

      {/* Qué puede pasar */}
      <section className="mt-16">
        <h2 className="font-titular text-[30px] leading-tight">Qué puede pasar con tu plata</h2>
        <label className="mt-6 flex max-w-sm flex-col gap-2 text-[15px] text-[var(--gris)]">
          Si invertís
          <span className="flex items-center rounded-[3px] border border-[var(--linea)] bg-white/50 focus-within:border-[var(--tinta)]">
            <span className="pl-3 text-[var(--gris)]">USD</span>
            <input
              inputMode="numeric"
              className="tabular w-full bg-transparent px-2 py-3 text-[20px] text-[var(--tinta)] outline-none"
              value={numero(monto, 0)}
              onChange={(e) => {
                const valor = Number(e.target.value.replace(/\D/g, ""));
                onMonto(Math.min(valor, 100_000_000));
              }}
            />
          </span>
        </label>
        <div className="mt-6 overflow-x-auto">
          <table className="tabular w-full min-w-[480px] text-left text-[16px]">
            <thead>
              <tr className="border-b border-[var(--tinta)] text-[14px] text-[var(--gris)]">
                <th className="py-2 pr-4 font-normal">Dentro de</th>
                <th className="py-2 pr-4 text-right font-normal">Escenario malo</th>
                <th className="py-2 pr-4 text-right font-normal">Escenario medio</th>
                <th className="py-2 text-right font-normal">Escenario bueno</th>
              </tr>
            </thead>
            <tbody>
              {tabla.map((r) => (
                <tr key={r.anios} className="border-b border-[var(--linea)]">
                  <td className="py-3 pr-4">{r.anios === 1 ? "1 año" : `${r.anios} años`}</td>
                  <td className="py-3 pr-4 text-right">{dolares(r.malo)}</td>
                  <td className="py-3 pr-4 text-right text-[var(--tinta)]">{dolares(r.medio)}</td>
                  <td className="py-3 text-right">{dolares(r.bueno)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-8 max-w-[62ch] border-l-2 border-[var(--acento)] pl-5 text-[17px] leading-[1.6]">
          En un año malo de verdad, de esos que pasan 1 vez cada 20, esta cartera podría perder{" "}
          <span className="tabular">{dolares(caida)}</span> o más
          {monto > 0 ? ` (${numero((caida / monto) * 100, 0)}% de lo invertido)` : ""}. Si esa cifra te quitaría el sueño, elegí un perfil
          más conservador.
        </p>
      </section>

      {/* Mantenimiento */}
      <section className="mt-16 max-w-[62ch]">
        <h2 className="font-titular text-[30px] leading-tight">Cómo mantenerla</h2>
        <p className="mt-4 text-[17px] leading-[1.6] text-[var(--gris)]">
          Con el tiempo, lo que más sube pasa a pesar más que lo planeado. Una vez por año, o antes si alguna clase se aleja más de 5
          puntos de su peso, volvé a los porcentajes de arriba: vendé un poco de lo que creció de más y comprá de lo que quedó atrás. Si
          seguís ahorrando, alcanza con poner la plata nueva en lo que quedó atrás.
        </p>
      </section>

      <Avisos />
    </div>
  );
}

function FilaClase({
  nombre,
  color,
  peso,
  monto,
  opciones,
  elegido,
  onElegir,
}: {
  nombre: string;
  color: string;
  peso: number;
  monto: number;
  opciones: ListaEtfs["clases"][string] | undefined;
  elegido: string | undefined;
  onElegir: (isin: string) => void;
}) {
  const [abierta, setAbierta] = useState(false);
  const elegidoEtf = opciones?.etfs.find((e) => e.isin === elegido);
  return (
    <li className="border-t border-[var(--linea)]">
      <button type="button" onClick={() => setAbierta(!abierta)} aria-expanded={abierta} className="tabular grid w-full grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-1 py-4 text-left">
        <span className="size-2.5 rounded-[2px]" style={{ background: color }} aria-hidden />
        <span className="text-[16px] leading-snug">
          {nombre}
          <span className="block text-[14px] text-[var(--gris)]">{elegidoEtf ? `${elegidoEtf.ticker} · ${elegidoEtf.emisor}` : opciones?.etfs.length === 1 ? "1 opción de ETF" : `${opciones?.etfs.length ?? 0} opciones de ETF`}</span>
        </span>
        <span className="text-right">
          <span className="text-[18px]">{numero(peso, 1)}%</span>
          <span className="block text-[14px] text-[var(--gris)]">{dolares(monto)}</span>
        </span>
      </button>
      {abierta && opciones && (
        <div className="pb-5 pl-[1.375rem]">
          {opciones.nota && <p className="mb-3 max-w-[62ch] text-[14px] leading-[1.55] text-[var(--gris)]">{opciones.nota}</p>}
          <div role="radiogroup" aria-label={`ETFs para ${nombre}`} className="space-y-2">
            {opciones.etfs.map((e) => {
              const activo = e.isin === elegido;
              return (
                <div
                  key={e.isin}
                  className={`flex flex-col gap-2 rounded-[3px] border p-3 sm:flex-row sm:items-center sm:justify-between ${activo ? "border-[var(--tinta)]" : "border-[var(--linea)]"}`}
                >
                  <button type="button" role="radio" aria-checked={activo} onClick={() => onElegir(e.isin)} className="flex items-start gap-3 text-left">
                    <span aria-hidden className="mt-1 grid size-4 shrink-0 place-items-center rounded-full border border-[var(--gris-claro)]">
                      {activo && <span className="size-2 rounded-full bg-[var(--tinta)]" />}
                    </span>
                    <span>
                      <span className="block text-[15px] leading-snug">{e.nombre}</span>
                      <span className="tabular mt-0.5 block text-[13px] text-[var(--gris)]">
                        {e.ticker} ({e.bolsa}) · ISIN {e.isin} · {e.tipo} · {e.politica === "acumula" ? "Acumula" : "Distribuye"} · Costo{" "}
                        {numero(e.ter, 2)}% anual
                      </span>
                    </span>
                  </button>
                  <a
                    href={enlaceFicha(e.isin)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 pl-7 text-[13px] text-[var(--gris)] underline decoration-[var(--linea)] underline-offset-4 hover:text-[var(--tinta)] sm:pl-0"
                  >
                    Ver ficha
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </li>
  );
}

export function Avisos() {
  return (
    <aside className="mt-20 border-t border-[var(--linea)] pt-6">
      <p className="rotulo">Avisos</p>
      <ul className="mt-4 grid gap-x-10 gap-y-3 text-[13px] leading-[1.55] text-[var(--gris)] sm:grid-cols-2">
        {avisos.map((a) => (
          <li key={a.titulo}>
            <span className="text-[var(--tinta)]">{a.titulo}.</span> {a.texto}
          </li>
        ))}
      </ul>
    </aside>
  );
}
