import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getPg, ensureTables, q } from "../../db"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const pg = getPg(req.scope)
  if (!pg) return res.status(500).json({ message: "no pg" })
  await ensureTables(pg)
  const id = (req.params as any).id
  const b: any = req.body || {}
  const sets: string[] = []; const vals: any[] = []
  if ("name" in b) { sets.push(`"name" = ?`); vals.push(b.name||"") }
  if ("default_percent" in b) { sets.push(`"default_percent" = ?`); vals.push(b.default_percent!=null ? Number(b.default_percent) : null) }
  if (sets.length) { sets.push(`"updated_at" = now()`); vals.push(id)
    await q(pg, `UPDATE "retail_pricelist" SET ${sets.join(", ")} WHERE id = ?`, vals) }
  const rows = await q(pg, `SELECT * FROM "retail_pricelist" WHERE id = ?`, [id])
  res.json({ pricelist: rows[0] })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const pg = getPg(req.scope)
  if (!pg) return res.status(500).json({ message: "no pg" })
  await ensureTables(pg)
  const id = (req.params as any).id
  await q(pg, `UPDATE "retail_pricelist" SET deleted_at = now() WHERE id = ?`, [id])
  res.json({ id, deleted: true })
}
