import datos from "@datos/frontera.json";
import type { DatosGenerados } from "@/motor/generado";
import { Apertura, Encabezado } from "@/componentes/landing/Apertura";
import { ComoFunciona, Numeros, Preguntas, Principios, QueNoEs, QuienLoHace } from "@/componentes/landing/Secciones";
import { AvisoEjemplo } from "@/componentes/AvisoEjemplo";
import { Pie } from "@/componentes/Pie";

const d = datos as DatosGenerados;

export default function Inicio() {
  return (
    <>
      {d.ejemplo && <AvisoEjemplo />}
      <Encabezado />
      <main>
        <Apertura datos={d} />
        <Numeros datos={d} />
        <ComoFunciona />
        <Principios />
        <QueNoEs />
        <QuienLoHace />
        <Preguntas datos={d} />
      </main>
      <Pie fuente={d.fuente} />
    </>
  );
}
