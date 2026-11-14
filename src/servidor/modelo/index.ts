// Elige el proveedor del modelo de lenguaje. Es el único archivo que hay que tocar para cambiarlo.
//
// Variables de entorno:
//   GEMINI_API_KEY  clave de la Gemini API (plan gratuito de Google AI Studio). Sin ella, la web usa plantillas.
//   GEMINI_MODELO   opcional; por defecto gemini-3.5-flash-lite.
import { crearGemini } from "./gemini";
import type { ProveedorTexto } from "./proveedor";

export function proveedorConfigurado(): ProveedorTexto | null {
  const clave = process.env.GEMINI_API_KEY;
  if (!clave) return null;
  return crearGemini(clave, process.env.GEMINI_MODELO || "gemini-3.5-flash-lite");
}
