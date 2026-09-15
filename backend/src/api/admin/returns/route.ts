import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getPg, q } from "../editable/db"

/**
 * Teknikhouse.se — admin read of return_requests for a given order.
 * Consumed by the order-details widget (src/admin/widgets/order-returns.tsx).
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const orderId = String((req.query as any)?.order_id || "")
  let rows: any[] = []
  try {
    const pg = getPg(req.scope)
    if (pg && orderId) {
      rows = await q(pg,
        `SELECT "id","reference","order_display","email","type","items","message","status","created_at"
         FROM "return_request" WHERE "order_id" = ? AND "deleted_at" IS NULL ORDER BY "created_at" DESC`,
        [orderId])
      rows = (rows || []).map((r: any) => ({
        ...r,
        items: typeof r.items === "string" ? (() => { try { return JSON.parse(r.items) } catch { return [] } })() : (r.items || []),
      }))
    }
  } catch { /* table may not exist yet */ }
  res.setHeader("Cache-Control", "no-store")
  return res.json({ returns: rows || [] })
}
