import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { randomUUID } from "crypto"

// Lagerbevakning (Wiki "Bevaka produkt"): raw pg table + helpers.
// Used by /store/lagerbevakning (public signup), /admin/lagerbevakning (list/import)
// and /admin/lagerbevakning/skicka (manual, button-triggered back-in-stock mails).

let ensured = false

export function getPg(scope: any): any {
  try { return scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) }
  catch { try { return scope.resolve("__pg_connection__") } catch { return null } }
}

export function genId() {
  return "strem_" + randomUUID().replace(/-/g, "")
}

export async function q(pg: any, sql: string, bindings: any[] = []): Promise<any[]> {
  const r = await pg.raw(sql, bindings)
  return (r && r.rows) ? r.rows : r
}

async function tryRaw(pg: any, sql: string) {
  try { await pg.raw(sql) } catch (e: any) { console.warn("[lagerbevakning] " + (e?.message || e)) }
}

export async function ensureTables(pg: any) {
  if (ensured || !pg || typeof pg.raw !== "function") return
  await pg.raw(`CREATE TABLE IF NOT EXISTS "stock_reminder" (
    "id" text NOT NULL,
    "email" text NOT NULL,
    "product_id" text NULL,
    "variant_id" text NULL,
    "product_title" text NULL,
    "product_handle" text NULL,
    "sku" text NULL,
    "wiki_product_id" integer NULL,
    "page_url" text NULL,
    "source" text NOT NULL DEFAULT 'storefront',
    "ip" text NULL,
    "notified_at" timestamptz NULL,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    "deleted_at" timestamptz NULL,
    CONSTRAINT "stock_reminder_pkey" PRIMARY KEY ("id"));`)
  await tryRaw(pg, `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_stock_reminder_unique" ON "stock_reminder" ("email", (COALESCE("product_id", '')), (COALESCE("wiki_product_id", 0))) WHERE "deleted_at" IS NULL AND "notified_at" IS NULL`)
  await tryRaw(pg, `CREATE INDEX IF NOT EXISTS "IDX_stock_reminder_product" ON "stock_reminder" ("product_id")`)
  ensured = true
}

export function normEmail(s: any): string {
  return String(s == null ? "" : s).trim().toLowerCase()
}

export function validEmail(e: string): boolean {
  return e.length <= 200 && /^[^@\s<>"',;]+@[^@\s<>"',;]+\.[a-z0-9-]{2,}$/i.test(e)
}

// Stock status per product, mirrors the storefront logic in product-actions:
// metadata.in_stock false/0 => out of stock; otherwise in stock if any variant
// does not manage inventory, allows backorder, or has stocked - reserved > 0.
export async function stockStatus(pg: any, productIds: string[]): Promise<Record<string, boolean>> {
  const out: Record<string, boolean> = {}
  const ids = productIds.filter(Boolean)
  if (!ids.length) return out
  try {
    const rows = await q(pg, `
      SELECT p."id",
        lower(COALESCE(p."metadata"->>'in_stock', '')) AS "meta",
        bool_or(v."id" IS NOT NULL AND (COALESCE(v."manage_inventory", true) = false OR COALESCE(v."allow_backorder", false) = true)) AS "free",
        COALESCE(SUM(COALESCE(il."stocked_quantity", 0) - COALESCE(il."reserved_quantity", 0)), 0) AS "avail"
      FROM "product" p
      LEFT JOIN "product_variant" v ON v."product_id" = p."id" AND v."deleted_at" IS NULL
      LEFT JOIN "product_variant_inventory_item" pvi ON pvi."variant_id" = v."id" AND pvi."deleted_at" IS NULL
      LEFT JOIN "inventory_level" il ON il."inventory_item_id" = pvi."inventory_item_id" AND il."deleted_at" IS NULL
      WHERE p."id" IN (${ids.map(() => "?").join(",")}) AND p."deleted_at" IS NULL
      GROUP BY p."id", p."metadata"`, ids)
    for (const r of rows || []) {
      const metaOut = r.meta === "false" || r.meta === "0"
      out[r.id] = !metaOut && (r.free === true || Number(r.avail || 0) > 0)
    }
  } catch (e: any) { console.warn("[lagerbevakning] stock " + (e?.message || e)) }
  return out
}
