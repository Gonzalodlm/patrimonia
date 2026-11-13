// Barra segmentada: la cartera dividida en cuatro grupos. Cada bloque lleva su porcentaje adentro
// si entra; si no, el dato queda en la leyenda y en el nombre accesible de la barra.
import type { ClaseActivo } from "@/motor/tipos";
import { numero } from "@/lib/formato";
import { grupos, pesosPorGrupo } from "./grupos";

export function BarraMezcla({ pesos, clases }: { pesos: Record<string, number>; clases: ClaseActivo[] }) {
  const partes = pesosPorGrupo(pesos, clases);
  const descripcion = partes.map((p) => `${p.nombre} ${numero(p.peso, 0)}%`).join(", ");
  return (
    <div>
      <div className="flex h-7 w-full gap-[2px]" role="img" aria-label={`Mezcla de la cartera: ${descripcion}`}>
        {partes.map((p) => {
          if (p.peso < 0.05) return null;
          const g = grupos.find((x) => x.id === p.id)!;
          return (
            <div
              key={p.id}
              title={`${p.nombre}: ${numero(p.peso, 1)}%`}
              className="flex items-center overflow-hidden rounded-[4px] pl-2 transition-[flex-grow] duration-200"
              style={{ flexGrow: p.peso, flexBasis: 0, background: g.color, color: g.textoSobreColor }}
            >
              {p.peso >= 9 && <span className="tabular text-[13px] leading-none">{numero(p.peso, 0)}%</span>}
            </div>
          );
        })}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[14px] text-[var(--gris)]">
        {partes.map((p) => {
          const g = grupos.find((x) => x.id === p.id)!;
          return (
            <li key={p.id} className="inline-flex items-center gap-2">
              <span className="inline-block size-2.5 rounded-[2px]" style={{ background: g.color }} aria-hidden />
              {p.nombre} <span className="tabular text-[var(--tinta)]">{numero(p.peso, 0)}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
