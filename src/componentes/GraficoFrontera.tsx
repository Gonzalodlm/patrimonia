// Gráfico de la frontera eficiente: riesgo (volatilidad) contra retorno compuesto esperado.
// SVG propio, sin librerías. Se dibuja en el servidor; la versión interactiva va en el plan.
import type { DatosGenerados } from "@/motor/generado";
import { numero } from "@/lib/formato";

const ANCHO = 480;
const ALTO = 360;
const M = { arriba: 30, derecha: 92, abajo: 52, izquierda: 40 };

interface Props {
  datos: DatosGenerados;
  /** Mostrar las clases de activo como puntos. */
  conClases?: boolean;
  titulo: string;
}

export function GraficoFrontera({ datos, conClases = true, titulo }: Props) {
  const div = datos.carteras.diversificada;
  const sim = datos.carteras.simple;
  const clases = datos.clases.filter((c) => div.clases.includes(c.id));

  const xMax = 24;
  const yMin = 3;
  const yMax = 9;
  const x = (v: number) => M.izquierda + (v / xMax) * (ANCHO - M.izquierda - M.derecha);
  const y = (r: number) => ALTO - M.abajo - ((r - yMin) / (yMax - yMin)) * (ALTO - M.arriba - M.abajo);
  const camino = (puntos: { volatilidad: number; retornoCompuesto: number }[]) =>
    puntos.map((p, i) => `${i ? "L" : "M"}${x(p.volatilidad).toFixed(1)},${y(p.retornoCompuesto).toFixed(1)}`).join("");

  const finDiv = div.frontera.at(-1)!;
  const finSim = sim.frontera.at(-1)!;
  const marcasX = [0, 5, 10, 15, 20];
  const marcasY = [3, 5, 7, 9];

  return (
    <figure className="w-full">
      <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} className="block h-auto w-full" role="img" aria-labelledby="frontera-titulo">
        <title id="frontera-titulo">{titulo}</title>
        {/* Grilla y ejes, recesivos */}
        {marcasY.map((r) => (
          <g key={r}>
            <line x1={M.izquierda} x2={ANCHO - M.derecha} y1={y(r)} y2={y(r)} stroke="var(--linea)" strokeWidth={1} />
            <text x={M.izquierda - 8} y={y(r)} dy="0.32em" textAnchor="end" className="tabular fill-[var(--gris)] text-[19px] sm:text-[15px]">
              {r}%
            </text>
          </g>
        ))}
        {marcasX.map((v) => (
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

        {/* Clases de activo: puntos grises con anillo del color del fondo */}
        {conClases &&
          clases.map((c) => (
            <circle
              key={c.id}
              cx={x(c.volatilidad)}
              cy={y(c.retornoCompuesto)}
              r={4}
              fill="var(--gris-claro)"
              stroke="var(--fondo)"
              strokeWidth={2}
              opacity={0.75}
            >
              <title>{`${c.nombre}: retorno ${numero(c.retornoCompuesto, 1)}%, riesgo ${numero(c.volatilidad, 1)}%`}</title>
            </circle>
          ))}

        {/* Frontera simple (contexto) y diversificada (protagonista) */}
        <path d={camino(sim.frontera)} fill="none" stroke="var(--gris-claro)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <path d={camino(div.frontera)} fill="none" stroke="var(--acento)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {/* Etiquetas directas al final de cada línea */}
        <circle cx={x(finDiv.volatilidad)} cy={y(finDiv.retornoCompuesto)} r={4} fill="var(--acento)" stroke="var(--fondo)" strokeWidth={2} />
        <text x={x(finDiv.volatilidad) + 10} y={y(finDiv.retornoCompuesto)} dy="0.32em" className="fill-[var(--tinta)] text-[16px]">
          Diversificada
        </text>
        <circle cx={x(finSim.volatilidad)} cy={y(finSim.retornoCompuesto)} r={4} fill="var(--gris-claro)" stroke="var(--fondo)" strokeWidth={2} />
        <text x={x(finSim.volatilidad) + 10} y={y(finSim.retornoCompuesto)} dy="0.32em" className="fill-[var(--gris)] text-[16px]">
          Simple
        </text>
      </svg>
      <figcaption className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-[var(--gris)]">
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-[2px] w-5 bg-[var(--acento)]" aria-hidden /> Frontera con {div.clases.length} clases de activo
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-[2px] w-5 bg-[var(--gris-claro)]" aria-hidden /> Frontera con 2 (acciones y bonos globales)
        </span>
        {conClases && (
          <span className="inline-flex items-center gap-2">
            <span className="inline-block size-2 rounded-full bg-[var(--gris-claro)] opacity-75" aria-hidden /> Cada clase de activo por separado
          </span>
        )}
      </figcaption>
    </figure>
  );
}
