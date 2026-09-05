import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getPg, ensureTables, genId, q } from "../db"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const pg = getPg(req.scope); await ensureTables(pg)
  const rows = await q(pg, `SELECT * FROM "sms_campaign" WHERE "deleted_at" IS NULL ORDER BY "created_at" DESC LIMIT 500`)
  // recipients with a phone number, for the "green" count
  let phoneCount = 0
  try { const c = await q(pg, `SELECT COUNT(*)::int AS c FROM "customer" WHERE "phone" IS NOT NULL AND "phone" <> '' AND "deleted_at" IS NULL`); phoneCount = c[0]?.c || 0 } catch {}
  const sent = rows.filter((r: any) => r.status === "sent").reduce((s: number, r: any) => s + (r.recipients || 0), 0)
  res.json({ campaigns: rows, phone_count: phoneCount, total_sent: sent })
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const pg = getPg(req.scope); await ensureTables(pg)
  const b: any = req.body || {}
  const message = (b.message || "").trim()
  if (!message) { res.status(400).json({ message: "message is required" }); return }
  const id = genId("sms")
  const recipient_type = b.recipient_type === "number" ? "number" : "all"
  let recipients = 0
  if (recipient_type === "all") { try { const c = await q(pg, `SELECT COUNT(*)::int AS c FROM "customer" WHERE "phone" IS NOT NULL AND "phone" <> '' AND "deleted_at" IS NULL`); recipients = c[0]?.c || 0 } catch {} }
  else recipients = 1
  await q(pg, `INSERT INTO "sms_campaign" ("id","sender","message","recipient_type","recipient_number","status","recipients","scheduled_at")
    VALUES (?,?,?,?,?,?,?,?)`,
    [id, b.sender || null, message, recipient_type, b.recipient_number || null, "draft", recipients, b.scheduled_at || null])
  const rows = await q(pg, `SELECT * FROM "sms_campaign" WHERE "id" = ?`, [id])
  res.json({ campaign: rows[0] })
}
