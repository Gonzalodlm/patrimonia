// Límite de pedidos por IP y caché de respuestas, en memoria.
//
// En Vercel cada instancia del servidor tiene su propia memoria, así que el límite es aproximado
// (por instancia) y la caché se pierde cuando la instancia se apaga. Alcanza para frenar abusos
// simples y para no repetir pedidos iguales; el tope de gasto se fija además en Google Cloud.

const ventanas = new Map<string, number[]>();

/** true si la IP todavía puede hacer un pedido: como mucho `maximo` en `segundos`. */
export function permitir(ip: string, maximo: number, segundos: number, ahora = Date.now()): boolean {
  const desde = ahora - segundos * 1000;
  const previos = (ventanas.get(ip) ?? []).filter((t) => t > desde);
  if (previos.length >= maximo) {
    ventanas.set(ip, previos);
    return false;
  }
  previos.push(ahora);
  ventanas.set(ip, previos);
  if (ventanas.size > 10_000) ventanas.clear(); // no crecer sin límite
  return true;
}

/** Caché chica con vencimiento: la entrada más vieja sale primero. */
export class Cache<V> {
  private datos = new Map<string, { valor: V; vence: number }>();
  constructor(
    private maximo: number,
    private segundos: number,
  ) {}

  obtener(clave: string, ahora = Date.now()): V | undefined {
    const e = this.datos.get(clave);
    if (!e) return undefined;
    if (e.vence < ahora) {
      this.datos.delete(clave);
      return undefined;
    }
    return e.valor;
  }

  guardar(clave: string, valor: V, ahora = Date.now()) {
    if (this.datos.size >= this.maximo) this.datos.delete(this.datos.keys().next().value!);
    this.datos.set(clave, { valor, vence: ahora + this.segundos * 1000 });
  }
}
