import type { Metadata } from "next";
import { Suspense } from "react";
import datos from "@datos/frontera.json";
import type { DatosGenerados } from "@/motor/generado";
import { Encabezado } from "@/componentes/landing/Apertura";
import { Pie } from "@/componentes/Pie";
import { FormularioBaja } from "@/componentes/FormularioBaja";

export const metadata: Metadata = { title: "Darme de baja · Patrimonia", robots: { index: false } };

export default function PaginaBaja() {
  return (
    <>
      <Encabezado />
      <main id="contenido" className="mx-auto min-h-[60vh] max-w-2xl px-4 py-16 sm:px-8">
        <h1 className="font-titular text-[44px] leading-tight">Darme de baja</h1>
        <Suspense fallback={null}>
          <FormularioBaja />
        </Suspense>
      </main>
      <Pie fuente={(datos as DatosGenerados).fuente} />
    </>
  );
}
