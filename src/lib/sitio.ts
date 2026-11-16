// Datos del sitio.
// Si repositorio o contacto valen null, la web muestra un texto en su lugar en vez de un enlace roto.

export const sitio = {
  nombre: "Patrimonia",
  /** Repositorio público en GitHub. */
  repositorio: "https://github.com/Gonzalodlm/patrimonia" as string | null,
  /** Mail de contacto público (aparece en el pie, en "Quién lo hace" y en la página de privacidad). */
  contacto: "gonzalodiaslopez3@gmail.com" as string | null,
};

/**
 * Dirección pública del sitio, sin barra final. Sale de la variable SITIO_URL; si falta, de la
 * dirección que Vercel le da al proyecto. Nunca se inventa un dominio que todavía no es nuestro.
 */
export function urlSitio(): string {
  const propia = process.env.SITIO_URL?.trim().replace(/\/+$/, "");
  if (propia) return propia;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return vercel ? `https://${vercel}` : "http://localhost:3000";
}
