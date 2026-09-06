import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { randomUUID } from "crypto"

let ensured = false

export function getPg(scope: any): any {
  try { return scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) }
  catch { try { return scope.resolve("__pg_connection__") } catch { return null } }
}
export function genId(prefix: string) { return prefix + "_" + randomUUID().replace(/-/g, "") }
export async function q(pg: any, sql: string, bindings: any[] = []) {
  const r = await pg.raw(sql, bindings)
  return (r && r.rows) || []
}

const SYSTEM = [
  "Följesedel", "Glömt lösenord", "Kampanjutskick", "Lagerbevakning",
  "Leveransnotis", "Nytt inloggningskonto", "Returbekräftelse (kund)",
  "Returnotis (butik)", "Uppföljningsmail", "Uppföljningsmail - Belöning",
]

export async function ensureTables(pg: any) {
  if (ensured || !pg || typeof pg.raw !== "function") return
  await pg.raw(`CREATE TABLE IF NOT EXISTS "email_template" (
    "id" text PRIMARY KEY,
    "name" text NOT NULL,
    "subject" text DEFAULT '',
    "body_html" text DEFAULT '',
    "is_system" boolean DEFAULT false,
    "updated_at" timestamptz DEFAULT now()
  )`)
  for (const name of SYSTEM) {
    const id = "etpl_sys_" + name.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()
    await pg.raw(`INSERT INTO "email_template" ("id","name","is_system") VALUES (?, ?, true) ON CONFLICT ("id") DO NOTHING`, [id, name])
  }
  ensured = true
}
