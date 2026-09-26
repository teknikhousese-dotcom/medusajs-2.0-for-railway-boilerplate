import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getPg, ensureTables, q } from "../../db"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const pg = getPg(req.scope); await ensureTables(pg)
  const { id } = req.params
  const orders = await q(pg, `SELECT * FROM "purchase_order" WHERE "id" = ?`, [id])
  const lines = await q(pg, `SELECT * FROM "purchase_order_line" WHERE "purchase_order_id" = ? AND "deleted_at" IS NULL ORDER BY "sku" ASC NULLS LAST, "title" ASC`, [id])
  res.json({ order: orders[0], lines })
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const pg = getPg(req.scope); await ensureTables(pg)
  const { id } = req.params
  const b: any = req.body || {}
  const sets: string[] = []; const vals: any[] = []
  for (const k of ["status", "reference", "comment"]) { if (k in b) { sets.push(`"${k}" = ?`); vals.push(b[k]) } }
  if (b.status === "archived" && !("archived_at" in b)) sets.push(`"archived_at" = COALESCE("archived_at", now())`)
  if (b.status === "sent" && !("sent_at" in b)) sets.push(`"sent_at" = COALESCE("sent_at", now())`)
  for (const k of ["sent_at", "archived_at"]) { if (k in b) { sets.push(`"${k}" = ?::timestamptz`); vals.push(b[k] || null) } }
  if (sets.length) { sets.push(`"updated_at" = now()`); vals.push(id); await q(pg, `UPDATE "purchase_order" SET ${sets.join(", ")} WHERE "id" = ?`, vals) }
  const rows = await q(pg, `SELECT * FROM "purchase_order" WHERE "id" = ?`, [id])
  res.json({ order: rows[0] })
}
