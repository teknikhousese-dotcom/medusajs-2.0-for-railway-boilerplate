import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

let ensured = false

export function getPg(scope: any): any {
  try { return scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) }
  catch { try { return scope.resolve("__pg_connection__") } catch { return null } }
}
export async function q(pg: any, sql: string, bindings: any[] = []) {
  const r = await pg.raw(sql, bindings)
  return (r && r.rows) || []
}

export async function ensureTables(pg: any) {
  if (ensured || !pg || typeof pg.raw !== "function") return
  await pg.raw(`CREATE TABLE IF NOT EXISTS "google_feed_setting" (
    "id" text PRIMARY KEY,
    "feed_mode" int NOT NULL DEFAULT 0,
    "universal_category" text NOT NULL DEFAULT '',
    "updated_at" timestamptz DEFAULT now()
  )`)
  await pg.raw(`INSERT INTO "google_feed_setting" ("id","feed_mode","universal_category") VALUES ('default', 0, '') ON CONFLICT ("id") DO NOTHING`)
  ensured = true
}

export async function getSettings(pg: any) {
  await ensureTables(pg)
  const rows = await q(pg, `SELECT "feed_mode","universal_category" FROM "google_feed_setting" WHERE "id"='default'`)
  const s = rows[0] || {}
  return { feed_mode: Number(s.feed_mode) || 0, universal_category: s.universal_category || "" }
}
