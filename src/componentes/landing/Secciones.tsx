import Link from "next/link";
import type { DatosGenerados } from "@/motor/generado";
import { avisos } from "@/lib/avisos";
import { sitio } from "@/lib/sitio";
import { fechaLarga } from "@/lib/formato";
import { GraficoClases } from "./GraficoClases";

function Seccion({ id, rotulo, titulo, children }: { id?: string; rotulo: string; titulo: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6 border-t border-[var(--linea)]">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-8 sm:py-24">
        <p className="rotulo">{rotulo}</p>
        <h2 className="font-titular mt-4 max-w-[20ch] text-[36px] leading-[1.06] tracking-[-0.015em] sm:text-[48px]">{titulo}</h2>
        {children}
      </div>
    </section>
  );
}

const parrafo = "max-w-[62ch] text-[18px] leading-[1.6] text-[var(--gris)]";

// ─── 2. De dónde salen los números ───────────────────────────────────────────

export function Numeros({ datos }: { datos: DatosGenerados }) {
  const clases = datos.clases.filter((c) => datos.carteras.diversificada.clases.includes(c.id));
  const cifras = [
    ["31", "ediciones anuales del informe"],
    ["10 a 15", "años de horizonte de las estimaciones"],
    ["200+", "activos estudiados por más de 90 especialistas"],
    ["7,0%", "retorno anual esperado de una cartera con 60% en acciones de todo el mundo y 40% en bonos de EE.UU."],
  ];
  return (
    <Seccion id="numeros" rotulo="De dónde salen los números" titulo="Una estimación de largo plazo, no un pronóstico del año que viene.">
      <div className="mt-8 grid gap-14 lg:grid-cols-2 lg:gap-16">
        <div className="space-y-5">
          <p className={parrafo}>
            Una vez por año, J.P. Morgan Asset Management, uno de los administradores de inversiones más grandes del mundo, publica
            cuánto espera que rinda cada tipo de inversión en los próximos 10 a 15 años, cuánto puede oscilar y cómo se mueven unas
            respecto de otras.
          </p>
          <p className={parrafo}>
            No dice qué va a pasar el año que viene: nadie lo sabe. Es una estimación para quien invierte a muchos años, y por eso
            sirve para armar una cartera de largo plazo.
          </p>
          <p className={parrafo}>
            Patrimonia usa {clases.length} clases de activo que cualquier persona puede comprar con un ETF. En el gráfico está cada
            una: tocá un punto para ver cuánto se espera que rinda y cuánto puede oscilar.
          </p>
          <p className="max-w-[62ch] text-[15px] leading-[1.6] text-[var(--gris)]">
            Edición {datos.fuente.edicion}, con datos al {fechaLarga(datos.fuente.fechaDatos)}. Los retornos son de índices, sin
            costos: a la hora de invertir hay que restarles lo que cobra el ETF, las comisiones del broker y los impuestos.
            {datos.fuente.url && (
              <>
                {" "}
                <a href={datos.fuente.url} className="underline decoration-[var(--linea)] underline-offset-4 hover:decoration-current" rel="noopener">
                  Ver el informe en la página de J.P. Morgan
                </a>
                .
              </>
            )}
          </p>
        </div>
        <GraficoClases clases={clases} />
      </div>

      <dl className="mt-20 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
        {cifras.map(([cifra, texto]) => (
          <div key={texto} className="border-t border-[var(--tinta)] pt-4">
            <dt className="font-titular text-[46px] leading-none [font-variant-numeric:lining-nums]">{cifra}</dt>
            <dd className="mt-3 text-[15px] leading-[1.45] text-[var(--gris)]">{texto}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-8 text-[13px] text-[var(--gris)]">Cifras del informe {datos.fuente.edicion} de J.P. Morgan Asset Management.</p>

      <aside className="mt-16 max-w-[62ch] border-l-2 border-[var(--acento)] pl-5">
        <p className="text-[16px] leading-[1.6] text-[var(--gris)]">
          <span className="text-[var(--tinta)]">Todo está en dólares.</span> Si tus gastos son en pesos, el tipo de cambio juega a
          favor o en contra: hay años en que el dólar sube menos que los precios en Uruguay y tus ahorros compran menos. Para la plata
          que vas a gastar pronto en pesos, tenelo en cuenta.
        </p>
      </aside>
    </Seccion>
  );
}

// ─── 3. Cómo funciona ────────────────────────────────────────────────────────

const pasos = [
  ["Tu perfil de riesgo", "Unas diez preguntas con plata concreta: qué harías si tu inversión cae, cuánto tiempo podés esperar, qué tan estables son tus ingresos."],
  ["Tus objetivos", "Lo que querés lograr, cuánto cuesta en dólares de hoy y para cuándo: un fondo de emergencia, una casa, el retiro."],
  ["Tu cartera", "Qué parte va a cada clase de activo, cuánto se espera que rinda, cuánto puede caer en un año malo y qué ETFs la representan."],
  ["Tu plan", "Cuánto ahorrar por mes para cada objetivo, en qué orden y qué hacer si no alcanza para todo. Lo descargás en PDF."],
];

export function ComoFunciona() {
  return (
    <Seccion id="como-funciona" rotulo="Cómo funciona" titulo="Cuatro pasos, unos quince minutos.">
      <ol className="mt-14 grid gap-x-12 gap-y-12 sm:grid-cols-2">
        {pasos.map(([titulo, texto], i) => (
          <li key={titulo} className="max-w-[40ch]">
            <span className="rotulo tabular">{String(i + 1).padStart(2, "0")}</span>
            <h3 className="font-titular mt-3 text-[28px] leading-tight">{titulo}</h3>
            <p className="mt-3 text-[17px] leading-[1.6] text-[var(--gris)]">{texto}</p>
          </li>
        ))}
      </ol>
      <Link href="/plan" className="mt-14 inline-block rounded-[3px] bg-[var(--tinta)] px-6 py-3.5 text-[16px] text-[var(--fondo)] hover:bg-black">
        Armar mi plan
      </Link>
    </Seccion>
  );
}

// ─── 4. Qué busca el proyecto ────────────────────────────────────────────────

export function Principios() {
  const principios = [
    ["Abierto", "El código es público. Cualquiera puede revisar cómo se calcula cada número."],
    ["Sin fines de lucro", "No cobra, no vende productos y no recibe comisiones de ningún banco, broker ni emisor de ETF."],
    ["Una guía, no un asesoramiento", "Muestra un método y un resultado orientativo. La decisión es de cada persona."],
    [
      "Privado",
      "Lo que cargás no se guarda en ningún servidor. Lo único que sale de tu navegador son números anónimos para redactar la explicación de tu plan.",
    ],
  ];
  return (
    <Seccion id="principios" rotulo="Qué busca el proyecto" titulo="Que invertir con método no dependa de quién te quiere vender algo.">
      <dl className="mt-14 max-w-4xl">
        {principios.map(([titulo, texto]) => (
          <div key={titulo} className="grid gap-2 border-t border-[var(--linea)] py-6 sm:grid-cols-[16rem_1fr] sm:gap-8">
            <dt className="font-titular text-[24px] leading-tight">{titulo}</dt>
            <dd className="max-w-[54ch] text-[17px] leading-[1.6] text-[var(--gris)]">{texto}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-8 text-[16px] text-[var(--gris)]">
        {sitio.repositorio ? (
          <a href={sitio.repositorio} className="underline decoration-[var(--linea)] underline-offset-4 hover:decoration-current">
            Ver el código en GitHub
          </a>
        ) : (
          "El código se publica en GitHub antes del lanzamiento."
        )}
      </p>
    </Seccion>
  );
}

// ─── 5. Qué no es ────────────────────────────────────────────────────────────

export function QueNoEs() {
  return (
    <Seccion id="que-no-es" rotulo="Qué no es" titulo="Antes de seguir, lo que Patrimonia no es.">
      <ul className="mt-14 grid max-w-5xl gap-x-12 gap-y-10 sm:grid-cols-2">
        {avisos.map((a) => (
          <li key={a.titulo} className="max-w-[46ch]">
            <h3 className="text-[18px] font-semibold leading-snug">{a.titulo}</h3>
            <p className="mt-2 text-[17px] leading-[1.6] text-[var(--gris)]">{a.texto}</p>
          </li>
        ))}
      </ul>
    </Seccion>
  );
}

// ─── 6. Quién lo hace ────────────────────────────────────────────────────────

export function QuienLoHace() {
  return (
    <Seccion id="quien" rotulo="Quién lo hace" titulo="Un contador uruguayo, con el código a la vista.">
      <div className="mt-8 max-w-[62ch] space-y-5 text-[18px] leading-[1.6] text-[var(--gris)]">
        <p>
          Soy Gonzalo Díaz López, contador. Hice Patrimonia porque mucha gente en Uruguay ahorra en dólares, deja esa plata quieta en
          el banco y no sabe por dónde empezar. Y casi toda la información sobre inversiones que le llega viene de alguien que quiere
          venderle algo.
        </p>
        <p>
          El sitio no cobra nada y no tiene socios comerciales: no recibo comisiones de bancos, brokers ni emisores de ETF. Los
          criterios financieros, desde el test de perfil hasta el orden en que se reparte el ahorro, los reviso yo. El código es
          público, así que cualquiera puede ver cómo se calcula cada número.
        </p>
        {sitio.contacto && (
          <p>
            Si encontrás un error o tenés una sugerencia, escribime a{" "}
            <a href={`mailto:${sitio.contacto}`} className="text-[var(--tinta)] underline decoration-[var(--linea)] underline-offset-4 hover:decoration-current">
              {sitio.contacto}
            </a>
            .
          </p>
        )}
      </div>
    </Seccion>
  );
}

// ─── 7. Preguntas frecuentes ─────────────────────────────────────────────────

export function Preguntas({ datos }: { datos: DatosGenerados }) {
  const preguntas: [string, React.ReactNode][] = [
    [
      "¿Es gratis de verdad?",
      "Sí. No cobra, no tiene publicidad, no vende productos y no recibe comisiones de bancos, brokers ni emisores de ETF. Es un proyecto sin fines de lucro y el código es público.",
    ],
    [
      "¿Qué hacen con mis datos?",
      <>
        Lo que cargás en el plan queda en tu navegador: no se guarda en ningún servidor. Para redactar la explicación de tu plan se
        envían números anónimos, sin tu nombre, tu mail ni nada que hayas escrito. Si dejás tu mail para recibir avisos, se guarda
        solo el mail. El detalle está en la{" "}
        <Link href="/privacidad" className="underline decoration-[var(--linea)] underline-offset-4 hover:decoration-current">
          página de privacidad
        </Link>
        .
      </>,
    ],
    [
      "¿Necesito mucha plata para empezar?",
      "No. El método es el mismo para USD 1.000 que para USD 100.000. Con montos chicos pesa más lo que cobra el broker por cada compra: comparalo antes de elegir y, si cobra un monto fijo por operación, comprá menos veces y por más plata. Con poca plata, la cartera simple de dos ETFs es más fácil de mantener.",
    ],
    [
      "¿Dónde se compran los ETFs?",
      "A través de un broker o un banco que te dé acceso a las bolsas europeas, donde cotizan los ETFs que listamos. Patrimonia no recomienda ninguno ni tiene acuerdos con ellos. Antes de abrir una cuenta, mirá cuánto cobra, quién custodia tus inversiones y quién lo regula.",
    ],
    [
      "¿Cada cuánto se actualiza?",
      `Una vez por año, cuando J.P. Morgan publica una edición nueva de sus supuestos. Hoy usamos la edición ${datos.fuente.edicion}, con datos al ${fechaLarga(datos.fuente.fechaDatos)}.`,
    ],
    [
      "¿Quién está detrás?",
      <>
        Un contador uruguayo, sin socios comerciales. Más arriba está{" "}
        <a href="#quien" className="underline decoration-[var(--linea)] underline-offset-4 hover:decoration-current">
          quién lo hace
        </a>
        , y el código está abierto para que cualquiera lo revise.
      </>,
    ],
  ];
  return (
    <Seccion id="preguntas" rotulo="Preguntas frecuentes" titulo="Lo que suelen preguntar.">
      <div className="mt-12 max-w-3xl border-b border-[var(--linea)]">
        {preguntas.map(([pregunta, respuesta]) => (
          <details key={pregunta} className="group border-t border-[var(--linea)]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-[19px] [&::-webkit-details-marker]:hidden">
              {pregunta}
              <span aria-hidden className="text-[22px] leading-none text-[var(--gris)] transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="max-w-[62ch] pb-6 text-[17px] leading-[1.6] text-[var(--gris)]">{respuesta}</p>
          </details>
        ))}
      </div>
    </Seccion>
  );
}
