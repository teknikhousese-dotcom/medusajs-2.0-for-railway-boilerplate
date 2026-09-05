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
  ensured = true
}

export async function q(pg: any, sql: string, bindings: any[] = []) {
  const r = await pg.raw(sql, bindings)
  return (r && r.rows) ? r.rows : r
}
