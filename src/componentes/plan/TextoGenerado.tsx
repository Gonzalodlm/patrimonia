"use client";

// Muestra la plantilla enseguida y, si el modelo responde a tiempo y su texto pasa los controles,
// la reemplaza. Si no, queda la plantilla: la web funciona completa sin el modelo.
import { useEffect, useState } from "react";
import type { PedidoTexto } from "@/textos/tipos";

const ESPERA_MS = 9000;

export function TextoGenerado({ pedido, plantilla, onTexto }: { pedido: PedidoTexto; plantilla: string; onTexto?: (t: string) => void }) {
  const clave = JSON.stringify(pedido);
  const [resultado, setResultado] = useState<{ clave: string; texto: string | null }>({ clave: "", texto: null });

  useEffect(() => {
    const corte = new AbortController();
    const reloj = setTimeout(() => corte.abort(), ESPERA_MS);
    // Un poco de espera para no pedir en cada tecla mientras la persona edita.
    const demora = setTimeout(() => {
      fetch("/api/textos", { method: "POST", headers: { "Content-Type": "application/json" }, body: clave, signal: corte.signal })
        .then((r) => (r.ok ? r.json() : null))
        .then((j: { texto?: string } | null) => setResultado({ clave, texto: j?.texto ?? null }))
        .catch(() => setResultado({ clave, texto: null }));
    }, 500);
    return () => {
      clearTimeout(demora);
      clearTimeout(reloj);
      corte.abort();
    };
  }, [clave]);

  const listo = resultado.clave === clave;
  const delModelo = listo && resultado.texto !== null;
  const texto = delModelo ? resultado.texto! : plantilla;

  useEffect(() => {
    onTexto?.(texto);
  }, [texto, onTexto]);

  return (
    <div aria-live="polite" aria-busy={!listo}>
      <div className={`space-y-3 text-[17px] leading-[1.65] transition-opacity duration-300 ${listo ? "" : "opacity-60"}`}>
        {texto.split(/\n{2,}/).map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      <p className="mt-3 text-[12px] text-[var(--gris)]">
        {!listo
          ? "Redactando…"
          : delModelo
            ? "Redactado por un modelo de lenguaje a partir de tus números, que se verifican contra el cálculo."
            : "Texto armado a partir de tus números."}
      </p>
    </div>
  );
}
