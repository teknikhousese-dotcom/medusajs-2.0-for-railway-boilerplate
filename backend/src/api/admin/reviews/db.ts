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
  await q(pg, `CREATE TABLE IF NOT EXISTS "product_review" (
    id text PRIMARY KEY,
    product_id text NOT NULL DEFAULT '',
    product_title text NOT NULL DEFAULT '',
    author text NOT NULL DEFAULT '',
    rating int NOT NULL DEFAULT 5,
    comment text NOT NULL DEFAULT '',
    is_read boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz
  )`)
  ensured = true
}
