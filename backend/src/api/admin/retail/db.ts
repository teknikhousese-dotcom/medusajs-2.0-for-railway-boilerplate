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
  await pg.raw(`CREATE TABLE IF NOT EXISTS "retail_pricelist" (
    "id" text NOT NULL, "name" text NOT NULL, "default_percent" numeric NULL,
    "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(),
    "deleted_at" timestamptz NULL, CONSTRAINT "retail_pricelist_pkey" PRIMARY KEY ("id"));`)
  await pg.raw(`CREATE TABLE IF NOT EXISTS "retail_customer" (
    "id" text NOT NULL, "orgnr" text NULL, "company_name" text NULL,
    "first_name" text NULL, "last_name" text NULL, "street" text NULL,
    "zip_code" text NULL, "city" text NULL, "country" text NULL DEFAULT 'Sverige',
    "telephone" text NULL, "cellphone" text NULL, "email" text NULL,
    "free_shipping" boolean NOT NULL DEFAULT false, "pricelist_id" text NULL,
    "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(),
    "deleted_at" timestamptz NULL, CONSTRAINT "retail_customer_pkey" PRIMARY KEY ("id"));`)
  ensured = true
}

export async function q(pg: any, sql: string, bindings: any[] = []) {
  const r = await pg.raw(sql, bindings)
  return (r && r.rows) ? r.rows : r
}
