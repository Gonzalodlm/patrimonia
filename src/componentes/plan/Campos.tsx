"use client";

// Campos de formulario chicos y reutilizables.
import { useState } from "react";
import { numero } from "@/lib/formato";

const caja = "flex items-center rounded-[3px] border border-[var(--linea)] bg-white/50 focus-within:border-[var(--tinta)]";

/** Campo numérico con formato uruguayo (punto de miles). Vacío = null. */
export function CampoNumero({
  etiqueta,
  ayuda,
  valor,
  onCambio,
  prefijo,
  sufijo,
  decimales = false,
  max = 1_000_000_000,
  requerido = false,
  sinMiles = false,
  id,
}: {
  etiqueta: string;
  ayuda?: string;
  valor: number | null;
  onCambio: (v: number | null) => void;
  prefijo?: string;
  sufijo?: string;
  decimales?: boolean;
  max?: number;
  requerido?: boolean;
  /** Para años: sin punto de miles. */
  sinMiles?: boolean;
  id: string;
}) {
  // Con decimales se guarda el texto tal cual, para poder escribir "12," antes del decimal.
  const [texto, setTexto] = useState(valor === null ? "" : String(valor).replace(".", ","));
  return (
    <div>
      <label htmlFor={id} className="block text-[15px]">
        {etiqueta}
        {!requerido && <span className="text-[var(--gris)]"> (opcional)</span>}
      </label>
      {ayuda && <p className="mt-0.5 text-[13px] text-[var(--gris)]">{ayuda}</p>}
      <span className={`${caja} mt-2`}>
        {prefijo && <span className="pl-3 text-[15px] text-[var(--gris)]">{prefijo}</span>}
        <input
          id={id}
          inputMode={decimales ? "decimal" : "numeric"}
          autoComplete="off"
          className="tabular w-full min-w-0 bg-transparent px-3 py-2.5 text-[17px] outline-none"
          value={decimales ? texto : valor === null ? "" : sinMiles ? String(valor) : numero(valor, 0)}
          onChange={(e) => {
            const escrito = e.target.value;
            if (decimales) {
              const permitido = escrito.replace(/[^\d,]/g, "");
              setTexto(permitido);
              const limpio = permitido.replace(",", ".");
              if (limpio === "") return onCambio(null);
              const v = Number(limpio);
              if (!Number.isNaN(v)) onCambio(Math.min(v, max));
              return;
            }
            const digitos = escrito.replace(/\D/g, "");
            onCambio(digitos === "" ? null : Math.min(Number(digitos), max));
          }}
        />
        {sufijo && <span className="pr-3 text-[15px] text-[var(--gris)]">{sufijo}</span>}
      </span>
    </div>
  );
}

export function Selector<T extends string>({
  etiqueta,
  valor,
  opciones,
  onCambio,
  id,
}: {
  etiqueta: string;
  valor: T;
  opciones: { valor: T; texto: string }[];
  onCambio: (v: T) => void;
  id: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-[15px]">
        {etiqueta}
      </label>
      <span className={`${caja} mt-2`}>
        <select id={id} value={valor} onChange={(e) => onCambio(e.target.value as T)} className="w-full bg-transparent px-3 py-2.5 text-[17px] outline-none">
          {opciones.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.texto}
            </option>
          ))}
        </select>
      </span>
    </div>
  );
}
