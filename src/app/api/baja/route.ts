// Borra un mail de la lista. Responde igual exista o no, para no revelar quién está suscripto.
import { permitir } from "@/servidor/limites";
import { ipDe, leerJson } from "@/servidor/pedidos";
import { borrarSuscripcion, configurado, firmaValida, normalizarMail } from "@/servidor/suscripciones";

export async function POST(request: Request) {
  if (!configurado()) return Response.json({ error: "no_configurado" }, { status: 503 });
  // Tope de intentos: nadie puede probar firmas en masa.
  if (!permitir(`baja:${ipDe(request)}`, 20, 3600)) return Response.json({ error: "demasiados_pedidos" }, { status: 429 });
  const cuerpo = (await leerJson(request, 2000)) as { email?: unknown; firma?: unknown } | null;
  const mail = typeof cuerpo?.email === "string" ? normalizarMail(cuerpo.email) : null;
  const firma = typeof cuerpo?.firma === "string" ? cuerpo.firma : "";
  if (!mail || !firmaValida(mail, firma, process.env.SECRETO_BAJAS!)) return Response.json({ error: "enlace_invalido" }, { status: 400 });
  try {
    await borrarSuscripcion(mail);
    return Response.json({ ok: true });
  } catch {
    console.warn("[baja] no se pudo borrar");
    return Response.json({ error: "error" }, { status: 500 });
  }
}
