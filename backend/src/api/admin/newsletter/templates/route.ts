import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getPg, ensureTables, genId, q } from "../db"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const pg = getPg(req.scope); await ensureTables(pg)
  const rows = await q(pg, `SELECT "id","name","created_at" FROM "newsletter_template" WHERE "deleted_at" IS NULL ORDER BY "name" ASC LIMIT 500`)
  res.json({ templates: rows })
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const pg = getPg(req.scope); await ensureTables(pg)
  const b: any = req.body || {}
  const name = (b.name || "").trim()
  if (!name) { res.status(400).json({ message: "name is required" }); return }
  const id = genId("tpl")
  await q(pg, `INSERT INTO "newsletter_template" ("id","name","html") VALUES (?,?,?)`, [id, name, b.html || null])
  const rows = await q(pg, `SELECT * FROM "newsletter_template" WHERE "id" = ?`, [id])
  res.json({ template: rows[0] })
}
