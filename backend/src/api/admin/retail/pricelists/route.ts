import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getPg, genId, ensureTables, q } from "../db"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const pg = getPg(req.scope)
  if (!pg) return res.json({ pricelists: [] })
  await ensureTables(pg)
  const pricelists = await q(pg, `SELECT p.*,
    (SELECT count(*)::int FROM "retail_customer" c WHERE c.pricelist_id = p.id AND c.deleted_at IS NULL) AS customer_count
    FROM "retail_pricelist" p WHERE p.deleted_at IS NULL ORDER BY p.name ASC`)
  res.json({ pricelists })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const pg = getPg(req.scope)
  if (!pg) return res.status(500).json({ message: "no pg" })
  await ensureTables(pg)
  const b: any = req.body || {}
  const id = genId("plist")
  await q(pg, `INSERT INTO "retail_pricelist" (id,name,default_percent) VALUES (?,?,?)`,
    [id, b.name||"Ny prislista", b.default_percent!=null ? Number(b.default_percent) : null])
  const rows = await q(pg, `SELECT * FROM "retail_pricelist" WHERE id = ?`, [id])
  res.json({ pricelist: rows[0] })
}
