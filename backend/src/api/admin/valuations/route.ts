import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getPg, q } from "../editable/db"

/**
 * Teknikhouse.se — admin list of trade-in valuation requests ("Sälj din enhet").
 * GET returns all requests; POST { id, status } updates one row's status.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  let rows: any[] = []
  try {
    const pg = getPg(req.scope)
    if (pg) {
      rows = await q(pg,
        `SELECT "id","reference","device_type","model","storage","condition","issues","accessories","name","email","phone","message","status","created_at"
         FROM "valuation_request" WHERE "deleted_at" IS NULL ORDER BY "created_at" DESC LIMIT 500`, [])
      rows = (rows || []).map((r: any) => ({
        ...r,
        issues: typeof r.issues === "string" ? (() => { try { return JSON.parse(r.issues) } catch { return [] } })() : (r.issues || []),
      }))
    }
  } catch { /* table may not exist yet */ }
  res.setHeader("Cache-Control", "no-store")
  return res.json({ valuations: rows || [] })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const b: any = req.body || {}
  const id = String(b.id || "")
  const status = String(b.status || "")
  try {
    const pg = getPg(req.scope)
    if (pg && id && status) {
      await q(pg, `UPDATE "valuation_request" SET "status" = ? WHERE "id" = ?`, [status, id])
    }
  } catch { /* ignore */ }
  return res.json({ ok: true })
}
