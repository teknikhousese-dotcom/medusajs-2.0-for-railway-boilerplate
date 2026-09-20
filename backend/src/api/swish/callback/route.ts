import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const AUTHENTICATE = false

// POST /swish/callback — Swish pushes payment/refund status here. The storefront
// also polls /store/swish/status, so this endpoint just needs to ack (200) so
// Swish stops retrying. Kept for parity + future server-side reconciliation.
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const b: any = req.body || {}
    if (b && (b.id || b.payeePaymentReference)) {
      console.log("[swish] callback", b.id || b.payeePaymentReference, b.status)
    }
  } catch { /* ignore */ }
  return res.status(200).json({ ok: true })
}
