"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

export function FormularioBaja() {
  const params = useSearchParams();
  const email = params.get("e") ?? "";
  const firma = params.get("t") ?? "";
  const [estado, setEstado] = useState<"inicio" | "enviando" | "listo" | "error">("inicio");

  if (!email || !firma) {
    return (
      <p className="mt-6 text-[18px] leading-[1.6] text-[var(--gris)]">
        Este enlace está incompleto. Usá el enlace que viene al final de cada mail de Patrimonia, o escribinos y te borramos a mano.
      </p>
    );
  }
  if (estado === "listo") {
    return <p className="mt-6 text-[18px] leading-[1.6]">Listo. Borramos {email} de la lista y no vas a recibir más mails de Patrimonia.</p>;
  }
  return (
    <div className="mt-6">
      <p className="text-[18px] leading-[1.6] text-[var(--gris)]">
        Vamos a borrar <span className="text-[var(--tinta)]">{email}</span> de la lista del aviso anual. No guardamos ningún otro dato tuyo.
      </p>
      <button
        type="button"
        disabled={estado === "enviando"}
        onClick={async () => {
          setEstado("enviando");
          const r = await fetch("/api/baja", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, firma }) }).catch(() => null);
          setEstado(r?.ok ? "listo" : "error");
        }}
        className="mt-8 w-full rounded-[3px] bg-[var(--tinta)] px-6 py-3.5 text-[16px] text-[var(--fondo)] hover:bg-black sm:w-auto disabled:opacity-50"
      >
        Borrar mi mail
      </button>
      {estado === "error" && <p className="mt-4 text-[15px] text-[var(--acento)]">No pudimos borrarlo. Probá de nuevo en un rato o escribinos.</p>}
    </div>
  );
}
