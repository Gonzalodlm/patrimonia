// Ayudas comunes de las rutas de la API.

/** Tamaño máximo del cuerpo de un pedido, en caracteres. Los pedidos reales pesan mucho menos. */
const MAXIMO = 10_000;

/** Lee el cuerpo como JSON. Devuelve null si falta, no es JSON o es más grande que el tope. */
export async function leerJson(request: Request, maximo = MAXIMO): Promise<unknown> {
  if (Number(request.headers.get("content-length") ?? 0) > maximo) return null;
  const texto = await request.text().catch(() => "");
  if (!texto || texto.length > maximo) return null;
  try {
    return JSON.parse(texto);
  } catch {
    return null;
  }
}

/** IP de quien hace el pedido (en Vercel la pone la plataforma, no el navegador). */
export function ipDe(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim() || request.headers.get("x-real-ip") || "desconocida";
}
