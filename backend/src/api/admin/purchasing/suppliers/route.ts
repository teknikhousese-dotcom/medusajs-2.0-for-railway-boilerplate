import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getPg, ensureTables, genId, q, normName, supplierProductCounts } from "../db"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const pg = getPg(req.scope); await ensureTables(pg)
  const rows = await q(pg, `SELECT * FROM "supplier" WHERE "deleted_at" IS NULL ORDER BY lower("name") ASC`)
  const counts = await supplierProductCounts(pg)
  const suppliers = (rows || []).map((s: any) => ({
    ...s,
    product_count: (counts.byName[normName(s.name)] || 0) + (counts.byId[s.id] || 0),
  }))
  res.json({ suppliers, count: suppliers.length })
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const pg = getPg(req.scope); await ensureTables(pg)
  const b: any = req.body || {}
  const name = String(b.name || "").trim()
  if (!name) { res.status(400).json({ message: "name is required" }); return }
  const wikiId = b.wiki_id != null && b.wiki_id !== "" ? Number(b.wiki_id) : null
  const meta = b.metadata && typeof b.metadata === "object" ? JSON.stringify(b.metadata) : null
  let existing: any[] = []
  if (wikiId != null && !isNaN(wikiId)) existing = await q(pg, `SELECT * FROM "supplier" WHERE "wiki_id" = ? AND "deleted_at" IS NULL`, [wikiId])
  if (!existing.length && b.upsert_by_name === true) existing = await q(pg, `SELECT * FROM "supplier" WHERE lower(trim("name")) = ? AND "deleted_at" IS NULL`, [normName(name)])
  if (existing.length) {
    const id = existing[0].id
    await q(pg, `UPDATE "supplier" SET "name" = ?, "email" = ?, "ref_first_name" = ?, "ref_last_name" = ?, "wiki_id" = COALESCE(?, "wiki_id"), "metadata" = COALESCE(?::jsonb, "metadata"), "updated_at" = now() WHERE "id" = ?`,
      [name, b.email || null, b.ref_first_name || null, b.ref_last_name || null, wikiId, meta, id])
    const rows = await q(pg, `SELECT * FROM "supplier" WHERE "id" = ?`, [id])
    res.json({ supplier: rows[0], updated: true })
    return
  }
  const id = genId("sup")
  await q(pg, `INSERT INTO "supplier" ("id","name","email","ref_first_name","ref_last_name","wiki_id","metadata") VALUES (?,?,?,?,?,?,?::jsonb)`,
    [id, name, b.email || null, b.ref_first_name || null, b.ref_last_name || null, wikiId, meta])
  const rows = await q(pg, `SELECT * FROM "supplier" WHERE "id" = ?`, [id])
  res.json({ supplier: rows[0], created: true })
}
