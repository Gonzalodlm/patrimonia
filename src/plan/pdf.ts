// Genera el PDF del plan en el navegador. La librería (jsPDF) se carga recién al pedir la descarga.
// Usa la fuente Helvetica que trae jsPDF, que cubre los acentos y la ñ.

export interface Tabla {
  columnas: string[];
  filas: string[][];
  /** Ancho relativo de cada columna. */
  anchos?: number[];
  /** Columnas alineadas a la derecha (números). */
  derecha?: number[];
}

export interface SeccionPdf {
  titulo: string;
  parrafos?: string[];
  lista?: string[];
  tabla?: Tabla;
  /** Párrafos que van después de la tabla. */
  notas?: string[];
}

export interface ContenidoPdf {
  titulo: string;
  subtitulo: string;
  secciones: SeccionPdf[];
  avisos: string;
  nombreArchivo: string;
}

const TINTA: [number, number, number] = [27, 26, 23];
const GRIS: [number, number, number] = [102, 98, 91];
const LINEA: [number, number, number] = [210, 205, 196];

export async function descargarPdf(c: ContenidoPdf) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const ancho = 210;
  const margen = 18;
  const util = ancho - margen * 2;
  const alto = 297;
  let y = margen;

  const espacio = (mm: number) => {
    if (y + mm > alto - margen - 8) {
      doc.addPage();
      y = margen;
    }
  };
  const texto = (t: string, tam: number, color = TINTA, estilo: "normal" | "bold" = "normal", sangria = 0) => {
    doc.setFont("helvetica", estilo);
    doc.setFontSize(tam);
    doc.setTextColor(...color);
    const lineas = doc.splitTextToSize(t, util - sangria) as string[];
    const interlinea = tam * 0.45;
    for (const l of lineas) {
      espacio(interlinea);
      doc.text(l, margen + sangria, y);
      y += interlinea;
    }
  };

  // Encabezado
  doc.setFont("times", "normal");
  doc.setFontSize(24);
  doc.setTextColor(...TINTA);
  doc.text("Patrimonia", margen, y + 4);
  y += 12;
  texto(c.titulo, 15, TINTA, "bold");
  y += 1;
  texto(c.subtitulo, 9, GRIS);
  y += 4;

  for (const s of c.secciones) {
    espacio(s.tabla ? 46 : 22); // que el título no quede solo al pie de la página
    doc.setDrawColor(...LINEA);
    doc.setLineWidth(0.2);
    doc.line(margen, y, ancho - margen, y);
    y += 6;
    texto(s.titulo, 12, TINTA, "bold");
    y += 1.5;
    for (const p of s.parrafos ?? []) {
      texto(p, 10);
      y += 2;
    }
    (s.lista ?? []).forEach((item, i) => {
      espacio(6);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...TINTA);
      doc.text(`${i + 1}.`, margen, y);
      texto(item, 10, TINTA, "normal", 6);
      y += 1.5;
    });
    if (s.tabla) {
      const t = s.tabla;
      const pesos = t.anchos ?? t.columnas.map(() => 1);
      const total = pesos.reduce((a, b) => a + b, 0);
      const anchos = pesos.map((p) => (p / total) * util);
      const fila = (celdas: string[], encabezado: boolean) => {
        doc.setFont("helvetica", encabezado ? "bold" : "normal");
        doc.setFontSize(8.5);
        const partidas = celdas.map((cel, i) => doc.splitTextToSize(cel, anchos[i] - 2) as string[]);
        // Alto de la fila: el texto, y aire arriba y abajo de la línea que la separa de la siguiente.
        const h = Math.max(...partidas.map((p) => p.length)) * 3.8 + 2.4;
        espacio(h);
        doc.setTextColor(...(encabezado ? GRIS : TINTA));
        let x = margen;
        partidas.forEach((lineas, i) => {
          const der = t.derecha?.includes(i);
          // Los números van a la derecha con aire antes de la columna siguiente.
          lineas.forEach((l, k) => doc.text(l, der ? x + anchos[i] - 4 : x, y + k * 3.8, { align: der ? "right" : "left" }));
          x += anchos[i];
        });
        y += h;
        doc.setDrawColor(...LINEA);
        doc.line(margen, y - 4.2, ancho - margen, y - 4.2);
      };
      y += 1;
      fila(t.columnas, true);
      t.filas.forEach((f) => fila(f, false));
      y += 2;
    }
    for (const p of s.notas ?? []) {
      texto(p, 10);
      y += 2;
    }
    y += 3;
  }

  espacio(30);
  y += 2;
  texto("Avisos", 9, GRIS, "bold");
  y += 0.5;
  texto(c.avisos, 7.5, GRIS);

  // Numeración de páginas
  const paginas = doc.getNumberOfPages();
  for (let i = 1; i <= paginas; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...GRIS);
    // La dirección desde la que se generó: así el PDF siempre lleva una dirección que existe.
    doc.text(`${window.location.host} · página ${i} de ${paginas}`, ancho - margen, alto - 10, { align: "right" });
  }
  doc.save(c.nombreArchivo);
}
