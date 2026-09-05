import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PURCHASING_MODULE } from "../../../../modules/purchasing"
import { ensureTables } from "../ensure"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  await ensureTables(req.scope)
  const service: any = req.scope.resolve(PURCHASING_MODULE)
  const status = (req.query.status as string) || undefined
  const filter: any = {}
  if (status) filter.status = status
  const orders = await service.listPurchaseOrders(filter, { order: { created_at: "DESC" }, take: 1000 })
  const ids = orders.map((o: any) => o.id)
  let lines: any[] = []
  if (ids.length) lines = await service.listPurchaseOrderLines({ purchase_order_id: ids }, { take: 100000 })
  const byPo: Record<string, any[]> = {}
  for (const l of lines) (byPo[l.purchase_order_id] ||= []).push(l)
  const out = orders.map((o: any) => {
    const ls = byPo[o.id] || []
    return { ...o, line_count: ls.length,
      total_ordered: ls.reduce((s, l) => s + (l.qty_ordered || 0), 0),
      total_delivered: ls.reduce((s, l) => s + (l.qty_delivered || 0), 0) }
  })
  res.json({ orders: out })
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  await ensureTables(req.scope)
  const service: any = req.scope.resolve(PURCHASING_MODULE)
  const body: any = req.body || {}
  const supplier_id = body.supplier_id
  if (!supplier_id) { res.status(400).json({ message: "supplier_id is required" }); return }
  let supplier_name = body.supplier_name || null
  if (!supplier_name) { try { const s = await service.retrieveSupplier(supplier_id); supplier_name = s?.name || null } catch {} }
  const po = await service.createPurchaseOrders({ supplier_id, supplier_name, status: "open", reference: body.reference || null })
  const lines = Array.isArray(body.lines) ? body.lines : []
  const created: any[] = []
  for (const l of lines) {
    if (!l || (!l.title && !l.variant_id)) continue
    created.push(await service.createPurchaseOrderLines({
      purchase_order_id: po.id,
      variant_id: l.variant_id || null, product_id: l.product_id || null,
      inventory_item_id: l.inventory_item_id || null, title: l.title || "", sku: l.sku || null,
      qty_ordered: Number(l.qty_ordered) || 0, qty_delivered: 0,
      min_stock: Number(l.min_stock) || 0, cost: l.cost != null ? Number(l.cost) : null,
    }))
  }
  res.json({ order: po, lines: created })
}
