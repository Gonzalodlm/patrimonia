"use client";

// Riesgo contra retorno de cada clase de activo. Al tocar o pasar por un punto se ven su nombre
// y sus dos números. Cada punto es un botón, así que también se recorre con el teclado.
import { useState } from "react";
import type { ClaseActivo } from "@/motor/tipos";
import { numero } from "@/lib/formato";

const ANCHO = 480;
const ALTO = 340;
const M = { arriba: 30, derecha: 16, abajo: 52, izquierda: 40 };

export function GraficoClases({ clases }: { clases: ClaseActivo[] }) {
  const [elegida, setElegida] = useState<string>("acciones_eeuu_grandes");
  const actual = clases.find((c) => c.id === elegida) ?? clases[0];

  const xMax = 24;
  const yMin = 3;
  const yMax = 9;
  const x = (v: number) => M.izquierda + (v / xMax) * (ANCHO - M.izquierda - M.derecha);
  const y = (r: number) => ALTO - M.abajo - ((r - yMin) / (yMax - yMin)) * (ALTO - M.arriba - M.abajo);

  return (
    <div>
      <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} className="block h-auto w-full" role="group" aria-label="Riesgo y retorno esperado de cada clase de activo">
        {[3, 5, 7, 9].map((r) => (
          <g key={r}>
            <line x1={M.izquierda} x2={ANCHO - M.derecha} y1={y(r)} y2={y(r)} stroke="var(--linea)" strokeWidth={1} />
            <text x={M.izquierda - 8} y={y(r)} dy="0.32em" textAnchor="end" className="tabular fill-[var(--gris)] text-[19px] sm:text-[15px]">
              {r}%
            </text>
          </g>
        ))}
        {[0, 5, 10, 15, 20].map((v) => (
          <text key={v} x={x(v)} y={ALTO - M.abajo + 24} textAnchor="middle" className="tabular fill-[var(--gris)] text-[19px] sm:text-[15px]">
            {v}%
          </text>
        ))}
        <text x={ANCHO - M.derecha} y={ALTO - 4} textAnchor="end" className="fill-[var(--gris)] text-[19px] sm:text-[15px]">
          Riesgo: cuánto puede oscilar por año →
        </text>
        <text x={M.izquierda - 8} y={M.arriba - 14} className="fill-[var(--gris)] text-[19px] sm:text-[15px]">
          ↑ Retorno anual esperado
        </text>

        {clases.map((c) => {
          const activa = c.id === actual.id;
          return (
            <g
              key={c.id}
              role="button"
              tabIndex={0}
              aria-pressed={activa}
              aria-label={`${c.nombre}: retorno esperado ${numero(c.retornoCompuesto, 1)}% por año, riesgo ${numero(c.volatilidad, 1)}%`}
              onMouseEnter={() => setElegida(c.id)}
              onFocus={() => setElegida(c.id)}
              onClick={() => setElegida(c.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setElegida(c.id);
                }
              }}
              className="cursor-pointer outline-none [&:focus-visible>circle:last-child]:stroke-[var(--tinta)]"
            >
              {/* Área de toque más grande que el punto */}
              <circle cx={x(c.volatilidad)} cy={y(c.retornoCompuesto)} r={16} fill="transparent" />
              <circle
                cx={x(c.volatilidad)}
                cy={y(c.retornoCompuesto)}
                r={activa ? 7 : 5}
                fill={activa ? "var(--acento)" : "var(--gris-claro)"}
                stroke="var(--fondo)"
                strokeWidth={2}
              />
            </g>
          );
        })}
      </svg>

      <div className="mt-4 min-h-[5.5rem] border-t border-[var(--linea)] pt-4" aria-live="polite">
        <p className="text-[17px] leading-snug">{actual.nombre}</p>
        <p className="tabular mt-2 text-[15px] text-[var(--gris)]">
          Retorno esperado <span className="text-[var(--tinta)]">{numero(actual.retornoCompuesto, 1)}%</span> por año · Riesgo{" "}
          <span className="text-[var(--tinta)]">{numero(actual.volatilidad, 1)}%</span>
        </p>
      </div>

      <details className="mt-4 text-[15px]">
        <summary className="cursor-pointer py-3 text-[var(--gris)] hover:text-[var(--tinta)]">Ver los {clases.length} valores en una tabla</summary>
        <table className="tabular mt-3 w-full text-left text-[14px]">
          <thead>
            <tr className="border-b border-[var(--linea)] text-[var(--gris)]">
              <th className="py-2 pr-3 font-normal">Clase de activo</th>
              <th className="py-2 pr-3 text-right font-normal">Retorno</th>
              <th className="py-2 text-right font-normal">Riesgo</th>
            </tr>
          </thead>
          <tbody>
            {[...clases]
              .sort((a, b) => a.volatilidad - b.volatilidad)
              .map((c) => (
                <tr key={c.id} className="border-b border-[var(--linea)]">
                  <td className="py-1.5 pr-3">{c.nombre}</td>
                  <td className="py-1.5 pr-3 text-right">{numero(c.retornoCompuesto, 1)}%</td>
                  <td className="py-1.5 text-right">{numero(c.volatilidad, 1)}%</td>
                </tr>
              ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
