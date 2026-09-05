import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getPg, ensureTables, q } from "../../db"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const pg = getPg(req.scope); await ensureTables(pg)
  const { id } = req.params
  const b: any = req.body || {}
  const sets: string[] = []; const vals: any[] = []
  for (const k of ["name", "email", "ref_first_name", "ref_last_name"]) {
    if (k in b) { sets.push(`"${k}" = ?`); vals.push(b[k]) }
  }
  if (sets.length) {
    sets.push(`"updated_at" = now()`)
    vals.push(id)
    await q(pg, `UPDATE "supplier" SET ${sets.join(", ")} WHERE "id" = ?`, vals)
  }
  const rows = await q(pg, `SELECT * FROM "supplier" WHERE "id" = ?`, [id])
  res.json({ supplier: rows[0] })
}

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const pg = getPg(req.scope); await ensureTables(pg)
  const { id } = req.params
  await q(pg, `DELETE FROM "supplier" WHERE "id" = ?`, [id])
  res.json({ id, deleted: true })
}
