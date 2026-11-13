// PROVISORIO: dirección B, "Libro". Newsreader en titulares y texto.
import datos from "@datos/frontera.json";
import type { DatosGenerados } from "@/motor/generado";
import { Apertura, Encabezado, MuestraNumeros } from "@/componentes/landing/Apertura";
import { newsreaderTexto, newsreaderTitular } from "../fuentes";

export default function DireccionB() {
  const d = datos as DatosGenerados;
  return (
    <div className={`${newsreaderTitular.variable} ${newsreaderTexto.variable}`} style={{ fontFamily: "var(--fuente-texto)" }}>
      <Encabezado />
      <Apertura datos={d} />
      <MuestraNumeros datos={d} />
    </div>
  );
}
