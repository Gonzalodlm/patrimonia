import Link from "next/link";
import { avisoCorto } from "@/lib/avisos";
import { sitio } from "@/lib/sitio";
import { fechaLarga } from "@/lib/formato";
import type { Fuente } from "@/motor/tipos";

/** Pie de todas las páginas: enlaces y avisos legales completos en letra chica. */
export function Pie({ fuente }: { fuente: Fuente }) {
  const enlace = "toque hover:text-[var(--tinta)]";
  return (
    <footer className="bg-[var(--fondo-hundido)]">
      <div className="mx-auto max-w-6xl px-4 pt-10 pb-8 sm:px-8 sm:pt-14 sm:pb-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
          <p className="font-titular text-[28px] leading-none">Patrimonia</p>
          <ul className="flex flex-wrap gap-x-8 text-[15px] text-[var(--gris)]">
            <li>
              <Link href="/plan" className={enlace}>
                Armar mi plan
              </Link>
            </li>
            <li>
              <Link href="/privacidad" className={enlace}>
                Privacidad
              </Link>
            </li>
            <li>
              {sitio.repositorio ? (
                <a href={sitio.repositorio} className={enlace}>
                  Código
                </a>
              ) : (
                <span>Código (próximamente)</span>
              )}
            </li>
            <li>
              {sitio.contacto ? (
                <a href={`mailto:${sitio.contacto}`} className={enlace}>
                  Contacto
                </a>
              ) : (
                <span>Contacto (próximamente)</span>
              )}
            </li>
          </ul>
        </div>
        <div className="mt-8 border-t border-[var(--linea)] pt-6 text-[13px] leading-[1.6] text-[var(--gris)] sm:mt-12 sm:text-[12px] sm:leading-[1.65]">
          <p className="max-w-[110ch]">{avisoCorto}</p>
          <p className="mt-3 max-w-[110ch]">
            Supuestos: {fuente.nombre}, edición {fuente.edicion}, con datos al{" "}
            {fechaLarga(fuente.fechaDatos)}.
          </p>
        </div>
      </div>
    </footer>
  );
}
