import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getPg, q } from "../../editable/db"
import { SHOP_EMAIL } from "../../../../modules/email-notifications/shop-mail"
import { loadOrderForMail, buildShopOrderMail, sendShopOrderNotification } from "../../../../modules/email-notifications/order-mails"
import { sendReturnMails } from "../../../../modules/email-notifications/return-mails"
import { ensureTables as ensureTemplateTables } from "../../email-templates/db"

/**
 * Admin-only: preview / resend the shop mails. Everything is sent to the shop's
 * own mailbox (SHOP_EMAIL, info@teknikhouse.se), never to a customer.
 *
 * GET  /admin/order-email/shop-notice?order=<order id>          preview { subject, html }
 * POST /admin/order-email/shop-notice { order_id }               resend "Order <nr> (<namn>)" to the shop
 * POST /admin/order-email/shop-notice { return_reference }       send both return mails (marked [TEST]) to the shop
 */

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const id = String((req.query as any).order || "")
  if (!id) return res.status(400).json({ ok: false, message: "order saknas" })
  const order = await loadOrderForMail(req.scope, id)
  if (!order) return res.status(404).json({ ok: false, message: "Ordern kunde inte hittas." })
  const m = buildShopOrderMail(order)
  res.setHeader("Cache-Control", "no-store")
  return res.json({ ok: true, to: SHOP_EMAIL, subject: m.subject, html: m.html })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const b: any = req.body || {}
  const orderId = String(b.order_id || "")
  const ref = String(b.return_reference || "")
  if (ref) {
    const pg = getPg(req.scope)
    if (!pg) return res.status(500).json({ ok: false, message: "Databasen är inte tillgänglig." })
    const rows = await q(pg, `SELECT * FROM "return_request" WHERE "reference" = ? AND "deleted_at" IS NULL ORDER BY "created_at" DESC LIMIT 1`, [ref])
    const r = rows && rows[0]
    if (!r) return res.status(404).json({ ok: false, message: "Returen hittades inte." })
    let customerName = ""
    try {
      const n = await q(pg, `SELECT a."first_name", a."last_name" FROM "order" o JOIN "order_address" a ON a."id" = COALESCE(o."billing_address_id", o."shipping_address_id") WHERE o."id" = ? LIMIT 1`, [r.order_id])
      if (n && n[0]) customerName = `${n[0].first_name || ""} ${n[0].last_name || ""}`.trim()
    } catch { /* optional */ }
    try { await ensureTemplateTables(pg) } catch { /* optional */ }
    const items = typeof r.items === "string" ? JSON.parse(r.items) : (r.items || [])
    const out = await sendReturnMails({
      pg, reference: r.reference, orderNumber: r.order_display, orderId: r.order_id, email: r.email,
      type: r.type, items, message: r.message, customerName, overrideTo: SHOP_EMAIL,
    })
    return res.json({ ok: out.customer && out.shop, to: SHOP_EMAIL, ...out })
  }
  if (!orderId) return res.status(400).json({ ok: false, message: "order_id eller return_reference krävs" })
  const out = await sendShopOrderNotification(req.scope, orderId, SHOP_EMAIL)
  return res.status(out.ok ? 200 : 502).json(out)
}
