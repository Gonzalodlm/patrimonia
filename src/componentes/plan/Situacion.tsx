"use client";

import { useState } from "react";
import type { CategoriaObjetivo, Criterios, Deuda, Objetivo, Prioridad, Situacion as TSituacion, TipoDeuda } from "@/plan/patrimonio";
import { dolares, numero } from "@/lib/formato";
import { CampoNumero, Selector } from "./Campos";

const nuevoId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

const atajos: { categoria: CategoriaObjetivo; nombre: string; enAnios: number; prioridad: Prioridad }[] = [
  { categoria: "emergencia", nombre: "Fondo de emergencia", enAnios: 1, prioridad: "imprescindible" },
  { categoria: "casa", nombre: "Casa", enAnios: 10, prioridad: "importante" },
  { categoria: "auto", nombre: "Auto", enAnios: 5, prioridad: "deseable" },
  { categoria: "educacion", nombre: "Educación de los hijos", enAnios: 15, prioridad: "imprescindible" },
  { categoria: "viaje", nombre: "Viaje", enAnios: 2, prioridad: "deseable" },
  { categoria: "retiro", nombre: "Retiro", enAnios: 30, prioridad: "imprescindible" },
  { categoria: "otro", nombre: "Otro objetivo", enAnios: 5, prioridad: "importante" },
];

const prioridades: { valor: Prioridad; texto: string }[] = [
  { valor: "imprescindible", texto: "Imprescindible" },
  { valor: "importante", texto: "Importante" },
  { valor: "deseable", texto: "Deseable" },
];

const tiposDeuda: { valor: TipoDeuda; texto: string }[] = [
  { valor: "tarjeta", texto: "Tarjeta de crédito" },
  { valor: "prestamo_personal", texto: "Préstamo personal" },
  { valor: "hipoteca", texto: "Hipoteca" },
  { valor: "otra", texto: "Otra" },
];

interface Props {
  situacion: TSituacion;
  objetivos: Objetivo[];
  criterios: Criterios;
  mesesColchon: number;
  anioActual: number;
  onSituacion: (s: TSituacion) => void;
  onObjetivos: (o: Objetivo[]) => void;
  onSeguir: () => void;
}

export function Situacion({ situacion: s, objetivos, criterios, mesesColchon, anioActual, onSituacion, onObjetivos, onSeguir }: Props) {
  const cambiar = (c: Partial<TSituacion>) => onSituacion({ ...s, ...c });
  const cambiarDeuda = (id: string, c: Partial<Deuda>) => cambiar({ deudas: s.deudas.map((d) => (d.id === id ? { ...d, ...c } : d)) });
  const cambiarObjetivo = (id: string, c: Partial<Objetivo>) => onObjetivos(objetivos.map((o) => (o.id === id ? { ...o, ...c } : o)));

  const agregar = (a: (typeof atajos)[number]) => {
    let anio = anioActual + a.enAnios;
    let monto = 0;
    if (a.categoria === "retiro" && s.edad) anio = anioActual + Math.max(1, criterios.retiro.edadDeRetiroSugerida - s.edad);
    if (a.categoria === "emergencia" && s.gastos) monto = s.gastos * mesesColchon;
    onObjetivos([...objetivos, { id: nuevoId(), categoria: a.categoria, nombre: a.nombre, monto, anio, prioridad: a.prioridad }]);
  };

  const faltan: string[] = [];
  if (!s.edad) faltan.push("tu edad");
  if (s.ahorroMensual === null) faltan.push("cuánto podés ahorrar por mes");
  const objetivosInvalidos = objetivos.filter((o) => o.monto <= 0 || o.anio <= anioActual || o.anio > anioActual + 70);

  return (
    <div className="max-w-3xl">
      <p className="rotulo">Tu situación</p>
      <h1 className="font-titular mt-3 text-[40px] leading-[1.05] tracking-[-0.015em] sm:text-[52px]">Dónde estás y adónde querés llegar.</h1>
      <p className="mt-5 max-w-[60ch] text-[17px] leading-[1.6] text-[var(--gris)]">
        Todo en dólares. Si algo lo tenés en pesos, pasalo a dólares al tipo de cambio de hoy. Estos datos se guardan solo en tu
        navegador: Patrimonia no los guarda en ningún servidor.
      </p>

      <section className="mt-12">
        <h2 className="font-titular text-[28px] leading-tight">Tu situación</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <CampoNumero id="edad" etiqueta="Edad" requerido sufijo="años" max={110} valor={s.edad} onCambio={(edad) => cambiar({ edad })} />
          <CampoNumero
            id="ahorro"
            etiqueta="Cuánto podés ahorrar por mes"
            requerido
            prefijo="USD"
            valor={s.ahorroMensual}
            onCambio={(ahorroMensual) => cambiar({ ahorroMensual })}
          />
          <CampoNumero id="ingresos" etiqueta="Ingresos por mes" prefijo="USD" valor={s.ingresos} onCambio={(ingresos) => cambiar({ ingresos })} />
          <CampoNumero
            id="gastos"
            etiqueta="Gastos por mes"
            ayuda="Lo usamos para calcular tu fondo de emergencia."
            prefijo="USD"
            valor={s.gastos}
            onCambio={(gastos) => cambiar({ gastos })}
          />
          <CampoNumero id="ahorros" etiqueta="Ahorros que ya tenés" prefijo="USD" valor={s.ahorros} onCambio={(ahorros) => cambiar({ ahorros })} />
        </div>

        <h3 className="mt-10 text-[17px]">
          Deudas <span className="text-[var(--gris)]">(opcional)</span>
        </h3>
        <div className="mt-4 space-y-4">
          {s.deudas.map((d) => (
            <div key={d.id} className="grid gap-4 rounded-[3px] border border-[var(--linea)] p-4 sm:grid-cols-[1.2fr_1fr_0.8fr_auto] sm:items-end">
              <Selector id={`tipo-${d.id}`} etiqueta="Tipo" valor={d.tipo} opciones={tiposDeuda} onCambio={(tipo) => cambiarDeuda(d.id, { tipo })} />
              <CampoNumero id={`saldo-${d.id}`} etiqueta="Lo que debés" requerido prefijo="USD" valor={d.saldo || null} onCambio={(v) => cambiarDeuda(d.id, { saldo: v ?? 0 })} />
              <CampoNumero id={`tasa-${d.id}`} etiqueta="Tasa anual" sufijo="%" decimales max={500} valor={d.tasa} onCambio={(tasa) => cambiarDeuda(d.id, { tasa })} />
              <button type="button" onClick={() => cambiar({ deudas: s.deudas.filter((x) => x.id !== d.id) })} className="toque justify-center text-[15px] text-[var(--gris)] hover:text-[var(--tinta)] sm:text-[14px]">
                Quitar
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => cambiar({ deudas: [...s.deudas, { id: nuevoId(), tipo: "tarjeta", saldo: 0, tasa: null }] })}
            className="min-h-11 w-full rounded-[3px] border border-[var(--linea)] px-4 py-2.5 text-[15px] hover:border-[var(--tinta)] sm:w-auto"
          >
            + Agregar una deuda
          </button>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="font-titular text-[28px] leading-tight">Tus objetivos</h2>
        <p className="mt-3 max-w-[60ch] text-[16px] leading-[1.6] text-[var(--gris)]">
          Agregá los que quieras. El monto va en dólares de hoy: nosotros lo ajustamos por la inflación de EE.UU. hasta la fecha. Si no
          cargás un fondo de emergencia, lo calculamos con tus gastos ({mesesColchon} meses).
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {atajos.map((a) => (
            <button key={a.categoria} type="button" onClick={() => agregar(a)} className="min-h-11 rounded-[3px] border border-[var(--linea)] px-3.5 py-2 text-[15px] hover:border-[var(--tinta)]">
              + {a.nombre}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-4">
          {objetivos.map((o) => (
            <TarjetaObjetivo
              key={o.id}
              o={o}
              anioActual={anioActual}
              multiplicador={criterios.retiro.multiplicadorGastoAnual}
              onCambio={(c) => cambiarObjetivo(o.id, c)}
              onQuitar={() => onObjetivos(objetivos.filter((x) => x.id !== o.id))}
            />
          ))}
        </div>
      </section>

      <div className="mt-14 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-[var(--linea)] pt-8">
        <button
          type="button"
          onClick={onSeguir}
          disabled={faltan.length > 0 || objetivosInvalidos.length > 0}
          className="w-full rounded-[3px] bg-[var(--tinta)] px-6 py-3.5 text-[16px] text-[var(--fondo)] hover:bg-black sm:w-auto disabled:cursor-not-allowed disabled:opacity-40"
        >
          Ver mi cartera
        </button>
        {faltan.length > 0 && <span className="text-[14px] text-[var(--gris)]">Falta {faltan.join(" y ")}.</span>}
        {faltan.length === 0 && objetivosInvalidos.length > 0 && (
          <span className="text-[14px] text-[var(--gris)]">Revisá los objetivos: cada uno necesita un monto y un año futuro.</span>
        )}
      </div>
    </div>
  );
}

function TarjetaObjetivo({
  o,
  anioActual,
  multiplicador,
  onCambio,
  onQuitar,
}: {
  o: Objetivo;
  anioActual: number;
  multiplicador: number;
  onCambio: (c: Partial<Objetivo>) => void;
  onQuitar: () => void;
}) {
  const [gastoRetiro, setGastoRetiro] = useState<number | null>(null);
  const anioInvalido = o.anio <= anioActual || o.anio > anioActual + 70;
  return (
    <div className="rounded-[3px] border border-[var(--linea)] p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <label className="block w-full min-w-0">
          <span className="sr-only">Nombre del objetivo</span>
          <input
            value={o.nombre}
            maxLength={60}
            onChange={(e) => onCambio({ nombre: e.target.value })}
            className="font-titular h-11 w-full border-b border-transparent bg-transparent text-[22px] leading-tight text-ellipsis outline-none focus:border-[var(--linea)] sm:text-[24px]"
          />
        </label>
        <button type="button" onClick={onQuitar} className="toque shrink-0 pl-2 text-[15px] text-[var(--gris)] hover:text-[var(--tinta)] sm:text-[14px]">
          Quitar
        </button>
      </div>

      {o.categoria === "retiro" && (
        <div className="mt-4 rounded-[3px] bg-[var(--fondo-hundido)] p-4">
          <CampoNumero
            id={`gasto-retiro-${o.id}`}
            etiqueta="¿Cuánto querés gastar por mes cuando te retires?"
            ayuda="En dólares de hoy. Te sugerimos un capital con la regla del 4%."
            prefijo="USD"
            valor={gastoRetiro}
            onCambio={(v) => {
              setGastoRetiro(v);
              if (v) onCambio({ monto: v * 12 * multiplicador });
            }}
          />
          {gastoRetiro ? (
            <p className="tabular mt-3 text-[14px] leading-[1.55] text-[var(--gris)]">
              Capital sugerido: {dolares(gastoRetiro)} × 12 × {multiplicador} = <span className="text-[var(--tinta)]">{dolares(gastoRetiro * 12 * multiplicador)}</span>.
              Con ese capital, retirar 4% por año históricamente alcanzó para unos 30 años. No cuenta la jubilación del BPS ni de la AFAP:
              si la vas a cobrar, restá lo que esperes recibir por mes.
            </p>
          ) : null}
        </div>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <CampoNumero id={`monto-${o.id}`} etiqueta="Monto, en dólares de hoy" requerido prefijo="USD" valor={o.monto || null} onCambio={(v) => onCambio({ monto: v ?? 0 })} />
        <div>
          <CampoNumero id={`anio-${o.id}`} etiqueta="Año en que lo necesitás" requerido sinMiles valor={o.anio} max={anioActual + 100} onCambio={(v) => onCambio({ anio: v ?? anioActual })} />
          {anioInvalido ? (
            <p className="mt-1 text-[13px] text-[var(--acento)]">Tiene que ser entre {anioActual + 1} y {anioActual + 70}.</p>
          ) : (
            <p className="tabular mt-1 text-[13px] text-[var(--gris)]">Dentro de {numero(o.anio - anioActual, 0)} {o.anio - anioActual === 1 ? "año" : "años"}.</p>
          )}
        </div>
        <Selector id={`prioridad-${o.id}`} etiqueta="Prioridad" valor={o.prioridad} opciones={prioridades} onCambio={(prioridad) => onCambio({ prioridad })} />
      </div>
    </div>
  );
}
