import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * Wiki -> Medusa data bridge (migration only, remove after cutover).
 * Called from the old Wiki admin page (origin https://teknikhouse.se) to hand over
 * raw product edit-page data. Protected by WIKI_BRIDGE_TOKEN. Rows are stored raw in
 * wiki_product_raw; /admin/wiki-sync applies them.
 */

const ALLOWED = ["https://teknikhouse.se", "https://www.teknikhouse.se"]

function cors(req: MedusaRequest, res: MedusaResponse) {
  const origin = String(req.headers.origin || "")
  if (ALLOWED.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin)
    res.setHeader("Vary", "Origin")
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
    res.setHeader("Access-Control-Allow-Headers", "content-type,x-wiki-bridge-token")
    res.setHeader("Access-Control-Max-Age", "600")
  }
}

function authorized(req: MedusaRequest) {
  const token = process.env.WIKI_BRIDGE_TOKEN || ""
  return !!token && String(req.headers["x-wiki-bridge-token"] || "") === token
}

async function ensureTable(pg: any) {
  await pg.raw(`CREATE TABLE IF NOT EXISTS "wiki_product_raw" (
    "sku" text PRIMARY KEY,
    "wiki_id" integer,
    "data" jsonb NOT NULL,
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    "applied_at" timestamptz NULL
  )`)
}

export async function OPTIONS(req: MedusaRequest, res: MedusaResponse) {
  cors(req, res)
  res.status(204).end()
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  cors(req, res)
  if (!authorized(req)) return res.status(401).json({ ok: false })
  const body: any = req.body || {}
  const items: any[] = Array.isArray(body.items) ? body.items : []
  if (!items.length) return res.json({ ok: true, stored: 0 })
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  await ensureTable(pg)
  let stored = 0
  for (const it of items) {
    const sku = String((it && it.artikelnummer) || "").trim()
    if (!sku) continue
    await pg.raw(
      `INSERT INTO "wiki_product_raw" ("sku","wiki_id","data","updated_at") VALUES (?,?,CAST(? AS jsonb),now())
       ON CONFLICT ("sku") DO UPDATE SET "wiki_id"=EXCLUDED."wiki_id","data"=EXCLUDED."data","updated_at"=now()`,
      [sku, Number(it.__wiki_id) || null, JSON.stringify(it)]
    )
    stored++
  }
  res.json({ ok: true, stored })
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  cors(req, res)
  if (!authorized(req)) return res.status(401).json({ ok: false })
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  await ensureTable(pg)
  const r = await pg.raw(`SELECT count(*)::int AS n FROM "wiki_product_raw"`)
  res.json({ ok: true, count: r.rows[0].n })
}
