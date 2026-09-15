import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getPg, q, ensureTables } from "../../admin/newsletter/db"

// Public newsletter signup — matches teknikhouse /newsletter/.
// Writes into the same "newsletter_subscriber" table the admin newsletter tool reads.
export const AUTHENTICATE = false

function genId() {
  return "nlsub_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10)
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body || {}) as any
  const email = String(body.email || "").trim().toLowerCase()
  const name = body.name ? String(body.name).trim() : null
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ ok: false, error: "invalid_email" })
  }
  try {
    const pg = getPg(req.scope)
    if (!pg) return res.status(500).json({ ok: false })
    await ensureTables(pg)
    const existing = await q(pg, `SELECT "id" FROM "newsletter_subscriber" WHERE "email" = $1 LIMIT 1`, [email])
    if (existing && existing[0]) {
      await q(pg, `UPDATE "newsletter_subscriber" SET "active" = true, "deleted_at" = NULL WHERE "id" = $1`, [existing[0].id])
    } else {
      await q(pg, `INSERT INTO "newsletter_subscriber" ("id","email","name","active") VALUES ($1,$2,$3,true)`, [genId(), email, name])
    }
    return res.json({ ok: true })
  } catch (e) {
    return res.status(500).json({ ok: false })
  }
}
