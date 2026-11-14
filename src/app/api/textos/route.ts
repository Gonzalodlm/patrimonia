// Redacta la explicación de la cartera o el resumen del plan con el modelo de lenguaje.
// Si algo falla (sin clave, sin cupo, tarda, respuesta inválida) devuelve un código de error y
// el navegador muestra el texto de plantilla. Nunca se registra el contenido de los pedidos.
import { createHash } from "node:crypto";
import clases from "@datos/clases.json";
import perfiles from "@datos/perfiles.json";
import { proveedorConfigurado } from "@/servidor/modelo";
import { ErrorModelo } from "@/servidor/modelo/proveedor";
import { Cache, permitir } from "@/servidor/limites";
import { validarPedido } from "@/textos/pedido";
import { mensajePara, SISTEMA } from "@/textos/instrucciones";
import { revisarTexto, sinSaludo } from "@/textos/validar";

const listas = {
  perfiles: perfiles.perfiles.map((p) => p.nombre),
  clases: clases.clases.map((c) => c.nombre),
};
const cache = new Cache<string>(2000, 7 * 24 * 3600);
const ESPERA_MAXIMA_MS = 6000;
const MAX_PALABRAS_PLAN = 200;

function ipDe(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim() || request.headers.get("x-real-ip") || "desconocida";
}

export async function POST(request: Request) {
  const proveedor = proveedorConfigurado();
  if (!proveedor) return Response.json({ error: "sin_modelo" }, { status: 503 });

  const cuerpo = await request.json().catch(() => null);
  const pedido = validarPedido(cuerpo, listas);
  if (!pedido) return Response.json({ error: "pedido_invalido" }, { status: 400 });

  // Muchos usuarios comparten perfil: la misma combinación de datos se responde desde la caché.
  const clave = createHash("sha256").update(JSON.stringify(pedido)).digest("hex");
  const guardado = cache.obtener(clave);
  if (guardado) return Response.json({ texto: guardado, origen: "cache" });

  if (!permitir(ipDe(request), 12, 10 * 60)) return Response.json({ error: "demasiados_pedidos" }, { status: 429 });

  const corte = new AbortController();
  const reloj = setTimeout(() => corte.abort(), ESPERA_MAXIMA_MS);
  try {
    // El resumen del plan puede tener muchos objetivos: se le da más lugar que a la explicación de la cartera.
    const esPlan = pedido.tipo === "plan";
    const texto = sinSaludo(await proveedor.redactar({ sistema: SISTEMA, mensaje: mensajePara(pedido), maxTokens: esPlan ? 550 : 400, senal: corte.signal }));
    const revision = revisarTexto(texto, pedido.datos, esPlan ? MAX_PALABRAS_PLAN : undefined);
    if (!revision.valido) {
      console.warn(`[textos] respuesta descartada (${pedido.tipo}): ${revision.motivo}`);
      return Response.json({ error: "respuesta_invalida" }, { status: 502 });
    }
    cache.guardar(clave, texto);
    return Response.json({ texto, origen: "modelo" });
  } catch (e) {
    const motivo = e instanceof ErrorModelo ? e.message : corte.signal.aborted ? "tiempo agotado" : "error";
    console.warn(`[textos] sin texto del modelo (${pedido.tipo}): ${motivo}`);
    return Response.json({ error: "modelo_no_disponible" }, { status: 503 });
  } finally {
    clearTimeout(reloj);
  }
}
