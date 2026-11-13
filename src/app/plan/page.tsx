import type { Metadata } from "next";
import datos from "@datos/frontera.json";
import cuestionario from "@datos/cuestionario.json";
import etfs from "@datos/etfs.json";
import type { DatosGenerados } from "@/motor/generado";
import type { Cuestionario } from "@/plan/perfil";
import type { ListaEtfs } from "@/plan/etfs";
import { Encabezado } from "@/componentes/landing/Apertura";
import { AvisoEjemplo } from "@/componentes/AvisoEjemplo";
import { Pie } from "@/componentes/Pie";
import { PlanCliente } from "@/componentes/plan/PlanCliente";

export const metadata: Metadata = {
  title: "Armar mi plan · Patrimonia",
  description: "Test de perfil de riesgo, cartera por clases de activo y plan para tu patrimonio.",
};

const d = datos as DatosGenerados;

export default function PaginaPlan() {
  return (
    <>
      {d.ejemplo && <AvisoEjemplo />}
      <Encabezado />
      <main className="mx-auto min-h-[70vh] max-w-6xl px-4 pt-4 pb-20 sm:px-8">
        <PlanCliente datos={d} cuestionario={cuestionario as Cuestionario} etfs={etfs as ListaEtfs} />
      </main>
      <Pie fuente={d.fuente} />
    </>
  );
}
