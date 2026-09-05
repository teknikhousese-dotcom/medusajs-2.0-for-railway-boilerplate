import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PURCHASING_MODULE } from "../../../../../modules/purchasing"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const service: any = req.scope.resolve(PURCHASING_MODULE)
  const { id } = req.params
  const body: any = req.body || {}
  const update: any = { id }
  for (const k of ["name", "email", "ref_first_name", "ref_last_name"]) {
    if (k in body) update[k] = body[k]
  }
  const supplier = await service.updateSuppliers(update)
  res.json({ supplier })
}

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const service: any = req.scope.resolve(PURCHASING_MODULE)
  const { id } = req.params
  await service.deleteSuppliers(id)
  res.json({ id, deleted: true })
}
