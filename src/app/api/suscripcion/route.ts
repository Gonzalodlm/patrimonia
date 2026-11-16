// Guarda el mail de quien pide el aviso anual, solo con consentimiento explícito.
import { consentimiento } from "@/lib/consentimiento";
import { permitir } from "@/servidor/limites";
import { ipDe, leerJson } from "@/servidor/pedidos";
import { configurado, guardarSuscripcion, normalizarMail } from "@/servidor/suscripciones";

export async function POST(request: Request) {
  if (!configurado()) return Response.json({ error: "no_configurado" }, { status: 503 });
  if (!permitir(`mail:${ipDe(request)}`, 5, 3600)) return Response.json({ error: "demasiados_pedidos" }, { status: 429 });

  const cuerpo = (await leerJson(request, 2000)) as { email?: unknown; acepta?: unknown; version?: unknown; sitio?: unknown } | null;
  // "sitio" es un campo oculto: las personas lo dejan vacío y los robots suelen llenarlo.
  if (!cuerpo || cuerpo.sitio) return Response.json({ ok: true });
  if (cuerpo.acepta !== true || cuerpo.version !== consentimiento.version) return Response.json({ error: "sin_consentimiento" }, { status: 400 });
  const mail = typeof cuerpo.email === "string" ? normalizarMail(cuerpo.email) : null;
  if (!mail) return Response.json({ error: "mail_invalido" }, { status: 400 });

  try {
    await guardarSuscripcion(mail, consentimiento.version);
    return Response.json({ ok: true });
  } catch {
    console.warn("[suscripcion] no se pudo guardar");
    return Response.json({ error: "error" }, { status: 500 });
  }
}
