"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import type { DatosGenerados } from "@/motor/generado";
import { calcularPerfil, faltantes, type Cuestionario } from "@/plan/perfil";
import type { ListaEtfs } from "@/plan/etfs";
import { tienda, type EstadoPlan } from "./estado";
import { Explicacion } from "./Explicacion";
import { Test } from "./Test";
import { Cartera } from "./Cartera";
import { Situacion } from "./Situacion";
import { PlanPatrimonial } from "./PlanPatrimonial";
import type { Criterios } from "@/plan/patrimonio";

const PASOS = ["Antes de empezar", "Tu perfil", "Tu situación", "Tu cartera", "Tu plan"];

interface Props {
  datos: DatosGenerados;
  cuestionario: Cuestionario;
  etfs: ListaEtfs;
  criterios: Criterios;
}

const sinCambios = () => () => {};

export function Plan({ datos, cuestionario, etfs, criterios }: Props) {
  // En el servidor: estado inicial y el año anterior a la edición de los supuestos. En el navegador: lo guardado y el año real.
  const estado = useSyncExternalStore(tienda.suscribir, tienda.obtener, tienda.inicial);
  const setEstado = tienda.cambiar;
  const anioActual = useSyncExternalStore(sinCambios, () => new Date().getFullYear(), () => datos.fuente.edicion - 1);
  const sinGuardar = useSyncExternalStore(sinCambios, () => !tienda.puedeGuardar(), () => false);
  const arriba = useRef<HTMLDivElement>(null);
  const pasoAnterior = useRef(estado.paso);

  useEffect(() => {
    if (pasoAnterior.current !== estado.paso) arriba.current?.scrollIntoView({ block: "start" });
    pasoAnterior.current = estado.paso;
  }, [estado.paso]);

  const ids = datos.perfiles.map((p) => p.id);
  const testCompleto = faltantes(cuestionario, estado.respuestas).length === 0;
  const perfilTest = testCompleto ? calcularPerfil(cuestionario, estado.respuestas, ids).perfil : null;
  const perfil =
    perfilTest && estado.perfilElegido && ids.indexOf(estado.perfilElegido) <= ids.indexOf(perfilTest) ? estado.perfilElegido : perfilTest;

  const actualizar = (cambios: Partial<EstadoPlan>) => setEstado((e) => ({ ...e, ...cambios }));
  const irAPaso = (paso: number) => actualizar({ paso });
  const alcanzable = (paso: number) => paso <= 1 || testCompleto;

  return (
    <div ref={arriba} className="scroll-mt-4">
      {/* Barra de avance */}
      <nav aria-label="Pasos del plan" className="border-b border-[var(--linea)]">
        <ol className="flex gap-6 overflow-x-auto pb-3 text-[14px] [scrollbar-width:none]">
          {PASOS.map((nombre, i) => {
            const actual = estado.paso === i;
            return (
              <li key={nombre} className="shrink-0">
                <button
                  type="button"
                  onClick={() => alcanzable(i) && irAPaso(i)}
                  disabled={!alcanzable(i)}
                  aria-current={actual ? "step" : undefined}
                  className={`tabular border-b-2 pb-3 ${actual ? "border-[var(--acento)] text-[var(--tinta)]" : "border-transparent text-[var(--gris)] hover:text-[var(--tinta)] disabled:text-[var(--gris-claro)] disabled:hover:text-[var(--gris-claro)]"}`}
                >
                  <span className="mr-1.5 text-[12px]">{String(i + 1).padStart(2, "0")}</span>
                  {nombre}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
      {sinGuardar && (
        <p className="mt-4 text-[14px] text-[var(--gris)]">Tu navegador no permite guardar el avance: si cerrás la página, se pierde lo cargado.</p>
      )}

      <div className="pt-10 sm:pt-14">
        {estado.paso === 0 && <Explicacion datos={datos} onSeguir={() => irAPaso(1)} />}

        {estado.paso === 1 && (
          <Test
            cuestionario={cuestionario}
            datos={datos}
            pregunta={estado.pregunta}
            respuestas={estado.respuestas}
            perfilElegido={estado.perfilElegido}
            onResponder={(p, o) => setEstado((e) => ({ ...e, respuestas: { ...e.respuestas, [p]: o } }))}
            onIrA={(n) => actualizar({ pregunta: Math.max(0, Math.min(n, cuestionario.preguntas.length)) })}
            onElegirPerfil={(p) => actualizar({ perfilElegido: p })}
            onSeguir={() => irAPaso(2)}
          />
        )}

        {estado.paso === 2 && (
          <Situacion
            situacion={estado.situacion}
            objetivos={estado.objetivos}
            criterios={criterios}
            mesesColchon={
              Object.entries(criterios.fondoEmergencia.respuestasInestables).some(([p, ops]) => ops.includes(estado.respuestas[p]))
                ? criterios.fondoEmergencia.mesesSiIngresosInestables
                : criterios.fondoEmergencia.meses
            }
            anioActual={anioActual}
            onSituacion={(situacion) =>
              // El monto de "qué puede pasar" de la cartera arranca en los ahorros que la persona cargó.
              setEstado((e) => ({ ...e, situacion, monto: situacion.ahorros && situacion.ahorros !== e.situacion.ahorros ? situacion.ahorros : e.monto }))
            }
            onObjetivos={(objetivos) => actualizar({ objetivos })}
            onSeguir={() => irAPaso(3)}
          />
        )}

        {estado.paso === 3 &&
          (perfil ? (
            <Cartera
              datos={datos}
              etfs={etfs}
              perfil={perfil}
              motivoPerfil={perfil !== perfilTest ? "eleccion" : calcularPerfil(cuestionario, estado.respuestas, ids).limitante}
              tipo={estado.tipoCartera}
              monto={estado.monto}
              elegidos={estado.etfs}
              onTipo={(tipoCartera) => actualizar({ tipoCartera })}
              onMonto={(monto) => actualizar({ monto })}
              onEtf={(clase, isin) => setEstado((e) => ({ ...e, etfs: { ...e.etfs, [clase]: isin } }))}
            />
          ) : (
            <Pendiente titulo="Primero, tu perfil" onSeguir={() => irAPaso(1)} boton="Ir al test">
              Para armar tu cartera necesitamos saber tu perfil de riesgo.
            </Pendiente>
          ))}

        {estado.paso === 4 &&
          (perfil ? (
            <PlanPatrimonial
              datos={datos}
              etfs={etfs}
              criterios={criterios}
              perfil={perfil}
              tipo={estado.tipoCartera}
              elegidos={estado.etfs}
              situacion={estado.situacion}
              objetivos={estado.objetivos}
              respuestas={estado.respuestas}
              anioActual={anioActual}
              onIrASituacion={() => irAPaso(2)}
            />
          ) : (
            <Pendiente titulo="Primero, tu perfil" onSeguir={() => irAPaso(1)} boton="Ir al test">
              Para armar tu plan necesitamos saber tu perfil de riesgo.
            </Pendiente>
          ))}

        {estado.paso === 4 && perfil && (
          <div className="mt-12 border-t border-[var(--linea)] pt-8">
            <button type="button" onClick={() => irAPaso(3)} className="text-[16px] text-[var(--gris)] hover:text-[var(--tinta)]">
              ← Volver a mi cartera
            </button>
          </div>
        )}

        {estado.paso === 3 && perfil && (
          <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--linea)] pt-8">
            <button type="button" onClick={() => irAPaso(1)} className="text-[16px] text-[var(--gris)] hover:text-[var(--tinta)]">
              ← Volver a mi perfil
            </button>
            <button type="button" onClick={() => irAPaso(4)} className="rounded-[3px] bg-[var(--tinta)] px-6 py-3.5 text-[16px] text-[var(--fondo)] hover:bg-black">
              Seguir a mi plan
            </button>
          </div>
        )}
      </div>

      <div className="mt-16 text-[13px] text-[var(--gris)]">
        <button
          type="button"
          onClick={() => {
            if (window.confirm("¿Borrar todo lo que cargaste y empezar de nuevo?")) {
              tienda.reiniciar();
            }
          }}
          className="underline decoration-[var(--linea)] underline-offset-4 hover:text-[var(--tinta)]"
        >
          Empezar de nuevo
        </button>
        <span className="ml-2">Lo que cargás queda solo en este navegador.</span>
      </div>
    </div>
  );
}

function Pendiente({ titulo, children, onSeguir, boton = "Seguir" }: { titulo: string; children: React.ReactNode; onSeguir: () => void; boton?: string }) {
  return (
    <div className="max-w-2xl">
      <h1 className="font-titular text-[40px] leading-tight sm:text-[52px]">{titulo}</h1>
      <p className="mt-5 text-[18px] leading-[1.6] text-[var(--gris)]">{children}</p>
      <button type="button" onClick={onSeguir} className="mt-8 rounded-[3px] bg-[var(--tinta)] px-6 py-3.5 text-[16px] text-[var(--fondo)] hover:bg-black">
        {boton}
      </button>
    </div>
  );
}
