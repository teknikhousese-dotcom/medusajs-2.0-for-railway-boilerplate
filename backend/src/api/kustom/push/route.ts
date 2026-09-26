import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { kustomBase } from "../../../lib/kustom"
import { applyKustomOrderToCart } from "../../../lib/kustom-cart"

export const AUTHENTICATE = false

/* Push can arrive more than once; only one fallback timer per KCO order. */
const scheduled = new Set<string>()
const FALLBACK_DELAY_MS = 90 * 1000

/*
 * POST /kustom/push?kustom_order_id=...&cart_id=...
 * Kustom (KCO v3) calls merchant_urls.push after checkout_complete. We
 * acknowledge the order via Order Management so Kustom stops retrying and the
 * order is not left unacknowledged. Always answers 200.
 *
 * Normally the Medusa order is created by the storefront on /kassa-klar
 * (POST /kustom/confirm copies email/addresses from Kustom, then placeOrder()).
 * Fallback: if the shopper never reaches /kassa-klar (closed the tab, lost
 * connection), we complete the cart here after a delay, using the same
 * Kustom-to-cart copy. completeCartWorkflow locks on the cart and returns the
 * existing order if the storefront already completed it, so the order is
 * created exactly once.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const id = String((req.query as any)?.kustom_order_id || "").trim()
  const cartId = String((req.query as any)?.cart_id || "").trim()
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

  if (cartId && /^cart_[A-Za-z0-9]+$/.test(cartId) && !scheduled.has(id)) {
    scheduled.add(id)
    const scope = req.scope
    setTimeout(async () => {
      try {
        const r = await applyKustomOrderToCart(scope, cartId, id, { complete: true })
        console.log("[kustom] push fallback", id, cartId, JSON.stringify({ ok: r.ok, reason: r.reason || null, already: !!r.already_completed, order: r.order_id || null }))
      } catch (e: any) {
        console.error("[kustom] push fallback error", id, cartId, e?.message || e)
      } finally {
        setTimeout(() => scheduled.delete(id), 10 * 60 * 1000)
      }
    }, FALLBACK_DELAY_MS)
  }

  return res.status(200).json({ ok: true })
}
