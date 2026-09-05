import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { randomUUID } from "crypto"

let ensured = false

export function getPg(scope: any): any {
  try { return scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) }
  catch { try { return scope.resolve("__pg_connection__") } catch { return null } }
}
export function genId(prefix: string) { return prefix + "_" + randomUUID().replace(/-/g, "") }

export async function ensureTables(pg: any) {
  if (ensured || !pg || typeof pg.raw !== "function") return
  await pg.raw(`CREATE TABLE IF NOT EXISTS "recommendation_slot" (
    "id" text NOT NULL, "title" text NOT NULL, "placement" text NOT NULL,
    "slot_type" text NOT NULL DEFAULT 'bestsellers', "scope" text NOT NULL DEFAULT 'global',
    "category_id" text NULL, "active" boolean NOT NULL DEFAULT true, "position" integer NOT NULL DEFAULT 0,
    "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(),
    "deleted_at" timestamptz NULL, CONSTRAINT "recommendation_slot_pkey" PRIMARY KEY ("id"));`)
  await pg.raw(`CREATE TABLE IF NOT EXISTS "recommendation_config" (
    "id" text NOT NULL, "viewed_days" integer NOT NULL DEFAULT 90, "ordered_days" integer NOT NULL DEFAULT 90,
    "not_selling_days" integer NOT NULL DEFAULT 90, "statistics_days" integer NOT NULL DEFAULT 90,
    "updated_at" timestamptz NOT NULL DEFAULT now(), CONSTRAINT "recommendation_config_pkey" PRIMARY KEY ("id"));`)
  ensured = true
}
export async function q(pg: any, sql: string, bindings: any[] = []) {
  const r = await pg.raw(sql, bindings); return (r && r.rows) ? r.rows : r
}
export async function getConfig(pg: any) {
  const rows = await q(pg, `SELECT * FROM "recommendation_config" WHERE id = 'default'`)
  if (rows.length) return rows[0]
  await q(pg, `INSERT INTO "recommendation_config" (id) VALUES ('default') ON CONFLICT (id) DO NOTHING`)
  const r2 = await q(pg, `SELECT * FROM "recommendation_config" WHERE id = 'default'`)
  return r2[0]
}
