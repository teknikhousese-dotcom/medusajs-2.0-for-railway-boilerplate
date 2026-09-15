import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getPg, q, ensureTables } from "../../admin/newsletter/db"

// Public newsletter signup — matches teknikhouse /newsletter/.
// Writes into the same "newsletter_subscriber" table the admin newsletter tool reads,
// and (best-effort) emails info@teknikhouse.se so a signup is never lost.
export const AUTHENTICATE = false

function genId() {
  return "nlsub_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10)
}

async function notify(email: string, name: string | null) {
  const key = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL
  if (!key || !from) return
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: "info@teknikhouse.se",
        subject: "Ny nyhetsbrevsprenumerant",
        html: `<p>Ny anmälan till nyhetsbrevet:</p><p><b>${email}</b>${name ? " – " + name : ""}</p>`,
      }),
    })
  } catch {}
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body || {}) as any
  const email = String(body.email || "").trim().toLowerCase()
  const name = body.name ? String(body.name).trim() : null
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ ok: false, error: "invalid_email" })
  }
  // Persist (best-effort — never fail the signup on a DB hiccup)
  try {
    const pg = getPg(req.scope)
    if (pg) {
      await ensureTables(pg)
      const existing = await q(pg, `SELECT "id" FROM "newsletter_subscriber" WHERE "email" = ? LIMIT 1`, [email])
      if (existing && existing[0]) {
        await q(pg, `UPDATE "newsletter_subscriber" SET "active" = true, "deleted_at" = NULL WHERE "id" = ?`, [existing[0].id])
      } else {
        await q(pg, `INSERT INTO "newsletter_subscriber" ("id","email","name","active") VALUES (?,?,?,true)`, [genId(), email, name])
      }
    }
  } catch (e) {}
  await notify(email, name)
  return res.json({ ok: true })
}
