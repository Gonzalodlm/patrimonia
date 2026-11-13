"use client";

// El plan se dibuja solo en el navegador: lee lo guardado en localStorage al iniciar, y así no hay
// diferencias entre lo que arma el servidor y lo que ve la persona.
import dynamic from "next/dynamic";

export const PlanCliente = dynamic(() => import("./Plan").then((m) => m.Plan), {
  ssr: false,
  loading: () => <p className="py-20 text-[var(--gris)]">Cargando…</p>,
});
