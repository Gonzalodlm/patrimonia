// Interfaz propia para el modelo de lenguaje. Para cambiar de proveedor alcanza con escribir otra
// implementación de `ProveedorTexto` y elegirla en `index.ts`.

export interface PedidoModelo {
  /** Instrucciones fijas (cómo escribir, qué no hacer). */
  sistema: string;
  /** Lo que se le pide, con los datos. */
  mensaje: string;
  maxTokens: number;
  /** Para cortar el pedido si tarda demasiado. */
  senal: AbortSignal;
}

export interface ProveedorTexto {
  nombre: string;
  redactar(pedido: PedidoModelo): Promise<string>;
}

/** Error con un motivo corto, para el registro del servidor (sin datos de la persona). */
export class ErrorModelo extends Error {
  constructor(
    public motivo: "sin_cupo" | "limite" | "rechazo" | "red" | "formato",
    detalle: string,
  ) {
    super(`${motivo}: ${detalle}`);
  }
}
