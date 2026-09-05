import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PURCHASING_MODULE } from "../../../../modules/purchasing"
import { ensureTables } from "../ensure"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  await ensureTables(req.scope)
  const service: any = req.scope.resolve(PURCHASING_MODULE)
  const suppliers = await service.listSuppliers({}, { order: { name: "ASC" }, take: 1000 })
  res.json({ suppliers })
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  await ensureTables(req.scope)
  const service: any = req.scope.resolve(PURCHASING_MODULE)
  const body: any = req.body || {}
  const name = (body.name || "").trim()
  if (!name) { res.status(400).json({ message: "name is required" }); return }
  const created = await service.createSuppliers({
    name,
    email: body.email || null,
    ref_first_name: body.ref_first_name || null,
    ref_last_name: body.ref_last_name || null,
  })
  res.json({ supplier: created })
}
