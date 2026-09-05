import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getPg, ensureTables, q } from "../../db"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const pg = getPg(req.scope); await ensureTables(pg)
  const { id } = req.params
  const orders = await q(pg, `SELECT * FROM "purchase_order" WHERE "id" = ?`, [id])
  const lines = await q(pg, `SELECT * FROM "purchase_order_line" WHERE "purchase_order_id" = ? AND "deleted_at" IS NULL ORDER BY "title" ASC`, [id])
  res.json({ order: orders[0], lines })
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const pg = getPg(req.scope); await ensureTables(pg)
  const { id } = req.params
  const b: any = req.body || {}
  const sets: string[] = []; const vals: any[] = []
  for (const k of ["status", "reference"]) { if (k in b) { sets.push(`"${k}" = ?`); vals.push(b[k]) } }
  if (sets.length) { sets.push(`"updated_at" = now()`); vals.push(id); await q(pg, `UPDATE "purchase_order" SET ${sets.join(", ")} WHERE "id" = ?`, vals) }
  const rows = await q(pg, `SELECT * FROM "purchase_order" WHERE "id" = ?`, [id])
  res.json({ order: rows[0] })
}
