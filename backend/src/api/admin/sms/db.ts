import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { randomUUID } from "crypto"
let ensured = false
export function getPg(scope: any): any {
  try { return scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) }
  catch { try { return scope.resolve("__pg_connection__") } catch { return null } }
}
export function genId(p: string) { return p + "_" + randomUUID().replace(/-/g, "") }
export async function q(pg: any, sql: string, b: any[] = []) { const r = await pg.raw(sql, b); return (r && r.rows) ? r.rows : r }
export async function ensureTables(pg: any) {
  if (ensured || !pg || typeof pg.raw !== "function") return
  await pg.raw(`CREATE TABLE IF NOT EXISTS "sms_campaign" (
    "id" text NOT NULL, "sender" text NULL, "message" text NOT NULL, "recipient_type" text NOT NULL DEFAULT 'all',
    "recipient_number" text NULL, "status" text NOT NULL DEFAULT 'draft', "recipients" integer NOT NULL DEFAULT 0,
    "scheduled_at" timestamptz NULL, "created_at" timestamptz NOT NULL DEFAULT now(), "deleted_at" timestamptz NULL,
    CONSTRAINT "sms_campaign_pkey" PRIMARY KEY ("id"));`)
  ensured = true
}
