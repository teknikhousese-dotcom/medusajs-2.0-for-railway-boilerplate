import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getPg, genId, ensureTables, q } from "../db"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const pg = getPg(req.scope)
  if (!pg) return res.json({ customers: [], pricelists: [] })
  await ensureTables(pg)
  const customers = await q(pg, `SELECT c.*, p.name AS pricelist_name FROM "retail_customer" c
    LEFT JOIN "retail_pricelist" p ON p.id = c.pricelist_id AND p.deleted_at IS NULL
    WHERE c.deleted_at IS NULL ORDER BY c.company_name ASC, c.created_at DESC`)
  const pricelists = await q(pg, `SELECT * FROM "retail_pricelist" WHERE deleted_at IS NULL ORDER BY name ASC`)
  res.json({ customers, pricelists })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const pg = getPg(req.scope)
  if (!pg) return res.status(500).json({ message: "no pg" })
  await ensureTables(pg)
  const b: any = req.body || {}
  const id = genId("retail")
  await q(pg, `INSERT INTO "retail_customer"
    (id,orgnr,company_name,first_name,last_name,street,zip_code,city,country,telephone,cellphone,email,free_shipping,pricelist_id)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [id, b.orgnr||null, b.company_name||null, b.first_name||null, b.last_name||null, b.street||null,
     b.zip_code||null, b.city||null, b.country||"Sverige", b.telephone||null, b.cellphone||null,
     b.email||null, !!b.free_shipping, b.pricelist_id||null])
  const rows = await q(pg, `SELECT * FROM "retail_customer" WHERE id = ?`, [id])
  res.json({ customer: rows[0] })
}
