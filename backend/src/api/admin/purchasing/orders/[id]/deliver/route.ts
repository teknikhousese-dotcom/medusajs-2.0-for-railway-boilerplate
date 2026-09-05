import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { PURCHASING_MODULE } from "../../../../../../modules/purchasing"

// body: { deliveries: [{ line_id, qty }], archive?: boolean }
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const service: any = req.scope.resolve(PURCHASING_MODULE)
  const { id } = req.params
  const body: any = req.body || {}
  const deliveries: any[] = Array.isArray(body.deliveries) ? body.deliveries : []

  let inventory: any = null
  try { inventory = req.scope.resolve(Modules.INVENTORY) } catch {}

  const results: any[] = []
  for (const d of deliveries) {
    const qty = Number(d.qty) || 0
    if (!d.line_id || qty <= 0) continue
    let line: any
    try { line = await service.retrievePurchaseOrderLine(d.line_id) } catch { continue }
    if (!line || line.purchase_order_id !== id) continue

    // bump delivered on the PO line
    const newDelivered = (line.qty_delivered || 0) + qty
    await service.updatePurchaseOrderLines({ id: line.id, qty_delivered: newDelivered })

    // add to real inventory if we can resolve an item + location
    let stockUpdated = false
    if (inventory && line.inventory_item_id) {
      try {
        const levels = await inventory.listInventoryLevels(
          { inventory_item_id: line.inventory_item_id },
          { take: 1 }
        )
        const loc = levels?.[0]?.location_id
        if (loc) {
          await inventory.adjustInventory(line.inventory_item_id, loc, qty)
          stockUpdated = true
        }
      } catch (e) { /* leave stockUpdated false */ }
    }
    results.push({ line_id: line.id, delivered_now: qty, qty_delivered: newDelivered, stock_updated: stockUpdated })
  }

  // optionally archive when everything delivered
  let order = await service.retrievePurchaseOrder(id)
  if (body.archive === true) {
    order = await service.updatePurchaseOrders({ id, status: "archived" })
  }
  res.json({ order, results })
}
