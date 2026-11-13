// Mails de quienes piden el aviso anual. Se guarda SOLO el mail, la fecha y la versión del
// consentimiento. Ningún dato financiero queda asociado al mail.
//
// Base: Neon Postgres (variable DATABASE_URL). El enlace para darse de baja lleva una firma
// (HMAC del mail con SECRETO_BAJAS), así que no hace falta guardar ningún código por persona.
import { createHmac, timingSafeEqual } from "node:crypto";
import { neon } from "@neondatabase/serverless";

export const SQL_TABLA = `CREATE TABLE IF NOT EXISTS suscriptores (
  email TEXT PRIMARY KEY,
  fecha TIMESTAMPTZ NOT NULL DEFAULT now(),
  version_consentimiento TEXT NOT NULL
);`;

export function normalizarMail(mail: string): string | null {
  const m = mail.trim().toLowerCase();
  if (m.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(m)) return null;
  return m;
}

export function firmaBaja(mail: string, secreto: string): string {
  return createHmac("sha256", secreto).update(mail).digest("hex").slice(0, 32);
}

export function firmaValida(mail: string, firma: string, secreto: string): boolean {
  const esperada = Buffer.from(firmaBaja(mail, secreto));
  const recibida = Buffer.from(firma);
  return esperada.length === recibida.length && timingSafeEqual(esperada, recibida);
}

export function enlaceBaja(mail: string, secreto: string, sitio: string): string {
  return `${sitio.replace(/\/$/, "")}/baja?e=${encodeURIComponent(mail)}&t=${firmaBaja(mail, secreto)}`;
}

function base() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  return neon(url);
}

export const configurado = () => !!process.env.DATABASE_URL && !!process.env.SECRETO_BAJAS;

export async function guardarSuscripcion(mail: string, version: string): Promise<void> {
  const sql = base();
  if (!sql) throw new Error("Falta DATABASE_URL");
  await sql.query(
    "INSERT INTO suscriptores (email, version_consentimiento) VALUES ($1, $2) ON CONFLICT (email) DO UPDATE SET fecha = now(), version_consentimiento = EXCLUDED.version_consentimiento",
    [mail, version],
  );
}

export async function borrarSuscripcion(mail: string): Promise<void> {
  const sql = base();
  if (!sql) throw new Error("Falta DATABASE_URL");
  await sql.query("DELETE FROM suscriptores WHERE email = $1", [mail]);
}
