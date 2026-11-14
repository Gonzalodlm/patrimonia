"use client";

// Patrimonio proyectado año a año: banda entre el escenario malo y el bueno, y la línea del medio.
// Al pasar o tocar se ve el detalle de cada año.
import { useRef, useState } from "react";
import type { PuntoProyeccion } from "@/plan/patrimonio";
import { dolares } from "@/lib/formato";

const ANCHO = 640;
const ALTO = 320;
const M = { arriba: 24, derecha: 16, abajo: 40, izquierda: 68 };
// El dibujo se achica al ancho del celular: ahí la letra del gráfico va más grande para que se lea.
const LETRA = "tabular fill-[var(--gris)] text-[21px] sm:text-[13px]";

const compacto = new Intl.NumberFormat("es-UY", { notation: "compact", maximumFractionDigits: 1 });

function escalaY(max: number) {
  const crudo = max / 4;
  const potencia = Math.pow(10, Math.floor(Math.log10(Math.max(crudo, 1))));
  const paso = [1, 2, 2.5, 5, 10].map((m) => m * potencia).find((p) => p >= crudo) ?? crudo;
  return { paso, tope: Math.max(paso, Math.ceil(max / paso) * paso) };
}

export function GraficoPatrimonio({ puntos, vencimientos }: { puntos: PuntoProyeccion[]; vencimientos: number[] }) {
  const [activo, setActivo] = useState<number | null>(null);
  const svg = useRef<SVGSVGElement>(null);
  const max = Math.max(...puntos.map((p) => p.bueno), 1);
  const { paso, tope } = escalaY(max);
  const n = puntos.length - 1;
  const x = (i: number) => M.izquierda + (i / Math.max(n, 1)) * (ANCHO - M.izquierda - M.derecha);
  const y = (v: number) => ALTO - M.abajo - (v / tope) * (ALTO - M.arriba - M.abajo);
  const linea = (campo: "malo" | "medio" | "bueno") => puntos.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p[campo]).toFixed(1)}`).join("");
  const banda =
    puntos.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.bueno).toFixed(1)}`).join("") +
    [...puntos].reverse().map((p, j) => `L${x(n - j).toFixed(1)},${y(p.malo).toFixed(1)}`).join("") +
    "Z";
  const marcasY = Array.from({ length: Math.round(tope / paso) + 1 }, (_, i) => i * paso);
  const cadaCuantos = n > 30 ? 10 : n > 12 ? 5 : n > 6 ? 2 : 1;

  const mover = (e: React.PointerEvent<SVGSVGElement>) => {
    const caja = svg.current!.getBoundingClientRect();
    const px = ((e.clientX - caja.left) / caja.width) * ANCHO;
    const i = Math.round(((px - M.izquierda) / (ANCHO - M.izquierda - M.derecha)) * n);
    setActivo(Math.max(0, Math.min(n, i)));
  };
  const p = activo === null ? null : puntos[activo];

  return (
    <div>
      <div className="relative">
        <svg
          ref={svg}
          viewBox={`0 0 ${ANCHO} ${ALTO}`}
          className="block h-auto w-full touch-pan-y select-none"
          role="img"
          aria-label="Patrimonio proyectado año a año, con el rango entre el escenario malo y el bueno"
          onPointerMove={mover}
          onPointerDown={mover}
          onPointerLeave={() => setActivo(null)}
        >
          {marcasY.map((v) => (
            <g key={v}>
              <line x1={M.izquierda} x2={ANCHO - M.derecha} y1={y(v)} y2={y(v)} stroke="var(--linea)" strokeWidth={1} />
              <text x={M.izquierda - 8} y={y(v)} dy="0.32em" textAnchor="end" className={LETRA}>
                {compacto.format(v)}
              </text>
            </g>
          ))}
          {puntos.map((pt, i) =>
            i % cadaCuantos === 0 ? (
              <text key={pt.anio} x={x(i)} y={ALTO - M.abajo + 28} textAnchor={i === 0 ? "start" : i === n ? "end" : "middle"} className={LETRA}>
                {pt.anio}
              </text>
            ) : null,
          )}
          {vencimientos.map((anio) => {
            const i = puntos.findIndex((pt) => pt.anio === anio);
            return i < 0 ? null : <line key={anio} x1={x(i)} x2={x(i)} y1={ALTO - M.abajo} y2={ALTO - M.abajo + 6} stroke="var(--tinta)" strokeWidth={1.5} />;
          })}
          <path d={banda} fill="var(--acento)" opacity={0.1} />
          <path d={linea("malo")} fill="none" stroke="var(--acento)" strokeWidth={1} opacity={0.45} />
          <path d={linea("bueno")} fill="none" stroke="var(--acento)" strokeWidth={1} opacity={0.45} />
          <path d={linea("medio")} fill="none" stroke="var(--acento)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          {p && activo !== null && (
            <g>
              <line x1={x(activo)} x2={x(activo)} y1={M.arriba} y2={ALTO - M.abajo} stroke="var(--tinta)" strokeWidth={1} opacity={0.3} />
              <circle cx={x(activo)} cy={y(p.medio)} r={4.5} fill="var(--acento)" stroke="var(--fondo)" strokeWidth={2} />
            </g>
          )}
        </svg>
        {p && activo !== null && (
          <div
            className="tabular pointer-events-none absolute top-0 rounded-[3px] border border-[var(--linea)] bg-[var(--fondo)] px-3 py-2 text-[13px] shadow-sm"
            style={{ left: `${(x(activo) / ANCHO) * 100}%`, transform: `translateX(${activo > n / 2 ? "-105%" : "5%"})` }}
          >
            <p className="text-[var(--tinta)]">
              {p.anio}
              {p.edad ? ` · ${p.edad} años` : ""}
            </p>
            <p className="text-[var(--gris)]">Bueno {dolares(p.bueno)}</p>
            <p className="text-[var(--tinta)]">Medio {dolares(p.medio)}</p>
            <p className="text-[var(--gris)]">Malo {dolares(p.malo)}</p>
          </div>
        )}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-[var(--gris)]">
        <li className="inline-flex items-center gap-2">
          <span className="inline-block h-[2px] w-5 bg-[var(--acento)]" aria-hidden /> Escenario medio
        </li>
        <li className="inline-flex items-center gap-2">
          <span className="inline-block h-3 w-5 bg-[var(--acento)] opacity-15" aria-hidden /> Entre el malo y el bueno (8 de cada 10 casos)
        </li>
        <li className="inline-flex items-center gap-2">
          <span className="inline-block h-1.5 w-[1.5px] bg-[var(--tinta)]" aria-hidden /> Años en que se usa la plata de un objetivo
        </li>
      </ul>
      <details className="mt-2 text-[14px]">
        <summary className="cursor-pointer py-3 text-[var(--gris)] hover:text-[var(--tinta)]">Ver los valores en una tabla</summary>
        <div className="mt-3 max-h-80 overflow-auto">
          <table className="tabular w-full text-left">
            <thead className="sticky top-0 bg-[var(--fondo)]">
              <tr className="border-b border-[var(--linea)] text-[var(--gris)]">
                <th className="py-1.5 pr-3 font-normal">Año</th>
                <th className="py-1.5 pr-3 text-right font-normal">Malo</th>
                <th className="py-1.5 pr-3 text-right font-normal">Medio</th>
                <th className="py-1.5 text-right font-normal">Bueno</th>
              </tr>
            </thead>
            <tbody>
              {puntos.map((pt) => (
                <tr key={pt.anio} className="border-b border-[var(--linea)]">
                  <td className="py-1.5 pr-3">
                    {pt.anio}
                    {pt.edad ? <span className="text-[var(--gris)]"> · {pt.edad}</span> : null}
                  </td>
                  <td className="py-1.5 pr-3 text-right">{dolares(pt.malo)}</td>
                  <td className="py-1.5 pr-3 text-right">{dolares(pt.medio)}</td>
                  <td className="py-1.5 text-right">{dolares(pt.bueno)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
