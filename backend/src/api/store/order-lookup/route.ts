import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { getPg, q } from "../../admin/editable/db"

/**
 * Teknikhouse.se — public order lookup for the return flow.
 * Finds the order by its number: the old wiki id lives in metadata.wiki_order_id,
 * new orders use display_id. Uses a JSONB text match (->>'wiki_order_id') so it
 * matches whether the id was stored as a string or a number. Privacy-gated:
 * the e-mail must match the order too.
 */
export const AUTHENTICATE = false

async function findOrderId(pg: any, num: string): Promise<string | null> {
  if (!pg) return null
  try {
    let rows = await q(pg, `SELECT "id" FROM "order" WHERE "metadata"->>'wiki_order_id' = ? AND "deleted_at" IS NULL LIMIT 1`, [String(num)])
    if (rows && rows[0]) return rows[0].id
    const n = parseInt(String(num), 10)
    if (!isNaN(n)) {
      rows = await q(pg, `SELECT "id" FROM "order" WHERE "display_id" = ? AND "deleted_at" IS NULL LIMIT 1`, [n])
      if (rows && rows[0]) return rows[0].id
    }
  } catch { /* table/column mismatch -> treated as not found */ }
  return null
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query: any = req.query || {}
  const email = String(query.email || "").trim().toLowerCase()
  const num = String(query.order || query.ordernummer || "").trim()
  res.setHeader("Cache-Control", "no-store")
  if (!email || !num) return res.status(400).json({ error: "Ange både ordernummer och e-postadress." })
  try {
    const pg = getPg(req.scope)
    const orderId = await findOrderId(pg, num)
    if (!orderId) return res.status(404).json({ error: "Vi hittade ingen order med det ordernumret." })
    const orderModule: any = req.scope.resolve(Modules.ORDER)
    const [order] = await orderModule.listOrders({ id: orderId }, { relations: ["items"], take: 1 }).catch(() => [])
    if (!order) return res.status(404).json({ error: "Vi hittade ingen order med det ordernumret." })
    if (String(order.email || "").toLowerCase() !== email) {
      return res.status(403).json({ error: "E-postadressen matchar inte den här ordern." })
    }
    const items = (order.items || []).map((it: any) => ({
      id: it.id,
      title: it.title,
      sku: (it.metadata && it.metadata.sku) || it.variant_sku || "",
      quantity: it.quantity,
    }))
    return res.json({ ok: true, order: { id: order.id, number: num, display_id: order.display_id, created_at: order.created_at, items } })
  } catch (e: any) {
    return res.status(500).json({ error: String((e && e.message) || e).slice(0, 160) })
  }
}
