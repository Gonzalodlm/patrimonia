import type { Metadata } from "next";
import Link from "next/link";
import datos from "@datos/frontera.json";
import type { DatosGenerados } from "@/motor/generado";
import { Encabezado } from "@/componentes/landing/Apertura";
import { Pie } from "@/componentes/Pie";
import { consentimiento } from "@/lib/consentimiento";
import { sitio } from "@/lib/sitio";

export const metadata: Metadata = {
  title: "Privacidad · Patrimonia",
  description: "Qué datos guarda Patrimonia, cuáles no, dónde y cómo pedir que se borren.",
};

const ACTUALIZADA = "16 de noviembre de 2026";

function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="font-titular text-[30px] leading-tight">{titulo}</h2>
      <div className="mt-4 space-y-4 text-[18px] leading-[1.65] text-[var(--gris)] [&_strong]:font-normal [&_strong]:text-[var(--tinta)]">{children}</div>
    </section>
  );
}

export default function Privacidad() {
  const contacto = sitio.contacto ? (
    <a href={`mailto:${sitio.contacto}`} className="text-[var(--tinta)] underline decoration-[var(--linea)] underline-offset-4">
      {sitio.contacto}
    </a>
  ) : (
    "el mail de contacto que figura al pie de la página"
  );
  return (
    <>
      <Encabezado />
      <main id="contenido" className="mx-auto max-w-[44rem] px-4 pt-10 pb-24 sm:px-8">
        <p className="rotulo">Privacidad</p>
        <h1 className="font-titular mt-3 text-[44px] leading-[1.05] sm:text-[56px]">Tus datos son tuyos.</h1>
        <p className="mt-6 text-[19px] leading-[1.6] text-[var(--gris)]">
          Patrimonia no tiene cuentas ni contraseñas, y no guarda en ningún servidor los datos financieros que cargás. Acá está el detalle, en
          palabras simples. Última actualización: {ACTUALIZADA}.
        </p>

        <Bloque titulo="Lo que no guardamos">
          <p>
            Tus respuestas al test, tu edad, tus ingresos, gastos, ahorros, deudas y objetivos <strong>quedan solo en tu navegador</strong>, en
            un espacio que se llama almacenamiento local. Sirve para que no pierdas lo que cargaste si cerrás la página. Nadie más los ve:
            ni nosotros.
          </p>
          <p>
            Para borrarlos, tocá «Empezar de nuevo» al final del plan, o borrá los datos del sitio desde la configuración de tu navegador.
            El PDF de tu plan también se arma en tu navegador: no pasa por ningún servidor.
          </p>
        </Bloque>

        <Bloque titulo="Lo que sale de tu navegador">
          <p>
            Para redactar la explicación de tu cartera y el resumen de tu plan, mandamos <strong>números anónimos</strong> a Gemini, el
            modelo de lenguaje de Google: tu perfil de riesgo, los porcentajes de la cartera, los montos ya calculados y el tipo de cada
            objetivo (por ejemplo «casa» o «retiro»). <strong>No mandamos</strong> tu mail, los nombres que les pusiste a tus objetivos ni nada
            que hayas escrito.
          </p>
          <p>
            Usamos el servicio gratuito de Google. Según sus términos, en ese servicio Google puede usar lo que se le envía para mejorar sus
            productos, y personas de Google pueden leerlo, separado de cualquier cuenta. Por eso solo mandamos esos números anónimos. El
            modelo no calcula nada: los números los calcula Patrimonia y revisamos que el texto no traiga cifras distintas.
          </p>
          <p>Si el modelo no responde, la explicación se arma con plantillas propias y no sale nada de tu navegador.</p>
        </Bloque>

        <Bloque titulo="Lo que sí guardamos, solo si nos lo pedís">
          <p>
            Si dejás tu mail para el aviso anual, guardamos <strong>tu mail, la fecha y la versión del texto que aceptaste</strong>. Nada más:
            ningún dato financiero queda asociado a tu mail. Lo usamos solo para avisarte una vez por año cuando se actualizan los supuestos.
            No lo compartimos ni lo vendemos.
          </p>
          <p>El texto que aceptás es este (versión {consentimiento.version}):</p>
          <blockquote className="border-l-2 border-[var(--linea)] pl-4 text-[17px]">{consentimiento.texto}</blockquote>
          <p>
            Los mails se guardan en una base de datos de Neon, un servicio de bases de datos en la nube, en sus servidores de San Pablo,
            Brasil. Solo quien mantiene Patrimonia tiene acceso.
          </p>
        </Bloque>

        <Bloque titulo="Estadísticas de uso">
          <p>
            Para saber cuánta gente usa el sitio y qué páginas visita, usamos las estadísticas de Vercel, el servicio donde está alojado
            Patrimonia. Según Vercel, <strong>no usan cookies de terceros</strong>: cada visita se reconoce con un código que se descarta a
            las 24 horas, y se guardan datos generales como la página, el país, el navegador y el tipo de dispositivo. No vemos quién sos,
            solo totales.
          </p>
        </Bloque>

        <Bloque titulo="Cómo pedir que se borre tu mail">
          <p>
            Cada mail que te mandemos trae un enlace para darte de baja: con un clic borramos tu mail. También podés escribirnos a {contacto} y
            lo borramos a mano.
          </p>
        </Bloque>

        <Bloque titulo="Para mayores de 18">
          <p>Patrimonia está pensada para personas mayores de 18 años.</p>
        </Bloque>

        <p className="mt-16 text-[16px]">
          <Link href="/" className="toque text-[var(--gris)] underline decoration-[var(--linea)] underline-offset-4 hover:text-[var(--tinta)]">
            Volver al inicio
          </Link>
        </p>
      </main>
      <Pie fuente={(datos as DatosGenerados).fuente} />
    </>
  );
}
