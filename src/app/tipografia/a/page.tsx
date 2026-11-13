// PROVISORIO: dirección A, "Inscripción". Cormorant Garamond + Source Sans 3.
import datos from "@datos/frontera.json";
import type { DatosGenerados } from "@/motor/generado";
import { Apertura, Encabezado, MuestraNumeros } from "@/componentes/landing/Apertura";
import { cormorant, sourceSans } from "../fuentes";

export default function DireccionA() {
  const d = datos as DatosGenerados;
  return (
    <div className={`${cormorant.variable} ${sourceSans.variable}`} style={{ fontFamily: "var(--fuente-texto)" }}>
      <Encabezado />
      <Apertura datos={d} />
      <MuestraNumeros datos={d} />
    </div>
  );
}
