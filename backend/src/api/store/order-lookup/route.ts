import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { getPg, q } from "../../admin/editable/db"

/**
 * Teknikhouse.se — public order lookup for the return flow.
 * Tries several ways to match the order number (JSONB wiki_order_id as text,
 * order-module metadata filter as string/number, and display_id), reports which
 * one hit via _via for diagnostics. E-mail must match too (privacy gate).
 */
export const AUTHENTICATE = false

async function findOrder(req: MedusaRequest, num: string): Promise<{ id: string | null; via: string; probe?: any }> {
  const n = parseInt(String(num), 10)
  const om: any = req.scope.resolve(Modules.ORDER)
  const pg = getPg(req.scope)
  // 1) raw SQL JSONB text match on candidate table names
  if (pg) {
    for (const tbl of ['"order"', '"orders"']) {
      try {
        const rows = await q(pg, 'SELECT "id" FROM ' + tbl + ' WHERE "metadata"->>' + "'wiki_order_id'" + ' = ? LIMIT 1', [String(num)])
        if (rows && rows[0]) return { id: rows[0].id, via: "sql:" + tbl }
      } catch { /* wrong table */ }
    }
  }
  // 2) order-module metadata filter (string then number)
  try {
    let l = await om.listOrders({ metadata: { wiki_order_id: String(num) } }, { take: 1 }).catch(() => [])
    if (l && l[0]) return { id: l[0].id, via: "mod:str" }
    if (!isNaN(n)) {
      l = await om.listOrders({ metadata: { wiki_order_id: n } }, { take: 1 }).catch(() => [])
      if (l && l[0]) return { id: l[0].id, via: "mod:num" }
    }
  } catch { /* */ }
  // 3) native display_id
  if (!isNaN(n)) {
    try { const l = await om.listOrders({ display_id: n }, { take: 1 }).catch(() => []); if (l && l[0]) return { id: l[0].id, via: "display_id" } } catch { /* */ }
  }
  // probe: shape of one order's metadata (keys + wiki id sample, no PII)
  let probe: any = undefined
  try {
    const [one] = await om.listOrders({}, { take: 1 })
    if (one) probe = { metaKeys: Object.keys(one.metadata || {}), wiki: one.metadata ? one.metadata.wiki_order_id : undefined, wikiType: one.metadata ? typeof one.metadata.wiki_order_id : "none", display_id: one.display_id }
  } catch { /* */ }
  return { id: null, via: "none", probe }
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query: any = req.query || {}
  const email = String(query.email || "").trim().toLowerCase()
  const num = String(query.order || query.ordernummer || "").trim()
  res.setHeader("Cache-Control", "no-store")
  if (!email || !num) return res.status(400).json({ error: "Ange både ordernummer och e-postadress." })
  try {
    const f = await findOrder(req, num)
    if (!f.id) return res.status(404).json({ error: "Vi hittade ingen order med det ordernumret.", _via: f.via, _probe: f.probe })
    const om: any = req.scope.resolve(Modules.ORDER)
    const [order] = await om.listOrders({ id: f.id }, { relations: ["items"], take: 1 }).catch(() => [])
    if (!order) return res.status(404).json({ error: "Vi hittade ingen order med det ordernumret." })
    if (String(order.email || "").toLowerCase() !== email) return res.status(403).json({ error: "E-postadressen matchar inte den här ordern.", _via: f.via })
    const items = (order.items || []).map((it: any) => ({ id: it.id, title: it.title, sku: (it.metadata && it.metadata.sku) || it.variant_sku || "", quantity: it.quantity }))
    return res.json({ ok: true, _via: f.via, order: { id: order.id, number: num, display_id: order.display_id, created_at: order.created_at, items } })
  } catch (e: any) {
    return res.status(500).json({ error: String((e && e.message) || e).slice(0, 160) })
  }
}
