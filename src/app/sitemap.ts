import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const sitio = process.env.SITIO_URL || "https://patrimonia.uy";
  return ["", "/plan", "/privacidad"].map((ruta) => ({ url: `${sitio}${ruta}` }));
}
