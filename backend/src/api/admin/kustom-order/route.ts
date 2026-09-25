import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { getManagement, capture, cancel, extendAuth } from "../../../lib/kustom"

async function load(scope: any, order_id: string) {
  const om: any = scope.resolve(Modules.ORDER)
  const o: any = await om.retrieveOrder(order_id, { select: ["id", "metadata", "payment_status", "total", "currency_code"] })
  const kid = o?.metadata?.kustom_order_id || o?.metadata?.klarna_order_id || null
  return { om, o, kid }
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const order_id = String((req.query as any).order_id || "")
  if (!order_id) return res.status(400).json({ ok: false, message: "order_id kravs." })
  try {
    const { o, kid } = await load(req.scope, order_id)
    if (!kid) return res.json({ ok: true, kustom: false })
    let mgmt: any = null
    try { mgmt = await getManagement(kid) } catch (e) { /* natverk */ }
    return res.json({
      ok: true,
      kustom: true,
      kustom_order_id: kid,
      payment_status: o?.payment_status || null,
      captured: o?.metadata?.kustom_captured === true,
      cancelled: o?.metadata?.kustom_cancelled === true,
      status: mgmt?.status || null,
      reference: mgmt?.kustom_reference || mgmt?.klarna_reference || mgmt?.merchant_reference1 || null,
      expiry: mgmt?.expiry || null,
      order_amount: (mgmt?.order_amount != null ? mgmt.order_amount : null),
      butik_id: process.env.KUSTOM_USERNAME || null,
    })
  } catch (e: any) {
    return res.status(500).json({ ok: false, message: "Kunde inte lasa Klarna-ordern." })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body: any = req.body || {}
  const order_id = String(body.order_id || "")
  const action = String(body.action || "")
  if (!order_id || !action) return res.status(400).json({ ok: false, message: "order_id och action kravs." })
  try {
    const { om, o, kid } = await load(req.scope, order_id)
    if (!kid) return res.status(400).json({ ok: false, message: "Ingen Klarna-order kopplad till denna order." })
    if (action === "capture") {
      const amount = Math.round(Number(o?.total || 0) * 100)
      await capture(kid, amount)
      const meta = Object.assign({}, o?.metadata || {}, { kustom_captured: true, kustom_captured_at: new Date().toISOString() })
      await om.updateOrders([{ id: order_id, metadata: meta }])
      return res.json({ ok: true, action, status: "CAPTURED" })
    }
    if (action === "cancel") {
      await cancel(kid)
      const meta = Object.assign({}, o?.metadata || {}, { kustom_cancelled: true, kustom_cancelled_at: new Date().toISOString() })
      await om.updateOrders([{ id: order_id, metadata: meta }])
      return res.json({ ok: true, action, status: "CANCELLED" })
    }
    if (action === "extend") {
      await extendAuth(kid)
      return res.json({ ok: true, action })
    }
    return res.status(400).json({ ok: false, message: "Okand atgard." })
  } catch (e: any) {
    return res.status(502).json({ ok: false, message: "Klarna-atgarden misslyckades. Forsok igen." })
  }
}
