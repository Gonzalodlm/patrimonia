// Lo que se le manda al modelo de lenguaje: solo valores estructurados y anónimos, ya formateados
// como se muestran en la web (así el modelo los copia tal cual y se pueden verificar).
// Nunca el mail, el nombre ni texto libre escrito por la persona: los objetivos van por categoría.

export interface DatosTextoCartera {
  perfil: string;
  cartera: "simple" | "diversificada";
  retornoPorAnio: string;
  riesgo: string;
  sharpe: string;
  grupos: { grupo: string; peso: string }[];
  principales: { clase: string; peso: string }[];
  caidaEnAnioMalo: string;
  riesgoCarteraMaximoSharpe: string;
  /** Qué definió el perfil: "tolerancia", "capacidad", "ambos", "horizonte" o "eleccion" (la persona eligió uno más conservador). */
  motivoPerfil: string;
}

export interface DatosTextoPlan {
  perfil: string;
  ahorroMensual: string;
  colchon: { estado: "completo" | "falta" | "sin_datos" | "propio"; faltante?: string; mesesParaCompletar?: string };
  deudasACancelar: number;
  objetivos: { tipo: string; plazo: string; prioridad: string; estado: string; ahorroMensual: string; probabilidad: string }[];
  faltantePorMes: string | null;
  sobrantePorMes: string | null;
  patrimonio: { anio: string; medio: string };
  /** Códigos de los próximos pasos (ver `pasosConocidos`), nunca texto libre. */
  proximosPasos: string[];
}

/** Los próximos pasos posibles, por código. El modelo recibe la descripción, no texto de la persona. */
export const pasosConocidos: Record<string, string> = {
  calcular_colchon: "calcular sus gastos y separar entre 3 y 6 meses como fondo de emergencia",
  completar_colchon: "completar el fondo de emergencia en liquidez en dólares",
  cancelar_deuda: "cancelar deudas de consumo antes de invertir",
  abrir_broker: "abrir una cuenta en un broker con acceso a bolsas europeas",
  programar_aporte: "programar un aporte mensual y repartirlo entre las carteras de sus objetivos",
  invertir_ahorros: "invertir sus ahorros en las carteras de sus objetivos",
  ajustar_objetivos: "decidir qué ajustar: ahorrar más, esperar más o bajar algún objetivo",
  revisar_anual: "revisar el plan una vez por año al rebalancear",
};

export const categoriasObjetivo = ["fondo de emergencia", "casa", "auto", "educación de los hijos", "viaje", "retiro", "otro objetivo"];
export const prioridadesTexto = ["imprescindible", "importante", "deseable"];
export const estadosTexto = ["cubierto", "cubierto a medias", "sin cubrir"];
export const gruposTexto = ["Liquidez", "Renta fija", "Acciones", "Inmobiliario, oro y materias primas"];

export type PedidoTexto = { tipo: "cartera"; datos: DatosTextoCartera } | { tipo: "plan"; datos: DatosTextoPlan };
