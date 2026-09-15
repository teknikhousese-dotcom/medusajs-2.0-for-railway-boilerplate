import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

/**
 * Teknikhouse.se — public order lookup for the return flow.
 * Verifies an order by its number (old wiki id in metadata.wiki_order_id, or the
 * native display_id) AND a matching e-mail, then returns its line items so the
 * customer can pick what to return. Privacy-gated: both number and e-mail must match.
 */
export const AUTHENTICATE = false

async function findOrder(orderModule: any, num: string) {
  let list = await orderModule.listOrders({ metadata: { wiki_order_id: num } }, { relations: ["items"], take: 1 }).catch(() => [])
  if (list && list[0]) return list[0]
  const asNum = parseInt(String(num), 10)
  if (!isNaN(asNum)) {
    list = await orderModule.listOrders({ display_id: asNum }, { relations: ["items"], take: 1 }).catch(() => [])
    if (list && list[0]) return list[0]
  }
  return null
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query: any = req.query || {}
  const email = String(query.email || "").trim().toLowerCase()
  const num = String(query.order || query.ordernummer || "").trim()
  res.setHeader("Cache-Control", "no-store")
  if (!email || !num) return res.status(400).json({ error: "Ange både ordernummer och e-postadress." })
  try {
    const orderModule: any = req.scope.resolve(Modules.ORDER)
    const order = await findOrder(orderModule, num)
    if (!order || String(order.email || "").toLowerCase() !== email) {
      return res.status(404).json({ error: "Vi hittade ingen order med den kombinationen av ordernummer och e-post." })
    }
    const items = (order.items || []).map((it: any) => ({
      id: it.id,
      title: it.title,
      sku: (it.metadata && it.metadata.sku) || it.variant_sku || "",
      quantity: it.quantity,
    }))
    return res.json({
      ok: true,
      order: {
        id: order.id,
        number: num,
        display_id: order.display_id,
        created_at: order.created_at,
        items,
      },
    })
  } catch (e: any) {
    return res.status(500).json({ error: String((e && e.message) || e).slice(0, 160) })
  }
}
