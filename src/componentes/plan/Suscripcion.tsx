"use client";

import { useState } from "react";
import { consentimiento } from "@/lib/consentimiento";

export function Suscripcion() {
  const [email, setEmail] = useState("");
  const [acepta, setAcepta] = useState(false);
  const [sitio, setSitio] = useState(""); // campo trampa para robots
  const [estado, setEstado] = useState<"inicio" | "enviando" | "listo" | "error" | "no_disponible">("inicio");

  if (estado === "listo") {
    return <p className="text-[17px] leading-[1.6]">Listo. Te vamos a escribir una vez por año, cuando se actualicen los supuestos.</p>;
  }
  return (
    <form
      className="max-w-xl"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!acepta) return;
        setEstado("enviando");
        const r = await fetch("/api/suscripcion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, acepta, version: consentimiento.version, sitio }),
        }).catch(() => null);
        setEstado(r?.ok ? "listo" : r?.status === 503 ? "no_disponible" : "error");
      }}
    >
      <label htmlFor="mail-aviso" className="block text-[17px]">
        Dejá tu mail para avisarte cuando se actualicen los supuestos cada año
      </label>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <input
          id="mail-aviso"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@mail.com"
          className="w-full rounded-[3px] border border-[var(--linea)] bg-white/50 px-3 py-3 text-[17px] outline-none focus:border-[var(--tinta)]"
        />
        <button
          type="submit"
          disabled={!acepta || estado === "enviando"}
          className="shrink-0 rounded-[3px] bg-[var(--tinta)] px-5 py-3 text-[16px] text-[var(--fondo)] hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
        >
          Avisarme
        </button>
      </div>
      <label className="sr-only" aria-hidden>
        No completar
        <input tabIndex={-1} autoComplete="off" value={sitio} onChange={(e) => setSitio(e.target.value)} />
      </label>
      <label className="mt-3 flex items-start gap-3 text-[14px] leading-[1.55] text-[var(--gris)]">
        <input type="checkbox" checked={acepta} onChange={(e) => setAcepta(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-[var(--tinta)] sm:mt-1 sm:size-4" />
        {consentimiento.texto}
      </label>
      {estado === "error" && <p className="mt-3 text-[14px] text-[var(--acento)]">No pudimos guardarlo. Revisá el mail y probá de nuevo.</p>}
      {estado === "no_disponible" && <p className="mt-3 text-[14px] text-[var(--gris)]">Por ahora no estamos guardando mails. Volvé a probar más adelante.</p>}
    </form>
  );
}
