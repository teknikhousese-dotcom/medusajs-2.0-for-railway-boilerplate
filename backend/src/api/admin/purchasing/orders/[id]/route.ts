import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PURCHASING_MODULE } from "../../../../../modules/purchasing"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const service: any = req.scope.resolve(PURCHASING_MODULE)
  const { id } = req.params
  const order = await service.retrievePurchaseOrder(id)
  const lines = await service.listPurchaseOrderLines({ purchase_order_id: id }, { take: 100000, order: { title: "ASC" } })
  res.json({ order, lines })
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  // update status (e.g. archive) or reference
  const service: any = req.scope.resolve(PURCHASING_MODULE)
  const { id } = req.params
  const body: any = req.body || {}
  const update: any = { id }
  for (const k of ["status", "reference"]) if (k in body) update[k] = body[k]
  const order = await service.updatePurchaseOrders(update)
  res.json({ order })
}
