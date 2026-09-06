import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getPg, q, getSettings, ensureTables } from "./db"

function baseUrl(req: MedusaRequest) {
  const proto = (req.headers["x-forwarded-proto"] as string) || "https"
  const host = (req.headers["x-forwarded-host"] as string) || req.headers.host || ""
  return `${proto}://${host}`
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const pg = getPg(req.scope)
  const settings = await getSettings(pg)
  const b = baseUrl(req)
  res.json({
    settings,
    feed_url: `${b}/google-feed`,
    inventory_feed_url: `${b}/google-feed-inventory`,
  })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const pg = getPg(req.scope)
  await ensureTables(pg)
  const body: any = req.body || {}
  const mode = Number(body.feed_mode) === 1 ? 1 : 0
  const cat = typeof body.universal_category === "string" ? body.universal_category.trim() : ""
  await q(pg, `UPDATE "google_feed_setting" SET "feed_mode"=?, "universal_category"=?, "updated_at"=now() WHERE "id"='default'`, [mode, cat])
  res.json({ ok: true })
}
