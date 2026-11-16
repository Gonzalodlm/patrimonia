// Tareas con la lista de mails del aviso anual.
//
//   npm run mails -- crear      crea la tabla en Neon (una sola vez)
//   npm run mails -- exportar   escribe suscriptores.csv con cada mail y su enlace para darse de baja
//
// Necesita DATABASE_URL y SECRETO_BAJAS (y SITIO_URL para exportar) en el entorno o en .env.local.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
import { enlaceBaja, SQL_TABLA } from "../src/servidor/suscripciones";

if (existsSync(".env.local")) {
  for (const linea of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const m = linea.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
  }
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Falta DATABASE_URL");
  const sql = neon(url);
  const tarea = process.argv[2];

  if (tarea === "crear") {
    await sql.query(SQL_TABLA);
    console.log("Tabla 'suscriptores' lista.");
    return;
  }
  if (tarea === "exportar") {
    const secreto = process.env.SECRETO_BAJAS;
    if (!secreto) throw new Error("Falta SECRETO_BAJAS");
    // Sin la dirección real del sitio, los enlaces de baja apuntarían a un lugar que no existe.
    const sitio = process.env.SITIO_URL;
    if (!sitio) throw new Error("Falta SITIO_URL (la dirección pública del sitio, por ejemplo https://patrimonia-plum.vercel.app)");
    const filas = (await sql.query("SELECT email FROM suscriptores ORDER BY fecha")) as { email: string }[];
    const csv = ["email,enlace_baja", ...filas.map((f) => `${f.email},${enlaceBaja(f.email, secreto, sitio)}`)].join("\n");
    writeFileSync("suscriptores.csv", csv + "\n");
    console.log(`${filas.length} mails exportados a suscriptores.csv. No lo subas al repositorio.`);
    return;
  }
  console.log("Uso: npm run mails -- crear | exportar");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
