import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { randomUUID } from "crypto"

let ensured = false

export function getPg(scope: any): any {
  try { return scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) }
  catch { try { return scope.resolve("__pg_connection__") } catch { return null } }
}
export function genId(prefix: string) { return prefix + "_" + randomUUID().replace(/-/g, "") }
export function slugify(s: string) { return (s || "").toLowerCase().replace(/[åä]/g, "a").replace(/ö/g, "o").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) }
export async function q(pg: any, sql: string, bindings: any[] = []) {
  const r = await pg.raw(sql, bindings)
  return (r && r.rows) || []
}

export async function ensureTables(pg: any) {
  if (ensured || !pg || typeof pg.raw !== "function") return
  await pg.raw(`CREATE TABLE IF NOT EXISTS "blog_post" (
    "id" text PRIMARY KEY,
    "title" text NOT NULL,
    "slug" text DEFAULT '',
    "body_html" text DEFAULT '',
    "is_published" boolean DEFAULT true,
    "published_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
  )`)
  ensured = true
}
