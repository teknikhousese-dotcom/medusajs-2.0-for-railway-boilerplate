import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getPg, ensureTables, genId, q } from "../db"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const pg = getPg(req.scope); await ensureTables(pg)
  const rows = await q(pg, `SELECT "id","subject","status","recipients","sent_at","created_at" FROM "newsletter_campaign" WHERE "deleted_at" IS NULL ORDER BY "created_at" DESC LIMIT 500`)
  res.json({ campaigns: rows })
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const pg = getPg(req.scope); await ensureTables(pg)
  const b: any = req.body || {}
  const subject = (b.subject || "").trim()
  if (!subject) { res.status(400).json({ message: "subject is required" }); return }
  const id = genId("nl")
  await q(pg, `INSERT INTO "newsletter_campaign" ("id","subject","html","status") VALUES (?,?,?,?)`, [id, subject, b.html || null, "draft"])
  const rows = await q(pg, `SELECT * FROM "newsletter_campaign" WHERE "id" = ?`, [id])
  res.json({ campaign: rows[0] })
}
