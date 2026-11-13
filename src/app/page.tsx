// PÁGINA PROVISORIA DE LA FASE 1: muestra lo que calculó el motor para poder revisarlo.
// En la fase 2 se reemplaza por la landing.
import datos from "@datos/frontera.json";
import type { DatosGenerados } from "@/motor/generado";
import { porcentaje, numero } from "@/lib/formato";

const d = datos as DatosGenerados;
const nombreClase = new Map(d.clases.map((c) => [c.id, c.nombre]));

export default function Inicio() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Patrimonia: control del motor</h1>
      <p className="mt-2 text-[var(--gris)]">
        Página provisoria para revisar las carteras. Supuestos: {d.fuente.nombre}, edición {d.fuente.edicion}, datos al{" "}
        {d.fuente.fechaDatos}.
      </p>
      {d.ejemplo && (
        <p className="mt-4 border border-current px-3 py-2 font-semibold">
          Atención: estos son datos de ejemplo inventados, no los de J.P. Morgan.
        </p>
      )}

      {Object.entries(d.carteras).map(([id, c]) => (
        <section key={id} className="mt-12">
          <h2 className="text-2xl font-semibold">Cartera {c.nombre.toLowerCase()}</h2>
          <p className="mt-1 text-[var(--gris)]">{c.descripcion}</p>
          <p className="mt-1 text-sm text-[var(--gris)]">
            Frontera de {c.frontera.length} carteras, con volatilidad de {porcentaje(c.minima.volatilidad, 2)} a{" "}
            {porcentaje(c.maxima.volatilidad, 2)}. Máximo Sharpe: {numero(c.maximoSharpe.sharpe)} con volatilidad{" "}
            {porcentaje(c.maximoSharpe.volatilidad, 2)}.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="tabular w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-4 font-medium">Clase</th>
                  {d.perfiles.map((p) => (
                    <th key={p.id} className="py-2 pr-4 text-right font-medium">
                      {p.nombre}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {c.clases.map((clase) => (
                  <tr key={clase} className="border-b border-black/10">
                    <td className="py-1.5 pr-4">{nombreClase.get(clase)}</td>
                    {d.perfiles.map((p) => {
                      const peso = c.perfiles[p.id].pesos[clase] ?? 0;
                      return (
                        <td key={p.id} className="py-1.5 pr-4 text-right">
                          {peso >= 0.05 ? porcentaje(peso) : "–"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {(
                  [
                    ["Volatilidad", "volatilidad"],
                    ["Retorno aritmético", "retornoAritmetico"],
                    ["Retorno compuesto", "retornoCompuesto"],
                  ] as const
                ).map(([etiqueta, campo]) => (
                  <tr key={campo} className="font-medium">
                    <td className="py-1.5 pr-4">{etiqueta}</td>
                    {d.perfiles.map((p) => (
                      <td key={p.id} className="py-1.5 pr-4 text-right">
                        {porcentaje(c.perfiles[p.id][campo], 2)}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="font-medium">
                  <td className="py-1.5 pr-4">Ratio de Sharpe</td>
                  {d.perfiles.map((p) => (
                    <td key={p.id} className="py-1.5 pr-4 text-right">
                      {numero(c.perfiles[p.id].sharpe)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </main>
  );
}
