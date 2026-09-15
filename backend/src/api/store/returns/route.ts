import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { getPg, q, genId } from "../../admin/editable/db"

/**
 * Teknikhouse.se — customer return / reklamation submission.
 * Validates the order (metadata.wiki_order_id or display_id) + e-mail, then
 * records a return_request row (shown on the order via an admin widget) and
 * best-effort e-mails the shop. Mirrors the old butikadmin RET-<order> flow.
 */
export const AUTHENTICATE = false

async function ensure(pg: any) {
  await q(pg, `CREATE TABLE IF NOT EXISTS "return_request" (
    "id" text PRIMARY KEY,
    "reference" text,
    "order_id" text,
    "order_display" text,
    "email" text,
    "type" text,
    "items" jsonb,
    "message" text,
    "status" text DEFAULT 'pending',
    "created_at" timestamptz DEFAULT now(),
    "deleted_at" timestamptz
  )`, [])
}

async function findOrder(orderModule: any, num: string) {
  let list = await orderModule.listOrders({ metadata: { wiki_order_id: num } }, { take: 1 }).catch(() => [])
  if (list && list[0]) return list[0]
  const asNum = parseInt(String(num), 10)
  if (!isNaN(asNum)) {
    list = await orderModule.listOrders({ display_id: asNum }, { take: 1 }).catch(() => [])
    if (list && list[0]) return list[0]
  }
  return null
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const b: any = req.body || {}
  const email = String(b.email || "").trim().toLowerCase()
  const num = String(b.order || "").trim()
  const type = b.type === "reklamation" ? "reklamation" : "retur"
  const items = Array.isArray(b.items) ? b.items.filter((x: any) => x && x.title) : []
  const message = String(b.message || "").slice(0, 2000)
  res.setHeader("Cache-Control", "no-store")
  if (!email || !num || !items.length) {
    return res.status(400).json({ error: "Fyll i ordernummer, e-post och minst en vara." })
  }
  try {
    const orderModule: any = req.scope.resolve(Modules.ORDER)
    const order = await findOrder(orderModule, num)
    if (!order || String(order.email || "").toLowerCase() !== email) {
      return res.status(404).json({ error: "Vi hittade ingen order med den kombinationen." })
    }
    const pg = getPg(req.scope)
    if (!pg) return res.status(500).json({ error: "Databasen är inte tillgänglig just nu." })
    await ensure(pg)
    const id = genId("ret")
    const reference = "RET-" + num
    await q(pg,
      `INSERT INTO "return_request" ("id","reference","order_id","order_display","email","type","items","message","status") VALUES (?,?,?,?,?,?,?,?,?)`,
      [id, reference, order.id, num, email, type, JSON.stringify(items), message, "pending"])
    // Best-effort e-mail to the shop. No-op if the notification module is not
    // configured (Resend key missing) — the return is still recorded on the order.
    try {
      const notif: any = req.scope.resolve(Modules.NOTIFICATION)
      const lines = items.map((x: any) => "- " + x.title + " x" + (x.quantity || 1) + (x.reason ? " (" + x.reason + ")" : "")).join("\n")
      await notif.createNotifications({
        to: "info@teknikhouse.se",
        channel: "email",
        template: "return-request",
        content: { subject: "Ny " + type + " " + reference, text: "Order " + num + " — " + email + "\n" + lines + (message ? "\n\nMeddelande: " + message : "") },
        data: { reference, order: num, email, type, items, message },
      })
    } catch { /* notification module not configured */ }
    return res.json({ ok: true, reference })
  } catch (e: any) {
    return res.status(500).json({ error: String((e && e.message) || e).slice(0, 160) })
  }
}
