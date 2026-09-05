import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getPg, ensureTables, genId, q } from "../db"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const pg = getPg(req.scope); await ensureTables(pg)
  const suppliers = await q(pg, `SELECT * FROM "supplier" WHERE "deleted_at" IS NULL ORDER BY "name" ASC`)
  res.json({ suppliers })
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const pg = getPg(req.scope); await ensureTables(pg)
  const b: any = req.body || {}
  const name = (b.name || "").trim()
  if (!name) { res.status(400).json({ message: "name is required" }); return }
  const id = genId("sup")
  await q(pg, `INSERT INTO "supplier" ("id","name","email","ref_first_name","ref_last_name") VALUES (?,?,?,?,?)`,
    [id, name, b.email || null, b.ref_first_name || null, b.ref_last_name || null])
  const rows = await q(pg, `SELECT * FROM "supplier" WHERE "id" = ?`, [id])
  res.json({ supplier: rows[0] })
}
