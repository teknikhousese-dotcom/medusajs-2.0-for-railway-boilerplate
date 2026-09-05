import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getPg, ensureTables, q } from "../../db"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const pg = getPg(req.scope)
  if (!pg) return res.status(500).json({ message: "no pg" })
  await ensureTables(pg)
  const id = (req.params as any).id
  const b: any = req.body || {}
  const cols = ["orgnr","company_name","first_name","last_name","street","zip_code","city","country","telephone","cellphone","email","free_shipping","pricelist_id"]
  const sets: string[] = []; const vals: any[] = []
  for (const c of cols) { if (c in b) { sets.push(`"${c}" = ?`); vals.push(c==="free_shipping" ? !!b[c] : (b[c]||null)) } }
  if (sets.length) { sets.push(`"updated_at" = now()`); vals.push(id)
    await q(pg, `UPDATE "retail_customer" SET ${sets.join(", ")} WHERE id = ?`, vals) }
  const rows = await q(pg, `SELECT * FROM "retail_customer" WHERE id = ?`, [id])
  res.json({ customer: rows[0] })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const pg = getPg(req.scope)
  if (!pg) return res.status(500).json({ message: "no pg" })
  await ensureTables(pg)
  const id = (req.params as any).id
  await q(pg, `UPDATE "retail_customer" SET deleted_at = now() WHERE id = ?`, [id])
  res.json({ id, deleted: true })
}
