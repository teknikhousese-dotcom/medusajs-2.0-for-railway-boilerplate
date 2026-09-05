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
  await pg.raw(`CREATE TABLE IF NOT EXISTS "newsletter_subscriber" (
    "id" text NOT NULL, "email" text NOT NULL, "name" text NULL, "active" boolean NOT NULL DEFAULT true,
    "created_at" timestamptz NOT NULL DEFAULT now(), "deleted_at" timestamptz NULL,
    CONSTRAINT "newsletter_subscriber_pkey" PRIMARY KEY ("id"));`)
  await pg.raw(`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_newsletter_subscriber_email" ON "newsletter_subscriber" ("email") WHERE "deleted_at" IS NULL;`)
  await pg.raw(`CREATE TABLE IF NOT EXISTS "newsletter_campaign" (
    "id" text NOT NULL, "subject" text NOT NULL, "html" text NULL, "status" text NOT NULL DEFAULT 'draft',
    "recipients" integer NOT NULL DEFAULT 0, "sent_at" timestamptz NULL,
    "created_at" timestamptz NOT NULL DEFAULT now(), "deleted_at" timestamptz NULL,
    CONSTRAINT "newsletter_campaign_pkey" PRIMARY KEY ("id"));`)
  await pg.raw(`CREATE TABLE IF NOT EXISTS "newsletter_template" (
    "id" text NOT NULL, "name" text NOT NULL, "html" text NULL,
    "created_at" timestamptz NOT NULL DEFAULT now(), "deleted_at" timestamptz NULL,
    CONSTRAINT "newsletter_template_pkey" PRIMARY KEY ("id"));`)
  ensured = true
}
