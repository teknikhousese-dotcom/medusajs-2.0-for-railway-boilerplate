import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getPg, genId, ensureTables, q } from "./db"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const pg = getPg(req.scope)
  if (!pg) return res.json({ products: [], reviews: [] })
  await ensureTables(pg)
  const productId = (req.query.product_id as string) || ""
  if (productId) {
    const reviews = await q(pg, `SELECT * FROM "product_review" WHERE deleted_at IS NULL AND product_id = ? ORDER BY created_at DESC`, [productId])
    return res.json({ reviews })
  }
  const products = await q(pg, `SELECT product_id, MAX(product_title) AS product_title, MAX(created_at) AS latest, COUNT(*)::int AS antal, SUM(CASE WHEN is_read THEN 0 ELSE 1 END)::int AS unread, ROUND(AVG(rating)::numeric, 2)::float AS avg_rating FROM "product_review" WHERE deleted_at IS NULL GROUP BY product_id ORDER BY latest DESC`)
  return res.json({ products })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const pg = getPg(req.scope)
  if (!pg) return res.status(500).json({ message: "no pg" })
  await ensureTables(pg)
  const b: any = req.body || {}
  if (b.kind === "new") {
    const id = genId("prev")
    await q(pg, `INSERT INTO "product_review" (id,product_id,product_title,author,rating,comment,is_read) VALUES (?,?,?,?,?,?,?)`,
      [id, b.product_id || "", b.product_title || "", b.author || "", Number(b.rating) || 5, b.comment || "", !!b.is_read])
    const r = await q(pg, `SELECT * FROM "product_review" WHERE id = ?`, [id]); return res.json({ review: r[0] })
  }
  if (b.kind === "mark-read") {
    if (b.id) { await q(pg, `UPDATE "product_review" SET is_read = true, updated_at = now() WHERE id = ?`, [b.id]) }
    else if (b.product_id) { await q(pg, `UPDATE "product_review" SET is_read = true, updated_at = now() WHERE product_id = ?`, [b.product_id]) }
    return res.json({ ok: true })
  }
  if (b.kind === "delete") { await q(pg, `UPDATE "product_review" SET deleted_at = now() WHERE id = ?`, [b.id]); return res.json({ id: b.id, deleted: true }) }
  res.status(400).json({ message: "unknown kind" })
}
