import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { kustomBase } from "../../../lib/kustom"

export const AUTHENTICATE = false

/*
 * POST /kustom/push?kustom_order_id=...&cart_id=...
 * Kustom (KCO v3) calls merchant_urls.push after checkout_complete. We
 * acknowledge the order via Order Management so Kustom stops retrying and the
 * order is not left unacknowledged. The Medusa order itself is created by the
 * storefront on /kassa-klar (placeOrder). Always answers 200.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const id = String((req.query as any)?.kustom_order_id || "").trim()
  if (!id || !/^[A-Za-z0-9-]+$/.test(id)) {
    return res.status(200).json({ ok: false })
  }
  try {
    const u = (process.env.KUSTOM_USERNAME || "").trim()
    const p = (process.env.KUSTOM_PASSWORD || "").trim()
    const r = await fetch(
      kustomBase() + "/ordermanagement/v1/orders/" + id + "/acknowledge",
      {
        method: "POST",
        headers: {
          Authorization: "Basic " + Buffer.from(u + ":" + p).toString("base64"),
          "Content-Type": "application/json",
        },
      }
    )
    console.log("[kustom] push", id, "acknowledge", r.status)
  } catch (e: any) {
    console.error("[kustom] push error", id, e?.message || e)
  }
  return res.status(200).json({ ok: true })
}
