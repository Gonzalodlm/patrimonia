"use client";

// Frontera eficiente con un punto elegido. Si se pasa `onElegir`, tocar o arrastrar sobre el
// gráfico mueve el punto al lugar más cercano de la frontera.
import { useRef } from "react";
import type { PuntoFrontera } from "@/motor/generado";
import type { ClaseActivo } from "@/motor/tipos";
import { numero } from "@/lib/formato";

const ANCHO = 480;
const ALTO = 330;
const M = { arriba: 30, derecha: 16, abajo: 52, izquierda: 40 };
const X_MAX = 24;
const Y_MIN = 3;
const Y_MAX = 9;

const x = (v: number) => M.izquierda + (v / X_MAX) * (ANCHO - M.izquierda - M.derecha);
const y = (r: number) => ALTO - M.abajo - ((r - Y_MIN) / (Y_MAX - Y_MIN)) * (ALTO - M.arriba - M.abajo);

export interface Marca {
  volatilidad: number;
  retorno: number;
  etiqueta: string;
}

interface Props {
  frontera: PuntoFrontera[];
  clases?: ClaseActivo[];
  elegido: { volatilidad: number; retorno: number };
  marcas?: Marca[];
  onElegir?: (indice: number) => void;
  titulo: string;
}

export function FronteraInteractiva({ frontera, clases = [], elegido, marcas = [], onElegir, titulo }: Props) {
  const svg = useRef<SVGSVGElement>(null);
  const camino = frontera.map((p, i) => `${i ? "L" : "M"}${x(p.volatilidad).toFixed(1)},${y(p.retornoCompuesto).toFixed(1)}`).join("");

  function elegirDesdeEvento(e: React.PointerEvent<SVGSVGElement>) {
    if (!onElegir || !svg.current) return;
    const caja = svg.current.getBoundingClientRect();
    const px = ((e.clientX - caja.left) / caja.width) * ANCHO;
    let mejor = 0;
    for (let i = 1; i < frontera.length; i++) {
      if (Math.abs(x(frontera[i].volatilidad) - px) < Math.abs(x(frontera[mejor].volatilidad) - px)) mejor = i;
    }
    onElegir(mejor);
  }

  return (
    <svg
      ref={svg}
      viewBox={`0 0 ${ANCHO} ${ALTO}`}
      className={`block h-auto w-full select-none ${onElegir ? "cursor-pointer touch-none" : ""}`}
      role="img"
      aria-label={titulo}
      onPointerDown={(e) => {
        if (!onElegir) return;
        (e.target as Element).setPointerCapture?.(e.pointerId);
        elegirDesdeEvento(e);
      }}
      onPointerMove={(e) => e.buttons && elegirDesdeEvento(e)}
    >
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
        Riesgo →
      </text>
      <text x={M.izquierda - 8} y={M.arriba - 14} className="fill-[var(--gris)] text-[19px] sm:text-[15px]">
        ↑ Retorno esperado por año
      </text>

      {clases.map((c) => (
        <circle key={c.id} cx={x(c.volatilidad)} cy={y(c.retornoCompuesto)} r={3.5} fill="var(--gris-claro)" opacity={0.6} />
      ))}

      <path d={camino} fill="none" stroke="var(--tinta)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

      {marcas.map((m) => (
        <g key={m.etiqueta}>
          <circle cx={x(m.volatilidad)} cy={y(m.retorno)} r={4.5} fill="var(--fondo)" stroke="var(--tinta)" strokeWidth={2} />
          <text x={x(m.volatilidad) + 2} y={y(m.retorno) + 24} className="fill-[var(--gris)] text-[18px] sm:text-[14px]">
            {m.etiqueta}
          </text>
        </g>
      ))}

      <line x1={x(elegido.volatilidad)} x2={x(elegido.volatilidad)} y1={y(elegido.retorno)} y2={ALTO - M.abajo} stroke="var(--acento)" strokeWidth={1} opacity={0.35} />
      <circle cx={x(elegido.volatilidad)} cy={y(elegido.retorno)} r={7} fill="var(--acento)" stroke="var(--fondo)" strokeWidth={2.5} />
      <text
        x={Math.min(x(elegido.volatilidad), ANCHO - M.derecha - 4)}
        y={y(elegido.retorno) - 14}
        textAnchor={x(elegido.volatilidad) > ANCHO - 120 ? "end" : "middle"}
        className="tabular fill-[var(--tinta)] text-[19px] sm:text-[15px]"
      >
        {numero(elegido.retorno, 1)}%
      </text>
    </svg>
  );
}
