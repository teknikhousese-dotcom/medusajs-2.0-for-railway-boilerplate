import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { getPg, ensureTables, q } from "../../../db"

// body: { deliveries: [{ line_id, qty }], archive?: boolean }
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const pg = getPg(req.scope); await ensureTables(pg)
  const { id } = req.params
  const b: any = req.body || {}
  const deliveries: any[] = Array.isArray(b.deliveries) ? b.deliveries : []
  let inventory: any = null
  try { inventory = req.scope.resolve(Modules.INVENTORY) } catch {}

  const results: any[] = []
  for (const d of deliveries) {
    const qty = Number(d.qty) || 0
    if (!d.line_id || qty <= 0) continue
    const rows = await q(pg, `SELECT * FROM "purchase_order_line" WHERE "id" = ? AND "purchase_order_id" = ?`, [d.line_id, id])
    const line = rows[0]
    if (!line) continue
    const newDelivered = (line.qty_delivered || 0) + qty
    await q(pg, `UPDATE "purchase_order_line" SET "qty_delivered" = ?, "updated_at" = now() WHERE "id" = ?`, [newDelivered, line.id])
    let stockUpdated = false
    if (inventory && line.inventory_item_id) {
      try {
        const levels = await inventory.listInventoryLevels({ inventory_item_id: line.inventory_item_id }, { take: 1 })
        const loc = levels?.[0]?.location_id
        if (loc) { await inventory.adjustInventory(line.inventory_item_id, loc, qty); stockUpdated = true }
      } catch {}
    }
    results.push({ line_id: line.id, delivered_now: qty, qty_delivered: newDelivered, stock_updated: stockUpdated })
  }
  if (b.archive === true) await q(pg, `UPDATE "purchase_order" SET "status" = 'archived', "updated_at" = now() WHERE "id" = ?`, [id])
  const orows = await q(pg, `SELECT * FROM "purchase_order" WHERE "id" = ?`, [id])
  res.json({ order: orows[0], results })
}
