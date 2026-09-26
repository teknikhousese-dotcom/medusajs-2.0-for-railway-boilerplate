import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { randomUUID } from "crypto"

let ensured = false

export function getPg(scope: any): any {
  try { return scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) }
  catch { try { return scope.resolve("__pg_connection__") } catch { return null } }
}

export function genId(prefix: string) {
  return prefix + "_" + randomUUID().replace(/-/g, "")
}

async function tryRaw(pg: any, sql: string) {
  try { await pg.raw(sql) } catch (e: any) { console.warn("[purchasing] " + (e?.message || e)) }
}

export async function ensureTables(pg: any) {
  if (ensured || !pg || typeof pg.raw !== "function") return
  await pg.raw(`CREATE TABLE IF NOT EXISTS "supplier" (
    "id" text NOT NULL, "name" text NOT NULL, "email" text NULL,
    "ref_first_name" text NULL, "ref_last_name" text NULL,
    "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(),
    "deleted_at" timestamptz NULL, CONSTRAINT "supplier_pkey" PRIMARY KEY ("id"));`)
  await pg.raw(`CREATE TABLE IF NOT EXISTS "purchase_order" (
    "id" text NOT NULL, "supplier_id" text NOT NULL, "supplier_name" text NULL,
    "status" text NOT NULL DEFAULT 'open', "reference" text NULL,
    "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(),
    "deleted_at" timestamptz NULL, CONSTRAINT "purchase_order_pkey" PRIMARY KEY ("id"));`)
  await pg.raw(`CREATE TABLE IF NOT EXISTS "purchase_order_line" (
    "id" text NOT NULL, "purchase_order_id" text NOT NULL, "variant_id" text NULL,
    "product_id" text NULL, "inventory_item_id" text NULL, "title" text NOT NULL, "sku" text NULL,
    "qty_ordered" integer NOT NULL DEFAULT 0, "qty_delivered" integer NOT NULL DEFAULT 0,
    "min_stock" integer NOT NULL DEFAULT 0, "cost" numeric NULL,
    "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(),
    "deleted_at" timestamptz NULL, CONSTRAINT "purchase_order_line_pkey" PRIMARY KEY ("id"));`)
  await tryRaw(pg, `ALTER TABLE "supplier" ADD COLUMN IF NOT EXISTS "wiki_id" integer NULL`)
  await tryRaw(pg, `ALTER TABLE "supplier" ADD COLUMN IF NOT EXISTS "metadata" jsonb NULL`)
  await tryRaw(pg, `ALTER TABLE "purchase_order" ADD COLUMN IF NOT EXISTS "wiki_id" integer NULL`)
  await tryRaw(pg, `ALTER TABLE "purchase_order" ADD COLUMN IF NOT EXISTS "sent_at" timestamptz NULL`)
  await tryRaw(pg, `ALTER TABLE "purchase_order" ADD COLUMN IF NOT EXISTS "archived_at" timestamptz NULL`)
  await tryRaw(pg, `ALTER TABLE "purchase_order" ADD COLUMN IF NOT EXISTS "comment" text NULL`)
  await tryRaw(pg, `ALTER TABLE "purchase_order" ADD COLUMN IF NOT EXISTS "metadata" jsonb NULL`)
  ensured = true
}

export async function q(pg: any, sql: string, bindings: any[] = []) {
  const r = await pg.raw(sql, bindings)
  return (r && r.rows) ? r.rows : r
}

export function normName(s: any) {
  return String(s == null ? "" : s).trim().toLowerCase()
}

// Count products per supplier: metadata.leverantor (name) or metadata.supplier_id.
export async function supplierProductCounts(pg: any): Promise<{ byName: Record<string, number>; byId: Record<string, number> }> {
  const byName: Record<string, number> = {}
  const byId: Record<string, number> = {}
  try {
    const rows = await q(pg, `SELECT lower(trim(COALESCE("metadata"->>'leverantor', ''))) AS "n", COALESCE("metadata"->>'supplier_id', '') AS "sid", count(*)::int AS "c" FROM "product" WHERE "deleted_at" IS NULL GROUP BY 1, 2`)
    for (const r of rows || []) {
      if (r.n) byName[r.n] = (byName[r.n] || 0) + Number(r.c || 0)
      else if (r.sid) byId[r.sid] = (byId[r.sid] || 0) + Number(r.c || 0)
    }
  } catch (e: any) { console.warn("[purchasing] count " + (e?.message || e)) }
  return { byName, byId }
}
