import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getPg, genId, ensureTables, q, getConfig } from "./db"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const pg = getPg(req.scope)
  if (!pg) return res.json({ config: null, slots: [] })
  await ensureTables(pg)
  const config = await getConfig(pg)
  const slots = await q(pg, `SELECT * FROM "recommendation_slot" WHERE deleted_at IS NULL ORDER BY placement ASC, position ASC, created_at ASC`)
  res.json({ config, slots })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const pg = getPg(req.scope)
  if (!pg) return res.status(500).json({ message: "no pg" })
  await ensureTables(pg)
  const b: any = req.body || {}
  if (b.kind === "config") {
    await q(pg, `UPDATE "recommendation_config" SET viewed_days=?, ordered_days=?, not_selling_days=?, statistics_days=?, updated_at=now() WHERE id='default'`,
      [Number(b.viewed_days)||90, Number(b.ordered_days)||90, Number(b.not_selling_days)||90, Number(b.statistics_days)||90])
    const config = await getConfig(pg)
    return res.json({ config })
  }
  const id = genId("recslot")
  await q(pg, `INSERT INTO "recommendation_slot" (id,title,placement,slot_type,scope,category_id,active,position)
    VALUES (?,?,?,?,?,?,?,?)`,
    [id, b.title||"Ny yta", b.placement||"start", b.slot_type||"bestsellers", b.scope||"global",
     b.category_id||null, b.active!==false, Number(b.position)||0])
  const rows = await q(pg, `SELECT * FROM "recommendation_slot" WHERE id = ?`, [id])
  res.json({ slot: rows[0] })
}
