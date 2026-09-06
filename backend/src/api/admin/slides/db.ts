import { randomUUID } from "crypto"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export function getPg(scope: any) {
  try { return scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) } catch {}
  try { return scope.resolve("__pg_connection__") } catch {}
  return null
}
export function genId(prefix: string) { return prefix + "_" + randomUUID().replace(/-/g, "") }
export async function q(pg: any, sql: string, bindings: any[] = []) {
  const res = await pg.raw(sql, bindings)
  return res && res.rows ? res.rows : []
}
let ensured = false
export async function ensureTables(pg: any) {
  if (ensured) return
  await q(pg, `CREATE TABLE IF NOT EXISTS "home_slide" (
    id text PRIMARY KEY,
    image_url text NOT NULL DEFAULT '',
    link_url text NOT NULL DEFAULT '',
    title text NOT NULL DEFAULT '',
    ingress text NOT NULL DEFAULT '',
    bg_color text NOT NULL DEFAULT '#ffffff',
    active boolean NOT NULL DEFAULT true,
    position int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz
  )`)
  ensured = true
}
