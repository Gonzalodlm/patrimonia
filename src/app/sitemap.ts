import type { MetadataRoute } from "next";
import { urlSitio } from "@/lib/sitio";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/plan", "/privacidad"].map((ruta) => ({ url: `${urlSitio()}${ruta}` }));
}
