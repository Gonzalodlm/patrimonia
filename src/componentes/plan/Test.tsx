"use client";

import type { DatosGenerados } from "@/motor/generado";
import { calcularPerfil, type Cuestionario } from "@/plan/perfil";

const descripcionPerfil: Record<string, string> = {
  conservador: "Priorizás que tu plata no oscile. La cartera es casi toda renta fija y liquidez: rinde menos, pero en un año malo cae poco.",
  moderado_conservador:
    "Aceptás algo de oscilación a cambio de un poco más de retorno. La mayor parte sigue en renta fija, con una porción de acciones y otros activos.",
  moderado: "Buscás un equilibrio entre hacer crecer tu plata y no pasar sustos grandes. La cartera reparte el riesgo entre renta fija, acciones y otros activos.",
  moderado_agresivo: "Podés esperar y aguantar caídas importantes para buscar más retorno. Las acciones pasan a ser la parte más grande de la cartera.",
  agresivo: "Tu prioridad es que la plata crezca a muchos años, aunque en el camino haya caídas fuertes. La cartera es casi toda acciones y otros activos de riesgo.",
};

interface Props {
  cuestionario: Cuestionario;
  datos: DatosGenerados;
  pregunta: number;
  respuestas: Record<string, string>;
  perfilElegido: string | null;
  onResponder: (pregunta: string, opcion: string) => void;
  onIrA: (pregunta: number) => void;
  onElegirPerfil: (perfil: string) => void;
  onSeguir: () => void;
}

export function Test(props: Props) {
  const { cuestionario, pregunta } = props;
  if (pregunta >= cuestionario.preguntas.length) return <Resultado {...props} />;

  const p = cuestionario.preguntas[pregunta];
  const elegida = props.respuestas[p.id];
  return (
    <div className="max-w-2xl">
      <h1 className="sr-only">Test de perfil de riesgo</h1>
      <p className="rotulo tabular">
        Pregunta {pregunta + 1} de {cuestionario.preguntas.length}
      </p>
      <div className="mt-3 h-[2px] w-full bg-[var(--linea)]" aria-hidden>
        <div className="h-full bg-[var(--tinta)] transition-[width] duration-300" style={{ width: `${((pregunta + 1) / cuestionario.preguntas.length) * 100}%` }} />
      </div>

      <fieldset className="mt-8 sm:mt-10">
        <legend className="font-titular text-[30px] leading-[1.12] sm:text-[40px]">{p.texto}</legend>
        {p.ayuda && <p className="mt-4 text-[16px] leading-[1.55] text-[var(--gris)]">{p.ayuda}</p>}
        <div className="mt-8 space-y-3">
          {p.opciones.map((o) => {
            const activa = elegida === o.id;
            return (
              <button
                key={o.id}
                type="button"
                role="radio"
                aria-checked={activa}
                onClick={() => {
                  props.onResponder(p.id, o.id);
                  props.onIrA(pregunta + 1);
                }}
                className={`tabular flex w-full items-center gap-4 rounded-[3px] border px-5 py-4 text-left text-[17px] leading-snug transition-colors ${
                  activa ? "border-[var(--tinta)] bg-[var(--tinta)] text-[var(--fondo)]" : "border-[var(--linea)] bg-white/40 hover:border-[var(--tinta)]"
                }`}
              >
                <span
                  aria-hidden
                  className={`grid size-5 shrink-0 place-items-center rounded-full border ${activa ? "border-[var(--fondo)]" : "border-[var(--gris-claro)]"}`}
                >
                  {activa && <span className="size-2.5 rounded-full bg-[var(--fondo)]" />}
                </span>
                {o.texto}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-6 flex items-center justify-between sm:mt-10">
        <button
          type="button"
          onClick={() => props.onIrA(pregunta - 1)}
          disabled={pregunta === 0}
          className="toque pr-4 text-[16px] text-[var(--gris)] hover:text-[var(--tinta)] disabled:invisible"
        >
          ← Anterior
        </button>
        {elegida && (
          <button type="button" onClick={() => props.onIrA(pregunta + 1)} className="toque pl-4 text-[16px] text-[var(--gris)] hover:text-[var(--tinta)]">
            Siguiente →
          </button>
        )}
      </div>
    </div>
  );
}

function Resultado({ cuestionario, datos, respuestas, perfilElegido, onElegirPerfil, onIrA, onSeguir }: Props) {
  const ids = datos.perfiles.map((p) => p.id);
  const sinResponder = cuestionario.preguntas.findIndex((p) => !respuestas[p.id]);
  if (sinResponder >= 0) {
    return (
      <div className="max-w-2xl">
        <p className="text-[18px]">Falta responder una pregunta.</p>
        <button type="button" onClick={() => onIrA(sinResponder)} className="mt-6 w-full rounded-[3px] bg-[var(--tinta)] px-6 py-3.5 text-[var(--fondo)] sm:w-auto">
          Ir a la pregunta {sinResponder + 1}
        </button>
      </div>
    );
  }

  const r = calcularPerfil(cuestionario, respuestas, ids);
  const nombre = (id: string) => datos.perfiles.find((p) => p.id === id)!.nombre;
  const indiceTest = ids.indexOf(r.perfil);
  const actual = perfilElegido && ids.indexOf(perfilElegido) <= indiceTest ? perfilElegido : r.perfil;

  const porque =
    r.limitante === "horizonte"
      ? "Como vas a usar la plata en pocos años, el perfil no puede ser más arriesgado que este, aunque tus respuestas den para más."
      : r.limitante === "ambos"
        ? `Tu tolerancia y tu capacidad dieron el mismo perfil.`
        : r.limitante === "tolerancia"
          ? `Tu capacidad para asumir riesgo daba ${nombre(r.capacidad.perfil).toLowerCase()}, pero tu tolerancia da ${nombre(r.tolerancia.perfil).toLowerCase()}. Tomamos el más bajo de los dos.`
          : `Tu tolerancia daba ${nombre(r.tolerancia.perfil).toLowerCase()}, pero tu capacidad para asumir riesgo da ${nombre(r.capacidad.perfil).toLowerCase()}. Tomamos el más bajo de los dos.`;

  return (
    <div className="max-w-2xl">
      <p className="rotulo">Tu perfil de riesgo</p>
      <h1 className="font-titular mt-3 text-[44px] leading-none sm:text-[64px]">{nombre(r.perfil)}</h1>
      <p className="mt-5 text-[18px] leading-[1.55] sm:mt-6 sm:text-[19px]">{descripcionPerfil[r.perfil]}</p>
      <p className="mt-4 text-[16px] leading-[1.6] text-[var(--gris)]">{porque}</p>

      <dl className="tabular mt-8 grid gap-5 border-t border-[var(--linea)] pt-5 text-[15px] sm:grid-cols-2 sm:gap-6">
        <div>
          <dt className="text-[var(--gris)]">Tolerancia: cómo reaccionás ante una caída</dt>
          <dd className="mt-1 text-[18px]">
            {r.tolerancia.puntos} de {r.tolerancia.maximo} · {nombre(r.tolerancia.perfil)}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--gris)]">Capacidad: cuánto riesgo podés asumir</dt>
          <dd className="mt-1 text-[18px]">
            {r.capacidad.puntos} de {r.capacidad.maximo} · {nombre(r.capacidad.perfil)}
          </dd>
        </div>
      </dl>

      <fieldset className="mt-10 sm:mt-12">
        <legend className="text-[18px]">¿Preferís ir con algo más conservador?</legend>
        <p className="mt-1 text-[15px] text-[var(--gris)]">Podés bajar el riesgo. Subirlo más allá de lo que dio el test, no.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {datos.perfiles.map((p, i) => {
            const permitido = i <= indiceTest;
            const activo = p.id === actual;
            return (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={activo}
                disabled={!permitido}
                onClick={() => onElegirPerfil(p.id)}
                className={`min-h-11 rounded-[3px] border px-4 py-2.5 text-[15px] ${
                  activo
                    ? "border-[var(--tinta)] bg-[var(--tinta)] text-[var(--fondo)]"
                    : permitido
                      ? "border-[var(--linea)] hover:border-[var(--tinta)]"
                      : "cursor-not-allowed border-dashed border-[var(--linea)] text-[var(--gris-claro)]"
                }`}
              >
                {p.nombre}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-[var(--linea)] pt-8 sm:mt-12 sm:justify-start">
        <button type="button" onClick={onSeguir} className="w-full rounded-[3px] bg-[var(--tinta)] px-6 py-3.5 text-[16px] text-[var(--fondo)] hover:bg-black sm:w-auto">
          Seguir
        </button>
        <button type="button" onClick={() => onIrA(0)} className="toque text-[15px] text-[var(--gris)] hover:text-[var(--tinta)]">
          Revisar mis respuestas
        </button>
      </div>
    </div>
  );
}
