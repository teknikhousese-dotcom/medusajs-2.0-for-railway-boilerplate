import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { randomUUID } from "crypto"

let ensured = false

export function getPg(scope: any): any {
  try { return scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) }
  catch { try { return scope.resolve("__pg_connection__") } catch { return null } }
}
export function genId(prefix: string) { return prefix + "_" + randomUUID().replace(/-/g, "") }
export async function q(pg: any, sql: string, bindings: any[] = []) {
  const r = await pg.raw(sql, bindings); return (r && r.rows) ? r.rows : r
}
export async function ensureTables(pg: any) {
  if (ensured || !pg || typeof pg.raw !== "function") return
  await pg.raw(`CREATE TABLE IF NOT EXISTS "news_article" (
    "id" text NOT NULL, "title" text NOT NULL, "slug" text NULL, "article_date" date NULL,
    "body" text NULL, "image_url" text NULL, "published" boolean NOT NULL DEFAULT true,
    "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(),
    "deleted_at" timestamptz NULL, CONSTRAINT "news_article_pkey" PRIMARY KEY ("id"));`)
  ensured = true
}
