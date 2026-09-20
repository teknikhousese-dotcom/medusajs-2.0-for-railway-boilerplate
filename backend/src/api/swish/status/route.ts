import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getStatus } from "../../../lib/swish"

export const AUTHENTICATE = false

// GET /swish/status?id=<swishId> — storefront polls this while showing the QR.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  const id = (req.query.id as string) || (req.query.swishId as string) || ""
  if (!id) return res.status(400).json({ status: "ERROR", error: "id saknas" })
  try {
    const s = await getStatus(id)
    return res.json({ status: s.status || "CREATED", paymentReference: s.paymentReference })
  } catch (e: any) {
    return res.json({ status: "CREATED" })
  }
}
