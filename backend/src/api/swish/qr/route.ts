import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { qrPng } from "../../../lib/swish"

export const AUTHENTICATE = false

// GET /swish/qr?token=<token> — returns a Swish-scannable commerce QR (PNG).
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  const token = (req.query.token as string) || ""
  const size = Math.min(600, Math.max(300, Number(req.query.size) || 300))
  if (!token) return res.status(400).json({ error: "token saknas" })
  try {
    const png = await qrPng(token, size)
    if (!png) return res.status(502).json({ error: "QR kunde inte genereras" })
    res.setHeader("Content-Type", "image/png")
    res.setHeader("Cache-Control", "no-store")
    return res.end(png)
  } catch (e: any) {
    return res.status(502).json({ error: "QR kunde inte genereras" })
  }
}
