import { afterEach, describe, expect, it, vi } from "vitest";
import { urlSitio } from "../src/lib/sitio";

afterEach(() => vi.unstubAllEnvs());

describe("dirección pública del sitio", () => {
  it("usa SITIO_URL, sin barra final", () => {
    vi.stubEnv("SITIO_URL", "https://ejemplo.com/");
    expect(urlSitio()).toBe("https://ejemplo.com");
  });

  it("si falta, usa la dirección que Vercel le da al proyecto", () => {
    vi.stubEnv("SITIO_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "patrimonia-plum.vercel.app");
    expect(urlSitio()).toBe("https://patrimonia-plum.vercel.app");
  });

  it("nunca inventa un dominio que no es nuestro", () => {
    vi.stubEnv("SITIO_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
    expect(urlSitio()).toBe("http://localhost:3000");
  });
});
