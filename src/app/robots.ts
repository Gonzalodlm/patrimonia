import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const sitio = process.env.SITIO_URL || "https://patrimonia.uy";
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/baja"] }], sitemap: `${sitio}/sitemap.xml` };
}
