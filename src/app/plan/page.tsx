import type { Metadata } from "next";
import datos from "@datos/frontera.json";
import cuestionario from "@datos/cuestionario.json";
import etfs from "@datos/etfs.json";
import criterios from "@datos/criterios-plan.json";
import type { Criterios } from "@/plan/patrimonio";
import type { DatosGenerados } from "@/motor/generado";
import type { Cuestionario } from "@/plan/perfil";
import type { ListaEtfs } from "@/plan/etfs";
import { Encabezado } from "@/componentes/landing/Apertura";
import { AvisoEjemplo } from "@/componentes/AvisoEjemplo";
import { Pie } from "@/componentes/Pie";
import { Plan } from "@/componentes/plan/Plan";

export const metadata: Metadata = {
  title: "Armar mi plan · Patrimonia",
  description: "Test de perfil de riesgo, cartera por clases de activo y plan para tu patrimonio.",
};

const d = datos as DatosGenerados;
// El formulario del aviso anual solo se muestra si hay dónde guardar los mails.
const avisoPorMail = !!process.env.DATABASE_URL && !!process.env.SECRETO_BAJAS;

export default function PaginaPlan() {
  return (
    <>
      {d.ejemplo && <AvisoEjemplo />}
      <Encabezado />
      <main id="contenido" className="mx-auto min-h-[70vh] max-w-6xl px-4 pt-4 pb-20 sm:px-8">
        <Plan datos={d} cuestionario={cuestionario as Cuestionario} etfs={etfs as ListaEtfs} criterios={criterios as Criterios} avisoPorMail={avisoPorMail} />
      </main>
      <Pie fuente={d.fuente} />
    </>
  );
}
