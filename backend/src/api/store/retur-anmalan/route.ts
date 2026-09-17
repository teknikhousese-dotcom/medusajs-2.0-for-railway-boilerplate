import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { getPg, q, genId } from "../../admin/editable/db"

/**
 * Teknikhouse.se — customer return / reklamation submission.
 * Custom path (avoids the built-in /store/returns RMA endpoint).
 * Validates the order (metadata.wiki_order_id via JSONB text match, or display_id)
 * + e-mail, records a return_request row (shown on the order via an admin widget)
 * and best-effort e-mails the shop. Mirrors the old butikadmin RET-<order> flow.
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

async function findOrder(pg: any, num: string): Promise<{ id: string; email: string } | null> {
  if (!pg) return null
  try {
    let rows = await q(pg, `SELECT "id", "email" FROM "order" WHERE metadata @> ?::jsonb LIMIT 1`, [JSON.stringify({ wiki_order_id: String(num) })])
    if (rows && rows[0]) return { id: rows[0].id, email: rows[0].email }
    const n = parseInt(String(num), 10)
    if (!isNaN(n)) {
      rows = await q(pg, `SELECT "id", "email" FROM "order" WHERE "display_id" = ? LIMIT 1`, [n])
      if (rows && rows[0]) return { id: rows[0].id, email: rows[0].email }
    }
  } catch { /* not found */ }
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
    const pg = getPg(req.scope)
    if (!pg) return res.status(500).json({ error: "Databasen är inte tillgänglig just nu." })
    const order = await findOrder(pg, num)
    if (!order) return res.status(404).json({ error: "Vi hittade ingen order med det ordernumret." })
    if (String(order.email || "").toLowerCase() !== email) {
      return res.status(403).json({ error: "E-postadressen matchar inte den här ordern." })
    }
    await ensure(pg)
    const id = genId("ret")
    const reference = "RET-" + num
    await q(pg,
      `INSERT INTO "return_request" ("id","reference","order_id","order_display","email","type","items","message","status") VALUES (?,?,?,?,?,?,?,?,?)`,
      [id, reference, order.id, num, email, type, JSON.stringify(items), message, "pending"])
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
