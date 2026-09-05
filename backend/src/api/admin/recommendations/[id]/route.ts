import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getPg, ensureTables, q } from "../db"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const pg = getPg(req.scope)
  if (!pg) return res.status(500).json({ message: "no pg" })
  await ensureTables(pg)
  const id = (req.params as any).id
  const b: any = req.body || {}
  const cols = ["title","placement","slot_type","scope","category_id","active","position"]
  const sets: string[] = []; const vals: any[] = []
  for (const c of cols) { if (c in b) { sets.push(`"${c}" = ?`); vals.push(c==="active" ? !!b[c] : (c==="position" ? (Number(b[c])||0) : (b[c]||null))) } }
  if (sets.length) { sets.push(`"updated_at" = now()`); vals.push(id)
    await q(pg, `UPDATE "recommendation_slot" SET ${sets.join(", ")} WHERE id = ?`, vals) }
  const rows = await q(pg, `SELECT * FROM "recommendation_slot" WHERE id = ?`, [id])
  res.json({ slot: rows[0] })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const pg = getPg(req.scope)
  if (!pg) return res.status(500).json({ message: "no pg" })
  await ensureTables(pg)
  const id = (req.params as any).id
  await q(pg, `UPDATE "recommendation_slot" SET deleted_at = now() WHERE id = ?`, [id])
  res.json({ id, deleted: true })
}
