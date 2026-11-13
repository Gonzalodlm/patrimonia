// Proveedor: Gemini API de Google, con la Interactions API (la recomendada en la documentación
// vigente, consultada el 13/11/2026 en aistudio.google.com/docs/text-generation).
//
//   POST https://generativelanguage.googleapis.com/v1beta/interactions
//   Encabezados: x-goog-api-key, Api-Revision
//   Cuerpo: { model, system_instruction, input, generation_config: { max_output_tokens } }
//   Respuesta: el texto está en steps[] (type "model_output") → content[] (type "text") → text
//
// Se usa el plan PAGO (proyecto con facturación activa): con el plan gratuito Google usa y puede
// leer lo que se le envía. Ver la página de privacidad.

import { ErrorModelo, type PedidoModelo, type ProveedorTexto } from "./proveedor";

const URL = "https://generativelanguage.googleapis.com/v1beta/interactions";
const REVISION_API = "2026-05-20";

interface RespuestaInteraccion {
  status?: string;
  steps?: { type?: string; content?: { type?: string; text?: string }[] }[];
  error?: { code?: string; message?: string };
}

export function crearGemini(clave: string, modelo: string): ProveedorTexto {
  return {
    nombre: `gemini:${modelo}`,
    async redactar({ sistema, mensaje, maxTokens, senal }: PedidoModelo) {
      let respuesta: Response;
      try {
        respuesta = await fetch(URL, {
          method: "POST",
          signal: senal,
          headers: { "Content-Type": "application/json", "x-goog-api-key": clave, "Api-Revision": REVISION_API },
          body: JSON.stringify({ model: modelo, system_instruction: sistema, input: mensaje, generation_config: { max_output_tokens: maxTokens } }),
        });
      } catch (e) {
        throw new ErrorModelo("red", (e as Error).name);
      }
      const cuerpo = (await respuesta.json().catch(() => ({}))) as RespuestaInteraccion;
      if (!respuesta.ok) {
        const codigo = cuerpo.error?.code ?? String(respuesta.status);
        if (respuesta.status === 429) throw new ErrorModelo(codigo === "quota_exceeded" ? "sin_cupo" : "limite", codigo);
        if (respuesta.status === 402) throw new ErrorModelo("sin_cupo", codigo);
        throw new ErrorModelo("rechazo", codigo);
      }
      const texto = (cuerpo.steps ?? [])
        .filter((s) => s.type === "model_output")
        .flatMap((s) => s.content ?? [])
        .filter((c) => c.type === "text" && typeof c.text === "string")
        .map((c) => c.text)
        .join("")
        .trim();
      if (!texto) throw new ErrorModelo("formato", cuerpo.status ?? "sin texto");
      return texto;
    },
  };
}
