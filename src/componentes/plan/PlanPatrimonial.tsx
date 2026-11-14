"use client";

import { useMemo, useState } from "react";
import type { DatosGenerados } from "@/motor/generado";
import { armarPlan, type Criterios, type Objetivo, type ResultadoObjetivo, type ResultadoPlan, type Situacion } from "@/plan/patrimonio";
import { carterasResumen } from "@/plan/carterasResumen";
import type { ListaEtfs } from "@/plan/etfs";
import { nombreDeuda, proximosPasos } from "@/plan/pasos";
import { descargarPdf, type ContenidoPdf } from "@/plan/pdf";
import { avisoCorto } from "@/lib/avisos";
import { dolares, fechaLarga, numero, porcentaje } from "@/lib/formato";
import { datosPlan } from "@/textos/armar";
import { plantillaPlan } from "@/textos/plantillas";
import { GraficoPatrimonio } from "./GraficoPatrimonio";
import { Avisos } from "./Cartera";
import { TextoGenerado } from "./TextoGenerado";
import { Suscripcion } from "./Suscripcion";
import type { TipoCartera } from "./estado";

const nombrePrioridad: Record<string, string> = { imprescindible: "Imprescindible", importante: "Importante", deseable: "Deseable" };
const textoEstado = { cubierto: "Cubierto", parcial: "Cubierto a medias", sin_cubrir: "Sin cubrir" } as const;
const simboloEstado = { cubierto: "●", parcial: "◐", sin_cubrir: "○" } as const;

interface Props {
  datos: DatosGenerados;
  etfs: ListaEtfs;
  criterios: Criterios;
  perfil: string;
  tipo: TipoCartera;
  elegidos: Record<string, string>;
  situacion: Situacion;
  objetivos: Objetivo[];
  respuestas: Record<string, string>;
  anioActual: number;
  onIrASituacion: () => void;
}

export function PlanPatrimonial(props: Props) {
  const { datos, etfs, criterios, perfil, tipo, elegidos, situacion, objetivos, respuestas, anioActual } = props;
  const carteras = useMemo(() => carterasResumen(datos, etfs, tipo, elegidos), [datos, etfs, tipo, elegidos]);
  const plan = useMemo(
    () =>
      armarPlan({
        situacion,
        objetivos,
        perfil,
        perfiles: datos.perfiles.map((p) => p.id),
        carteras,
        criterios,
        respuestasTest: respuestas,
        anioActual,
        inflacion: datos.inflacionEEUU,
      }),
    [situacion, objetivos, perfil, datos, carteras, criterios, respuestas, anioActual],
  );
  const [textoResumen, setTextoResumen] = useState("");
  const [generandoPdf, setGenerandoPdf] = useState(false);

  if (plan.faltanDatos.length) {
    return (
      <div className="max-w-2xl">
        <h1 className="font-titular text-[40px] leading-tight sm:text-[52px]">Falta un dato.</h1>
        <p className="mt-5 text-[18px] leading-[1.6] text-[var(--gris)]">Para armar tu plan necesitamos {plan.faltanDatos.join(" y ")}.</p>
        <button type="button" onClick={props.onIrASituacion} className="mt-8 w-full rounded-[3px] bg-[var(--tinta)] px-6 py-3.5 text-[16px] text-[var(--fondo)] hover:bg-black sm:w-auto">
          Completar mi situación
        </button>
      </div>
    );
  }

  const nombrePerfil = datos.perfiles.find((p) => p.id === perfil)!.nombre;
  const cubiertos = plan.objetivos.filter((o) => o.estado === "cubierto").length;
  const juntado = plan.juntado;
  const pasos = proximosPasos(plan, situacion).map((p) => p.texto);
  const deudasACancelar = plan.deudas.filter((d) => d.cancelarPrimero);
  const datosTexto = datosPlan(plan, situacion, nombrePerfil);

  const descargar = async () => {
    setGenerandoPdf(true);
    try {
      await descargarPdf(
        contenidoPdf({ datos, etfs, perfil, nombrePerfil, tipo, elegidos, situacion, plan, pasos, resumen: textoResumen || plantillaPlan(datosTexto), carteras }),
      );
    } finally {
      setGenerandoPdf(false);
    }
  };
  let n = 0;
  const numerar = () => String(++n).padStart(2, "0");

  return (
    <div>
      <p className="rotulo">Tu plan</p>
      <h1 className="font-titular mt-3 text-[38px] leading-[1.05] tracking-[-0.015em] sm:text-[56px]">Qué hacer con tu plata, y en qué orden.</h1>

      {/* Resumen de una página */}
      <section className="mt-8 border border-[var(--tinta)] p-4 sm:mt-10 sm:p-8" aria-labelledby="resumen">
        <h2 id="resumen" className="rotulo">
          Resumen
        </h2>
        <dl className="tabular mt-5 grid grid-cols-2 gap-x-5 gap-y-5 sm:grid-cols-4 sm:gap-x-8">
          <Dato titulo="Perfil" valor={nombrePerfil} detalle={`Cartera ${datos.carteras[tipo].nombre.toLowerCase()}`} />
          <Dato titulo="Ahorro por mes" valor={dolares(situacion.ahorroMensual ?? 0)} detalle={plan.sobranteMensual > 1 ? `Te sobran ${dolares(plan.sobranteMensual)}` : undefined} />
          <Dato titulo="Objetivos cubiertos" valor={`${cubiertos} de ${plan.objetivos.length}`} detalle={plan.aporteFaltanteTotal > 1 ? `Faltan ${dolares(plan.aporteFaltanteTotal)} por mes` : undefined} />
          <Dato
            titulo={`Vas a juntar hasta ${juntado.anio}`}
            valor={dolares(juntado.medio)}
            detalle={`Entre ${dolares(juntado.malo)} y ${dolares(juntado.bueno)}${juntado.usado > 1 ? ". Cuenta lo que usás en tus objetivos" : ""}`}
          />
        </dl>
        <div className="mt-8 max-w-[68ch] border-t border-[var(--linea)] pt-6">
          <h3 className="text-[17px]">En pocas palabras</h3>
          <div className="mt-3">
            <TextoGenerado pedido={{ tipo: "plan", datos: datosTexto }} plantilla={plantillaPlan(datosTexto)} onTexto={setTextoResumen} />
          </div>
        </div>
        <h3 className="mt-8 text-[17px]">Tus próximos tres pasos</h3>
        <ol className="mt-3 space-y-3">
          {pasos.map((p, i) => (
            <li key={p} className="grid grid-cols-[2rem_1fr] text-[16px] leading-[1.55]">
              <span className="font-titular text-[22px] leading-none">{i + 1}</span>
              <span>{p}</span>
            </li>
          ))}
        </ol>
        <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2">
          <button
            type="button"
            onClick={descargar}
            disabled={generandoPdf}
            className="w-full rounded-[3px] bg-[var(--tinta)] px-5 py-3.5 text-[16px] text-[var(--fondo)] hover:bg-black disabled:opacity-50 sm:w-auto sm:py-3 sm:text-[15px]"
          >
            {generandoPdf ? "Armando el PDF…" : "Descargar mi plan en PDF"}
          </button>
          <span className="text-[13px] text-[var(--gris)]">Se arma en tu navegador: no se envía a ningún servidor.</span>
        </div>
      </section>

      {/* 1. Colchón */}
      <Bloque numero={numerar()} titulo="Colchón primero">
        {plan.colchon.automatico ? (
          plan.colchon.objetivo === null ? (
            <p>
              No cargaste tus gastos por mes, así que no podemos calcular tu fondo de emergencia. Te recomendamos tener entre 3 y 6 meses de
              gastos en liquidez antes de invertir.{" "}
              <button type="button" onClick={props.onIrASituacion} className="text-[var(--tinta)] underline decoration-[var(--linea)] underline-offset-4">
                Cargar mis gastos
              </button>
            </p>
          ) : (
            <>
              <p>
                Antes de invertir, tené {plan.colchon.meses} meses de gastos guardados en liquidez en dólares:{" "}
                <span className="tabular text-[var(--tinta)]">{dolares(plan.colchon.objetivo)}</span>.{" "}
                {plan.colchon.meses === 6
                  ? "Son 6 y no 3 porque tus ingresos varían o tenés personas a cargo."
                  : "Con ingresos estables y sin personas a cargo, alcanza con 3."}
              </p>
              <p className="mt-3">
                {plan.colchon.faltante <= 0
                  ? "Con tus ahorros ya lo tenés completo."
                  : plan.colchon.mesesParaCompletar === null
                    ? `Te faltan ${dolares(plan.colchon.faltante)}.`
                    : `${plan.colchon.conAhorros > 0 ? `Con tus ahorros cubrís ${dolares(plan.colchon.conAhorros)}. ` : ""}Te faltan ${dolares(plan.colchon.faltante)}: con tu ahorro mensual lo completás en ${plan.colchon.mesesParaCompletar} ${plan.colchon.mesesParaCompletar === 1 ? "mes" : "meses"}, y recién después empezás con los objetivos.`}
              </p>
            </>
          )
        ) : (
          <p>Cargaste tu propio fondo de emergencia: va primero, antes que cualquier otro objetivo, y se guarda en liquidez.</p>
        )}
      </Bloque>

      {/* 2. Deudas */}
      {plan.deudas.length > 0 && (
        <Bloque numero={numerar()} titulo="Tus deudas">
          <ul className="space-y-4">
            {plan.deudas.map((d) => (
              <li key={d.deuda.id}>
                <span className="text-[var(--tinta)]">
                  {d.cancelarPrimero ? "Cancelá" : "Seguí pagando normalmente"} {nombreDeuda[d.deuda.tipo]} ({dolares(d.deuda.saldo)}
                  {d.deuda.tasa !== null ? `, ${numero(d.deuda.tasa, 1)}% anual` : ""})
                  {d.cancelarPrimero ? " antes de invertir." : "."}
                </span>{" "}
                {d.motivo}
                {d.pagadoConAhorros > 0 && ` Usá ${dolares(d.pagadoConAhorros)} de tus ahorros para eso.`}
              </li>
            ))}
          </ul>
          {deudasACancelar.length > 0 && plan.mesesAntesDeObjetivos !== null && plan.mesesAntesDeObjetivos > 0 && (
            <p className="mt-4">
              Entre el colchón y estas deudas, tu ahorro de los primeros {plan.mesesAntesDeObjetivos} meses va a eso. Los aportes a tus objetivos
              empiezan después.
            </p>
          )}
          {plan.mesesAntesDeObjetivos === null && (
            <p className="mt-4 text-[var(--tinta)]">
              Con tu ahorro mensual actual no alcanza para cancelar estas deudas. Antes de invertir, conviene revisar tus gastos o
              renegociarlas.
            </p>
          )}
        </Bloque>
      )}

      {/* 3. Objetivos */}
      <Bloque numero={numerar()} titulo="Una cartera para cada objetivo">
        {plan.objetivos.length === 0 ? (
          <p>
            No cargaste objetivos. Tu ahorro va entero a tu cartera de largo plazo.{" "}
            <button type="button" onClick={props.onIrASituacion} className="text-[var(--tinta)] underline decoration-[var(--linea)] underline-offset-4">
              Agregar objetivos
            </button>
          </p>
        ) : (
          <>
            <p>
              La plata que vas a usar pronto no puede estar en algo que oscila mucho. Por eso cada objetivo tiene su cartera según el plazo,
              sin pasar nunca tu perfil:
            </p>
            <ul className="tabular mt-3 space-y-1 text-[15px]">
              {criterios.plazos.map((t) => (
                <li key={t.texto}>· {t.texto}</li>
              ))}
            </ul>
            <div className="mt-8 space-y-4">
              {plan.objetivos.map((o) => (
                <TarjetaResultado key={o.objetivo.id} r={o} />
              ))}
            </div>
            <p className="mt-6 text-[14px]">
              Los aportes se calcularon con el retorno esperado de cada cartera, ya descontado lo que cobran los ETFs. La probabilidad sale de
              simular 500 escenarios de mercado y es aproximada.
            </p>
          </>
        )}
      </Bloque>

      {/* 4. Si no alcanza */}
      {plan.aporteFaltanteTotal > 1 && (
        <Bloque numero={numerar()} titulo="La plata no alcanza para todo">
          <p>
            Con tu ahorro de {dolares(situacion.ahorroMensual ?? 0)} por mes cubrimos primero lo imprescindible, después lo importante y al
            final lo deseable; dentro de cada grupo, lo que vence antes. Para cubrir todo te faltarían{" "}
            <span className="tabular text-[var(--tinta)]">{dolares(plan.aporteFaltanteTotal)} por mes</span>.
          </p>
          <p className="mt-3">Hay tres caminos, y se pueden combinar: ahorrar más, darle más tiempo a algún objetivo o bajar su monto. Cada tarjeta de arriba dice cuánto en cada caso.</p>
        </Bloque>
      )}
      {plan.sobranteMensual > 1 && plan.objetivos.length > 0 && (
        <p className="mt-6 max-w-[62ch] border-l-2 border-[var(--acento)] pl-5 text-[16px] leading-[1.6]">
          Después de cubrir tus objetivos te sobran <span className="tabular">{dolares(plan.sobranteMensual)}</span> por mes. Si los invertís en
          tu cartera {nombrePerfil.toLowerCase()}, suman a tu patrimonio de largo plazo (ya están incluidos en la proyección de abajo).
        </p>
      )}

      {/* 5. Patrimonio proyectado */}
      <Bloque numero={numerar()} titulo="Tu patrimonio, año a año">
        <p>
          Todo lo que tenés invertido, sumando el colchón y cada objetivo, en dólares de hoy (ya descontada la inflación de EE.UU. de{" "}
          {numero(datos.inflacionEEUU, 1)}% anual). Las bajadas son los años en que usás la plata de un objetivo; el retiro no baja, porque es el capital con el que te retirás.
        </p>
        <div className="mt-6 max-w-none">
          <GraficoPatrimonio puntos={plan.proyeccion} vencimientos={plan.objetivos.filter((o) => o.objetivo.categoria !== "retiro").map((o) => o.objetivo.anio)} />
        </div>
        <p className="mt-4 text-[14px]">
          La banda supone que todas tus carteras suben y bajan al mismo tiempo, así que exagera un poco el rango: es una aproximación
          prudente. No incluye la jubilación del BPS ni de la AFAP, ni tu vivienda.
        </p>
      </Bloque>

      <section className="mt-16 border-t border-[var(--linea)] pt-10">
        <Suscripcion />
      </section>

      <Avisos />
    </div>
  );
}

const textoEstadoPdf = { cubierto: "Cubierto", parcial: "A medias", sin_cubrir: "Sin cubrir" } as const;

function contenidoPdf(a: {
  datos: DatosGenerados;
  etfs: ListaEtfs;
  perfil: string;
  nombrePerfil: string;
  tipo: TipoCartera;
  elegidos: Record<string, string>;
  situacion: Situacion;
  plan: ResultadoPlan;
  pasos: string[];
  resumen: string;
  carteras: ReturnType<typeof carterasResumen>;
}): ContenidoPdf {
  const { datos, plan } = a;
  const c = datos.carteras[a.tipo];
  const cp = c.perfiles[a.perfil];
  const neta = a.carteras[a.perfil];
  const nombreClase = new Map(datos.clases.map((x) => [x.id, x.nombre]));
  const hoy = new Date();
  const colchon = plan.colchon;
  return {
    titulo: "Tu plan patrimonial",
    subtitulo: `Generado el ${hoy.getDate()}/${hoy.getMonth() + 1}/${hoy.getFullYear()}. Supuestos: ${datos.fuente.nombre}, edición ${datos.fuente.edicion}, con datos al ${fechaLarga(datos.fuente.fechaDatos)}.`,
    nombreArchivo: "plan-patrimonia.pdf",
    avisos: avisoCorto,
    secciones: [
      {
        titulo: "Resumen",
        parrafos: [
          `Perfil ${a.nombrePerfil.toLowerCase()}, cartera ${c.nombre.toLowerCase()}. Ahorro de ${dolares(a.situacion.ahorroMensual ?? 0)} por mes. Objetivos cubiertos: ${plan.objetivos.filter((o) => o.estado === "cubierto").length} de ${plan.objetivos.length}. Hasta ${plan.juntado.anio} vas a juntar ${dolares(plan.juntado.medio)} en dólares de hoy (entre ${dolares(plan.juntado.malo)} y ${dolares(plan.juntado.bueno)})${plan.juntado.usado > 1 ? ", contando lo que usás en tus objetivos" : ""}.`,
          a.resumen.replace(/\n+/g, " "),
        ],
      },
      { titulo: "Tus próximos tres pasos", lista: a.pasos },
      {
        titulo: `Tu cartera de largo plazo (perfil ${a.nombrePerfil.toLowerCase()})`,
        parrafos: [
          `Retorno esperado ${porcentaje(neta.retornoCompuesto, 1)} por año (neto de lo que cobran los ETFs, sin comisiones del broker ni impuestos). Riesgo ${porcentaje(cp.volatilidad, 1)}. Ratio de Sharpe ${numero(cp.sharpe, 2)}. Rebalanceo: una vez por año, o si una clase se aleja más de 5 puntos de su peso.`,
        ],
        tabla: {
          columnas: ["Clase de activo", "Peso", "ETF"],
          anchos: [3, 0.9, 2.6],
          derecha: [1],
          filas: c.clases
            .filter((id) => (cp.pesos[id] ?? 0) >= 0.05)
            .sort((x, y) => cp.pesos[y] - cp.pesos[x])
            .map((id) => {
              const opciones = a.etfs.clases[id]?.etfs ?? [];
              const e = opciones.find((x) => x.isin === a.elegidos[id]);
              // Si la persona no eligió, van las opciones que muestra la web para esa clase.
              const etf = e ? `${e.ticker} (${e.isin})` : opciones.length ? `Opciones: ${opciones.map((x) => x.ticker).join(", ")}` : "Sin opciones cargadas";
              return [nombreClase.get(id) ?? id, porcentaje(cp.pesos[id], 1), etf];
            }),
        },
      },
      {
        titulo: "Colchón y deudas",
        parrafos: [
          !colchon.automatico
            ? "Cargaste tu propio fondo de emergencia: va primero y se guarda en liquidez."
            : colchon.objetivo === null
              ? "No cargaste tus gastos: separá entre 3 y 6 meses de gastos en liquidez antes de invertir."
              : `Fondo de emergencia: ${dolares(colchon.objetivo)} (${colchon.meses} meses de gastos) en liquidez en dólares. ${colchon.faltante > 0 ? `Faltan ${dolares(colchon.faltante)}.` : "Ya está cubierto."}`,
          ...plan.deudas.map(
            (d) => `${d.cancelarPrimero ? "Cancelar antes de invertir" : "Seguir pagando normalmente"}: ${nombreDeuda[d.deuda.tipo]} (${dolares(d.deuda.saldo)}). ${d.motivo}`,
          ),
        ],
      },
      ...(plan.objetivos.length
        ? [
            {
              titulo: "Tus objetivos",
              tabla: {
                columnas: ["Objetivo", "Año", "Cartera", "Monto (USD de hoy)", "Ahorro por mes", "Probabilidad", "Estado"],
                anchos: [2.2, 0.8, 1.6, 1.4, 1.3, 1.1, 1],
                derecha: [1, 3, 4, 5],
                filas: plan.objetivos.map((o) => [
                  o.objetivo.nombre || "Objetivo",
                  String(o.objetivo.anio),
                  o.cartera.nombre,
                  dolares(o.objetivo.monto),
                  dolares(o.aporte),
                  porcentaje(o.probabilidad * 100, 0),
                  textoEstadoPdf[o.estado],
                ]),
              },
              notas:
                plan.aporteFaltanteTotal > 1
                  ? [`Para cubrir todos los objetivos faltan ${dolares(plan.aporteFaltanteTotal)} por mes: se puede ahorrar más, esperar más o bajar algún monto.`]
                  : undefined,
            },
          ]
        : []),
      {
        titulo: "Patrimonio proyectado (en dólares de hoy)",
        parrafos: [
          "Lo que tenés invertido cada año, sumando el colchón y la plata de cada objetivo. Baja en los años en que usás la plata de un objetivo. No incluye la jubilación ni la vivienda. Las columnas Malo y Bueno marcan el rango en el que cae 8 de cada 10 veces.",
        ],
        tabla: {
          columnas: ["Año", "Edad", "Malo", "Medio", "Bueno"],
          derecha: [1, 2, 3, 4],
          filas: plan.proyeccion
            .filter((p, i, todos) => i % 5 === 0 || i === todos.length - 1)
            .map((p) => [String(p.anio), p.edad ? String(p.edad) : "", dolares(p.malo), dolares(p.medio), dolares(p.bueno)]),
        },
      },
    ],
  };
}

function Dato({ titulo, valor, detalle }: { titulo: string; valor: string; detalle?: string }) {
  return (
    <div>
      <dt className="text-[13px] text-[var(--gris)]">{titulo}</dt>
      <dd className="mt-1 text-[20px] leading-tight sm:text-[22px]">{valor}</dd>
      {detalle && <dd className="mt-1 text-[13px] text-[var(--gris)]">{detalle}</dd>}
    </div>
  );
}

function Bloque({ numero: n, titulo, children }: { numero: string; titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-12 sm:mt-16">
      <p className="rotulo tabular">{n}</p>
      <h2 className="font-titular mt-2 text-[30px] leading-tight sm:text-[32px]">{titulo}</h2>
      <div className="mt-4 max-w-[68ch] text-[17px] leading-[1.6] text-[var(--gris)]">{children}</div>
    </section>
  );
}

function TarjetaResultado({ r }: { r: ResultadoObjetivo }) {
  const o = r.objetivo;
  const faltaPorMes = r.aporteNecesario === null ? null : Math.max(0, r.aporteNecesario - r.aporte);
  return (
    <article className="rounded-[3px] border border-[var(--linea)] p-4 text-[var(--tinta)] sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="font-titular text-[26px] leading-tight">{o.nombre || "Objetivo"}</h3>
        <p className="text-[14px]">
          <span aria-hidden className="mr-1.5">
            {simboloEstado[r.estado]}
          </span>
          {textoEstado[r.estado]}
        </p>
      </div>
      <p className="tabular mt-1 text-[14px] text-[var(--gris)]">
        {nombrePrioridad[o.prioridad]} · {o.anio}, dentro de {r.anios} {r.anios === 1 ? "año" : "años"} · {dolares(o.monto)} de hoy ({dolares(r.montoNominal)} de{" "}
        {o.anio})
      </p>
      <dl className="tabular mt-5 grid grid-cols-2 gap-x-5 gap-y-4 text-[15px] sm:grid-cols-3 sm:gap-x-6">
        <div>
          <dt className="text-[13px] text-[var(--gris)]">Cartera</dt>
          <dd className="mt-0.5">
            {r.cartera.nombre}
            <span className="block text-[13px] text-[var(--gris)]">
              {numero(r.cartera.retornoCompuesto, 1)}% por año · riesgo {numero(r.cartera.volatilidad, 1)}%
            </span>
          </dd>
        </div>
        <div>
          <dt className="text-[13px] text-[var(--gris)]">Ahorro para este objetivo</dt>
          <dd className="mt-0.5">
            {dolares(r.aporte)} por mes
            {r.conAhorros > 0 && <span className="block text-[13px] text-[var(--gris)]">más {dolares(r.conAhorros)} de tus ahorros hoy</span>}
          </dd>
        </div>
        <div>
          <dt className="text-[13px] text-[var(--gris)]">Probabilidad de llegar</dt>
          <dd className="mt-0.5">
            {r.probabilidad >= 0.995 ? "Casi segura" : `${numero(r.probabilidad * 100, 0)}%`}
            {r.aporte80 !== null && r.probabilidad < 0.8 && (
              <span className="block text-[13px] text-[var(--gris)]">Para 80%: {dolares(r.aporte80)} por mes</span>
            )}
          </dd>
        </div>
      </dl>
      {r.estado !== "cubierto" && (
        <div className="mt-5 border-t border-[var(--linea)] pt-4 text-[15px] leading-[1.6] text-[var(--gris)]">
          {r.aporteNecesario === null ? (
            <p>No queda tiempo para ahorrar para este objetivo antes de su fecha, después del colchón y las deudas. Conviene darle más tiempo.</p>
          ) : r.montoAlcanzable < 1 ? (
            <p>
              Tu ahorro de hoy se usa entero en objetivos con más prioridad o que vencen antes. Para cubrir este, necesitarías ahorrar{" "}
              <span className="tabular text-[var(--tinta)]">{dolares(faltaPorMes ?? 0)}</span> más por mes, o bajar el monto o la prioridad de
              otro objetivo.
            </p>
          ) : (
            <p>
              Con lo que alcanza llegás a unos <span className="tabular text-[var(--tinta)]">{dolares(r.montoAlcanzable)}</span> de hoy. Para cubrirlo
              entero: ahorrar <span className="tabular text-[var(--tinta)]">{dolares(faltaPorMes ?? 0)}</span> más por mes
              {r.aniosExtra ? (
                <>
                  , o esperar <span className="tabular text-[var(--tinta)]">{r.aniosExtra}</span> {r.aniosExtra === 1 ? "año" : "años"} más
                </>
              ) : null}
              , o bajar el monto a {dolares(r.montoAlcanzable)}.
            </p>
          )}
        </div>
      )}
    </article>
  );
}
