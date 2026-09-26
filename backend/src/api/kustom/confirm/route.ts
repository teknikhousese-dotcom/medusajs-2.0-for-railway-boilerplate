import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { applyKustomOrderToCart } from "../../../lib/kustom-cart"

export const AUTHENTICATE = false

/*
 * POST /kustom/confirm { cart_id, kustom_order_id }
 * Called by the storefront on /kassa-klar right before it completes the cart.
 * Copies email, phone, shipping and billing address from the completed Kustom
 * order onto the Medusa cart (Klarna-first checkout has no address step). Only
 * acts when the Kustom order is checkout_complete and belongs to this cart.
 * Returns no personal data.
 */
function cors(res: MedusaResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")
}

export async function OPTIONS(_req: MedusaRequest, res: MedusaResponse) {
  cors(res)
  res.status(200).end()
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  cors(res)
  const b = (req.body || {}) as any
  const cartId = String(b.cart_id || "").trim()
  const kid = String(b.kustom_order_id || "").trim()
  if (!cartId || !kid) {
    return res.status(400).json({ ok: false, reason: "missing" })
  }
  try {
    const r = await applyKustomOrderToCart(req.scope, cartId, kid, { complete: false })
    if (!r.ok) console.warn("[kustom] confirm", cartId, kid, r.reason)
    return res.status(200).json({
      ok: r.ok,
      reason: r.reason || null,
      already_completed: !!r.already_completed,
      order_id: r.order_id || null,
    })
  } catch (e: any) {
    console.error("[kustom] confirm error", cartId, kid, e?.message || e)
    return res.status(500).json({ ok: false, reason: "error" })
  }
}
