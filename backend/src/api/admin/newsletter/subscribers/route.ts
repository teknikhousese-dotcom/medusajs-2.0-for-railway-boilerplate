import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getPg, ensureTables, genId, q } from "../db"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const pg = getPg(req.scope); await ensureTables(pg)
  const limit = Math.min(Number(req.query.limit) || 100, 500)
  const offset = Number(req.query.offset) || 0
  const search = (req.query.q as string || "").trim()
  const where = search ? `WHERE "deleted_at" IS NULL AND ("email" ILIKE ? OR "name" ILIKE ?)` : `WHERE "deleted_at" IS NULL`
  const args = search ? [`%${search}%`, `%${search}%`] : []
  const rows = await q(pg, `SELECT * FROM "newsletter_subscriber" ${where} ORDER BY "email" ASC LIMIT ${limit} OFFSET ${offset}`, args)
  const cnt = await q(pg, `SELECT COUNT(*)::int AS c FROM "newsletter_subscriber" ${where}`, args)
  res.json({ subscribers: rows, count: cnt[0]?.c || 0 })
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const pg = getPg(req.scope); await ensureTables(pg)
  const b: any = req.body || {}
  // bulk import from current Medusa customers
  if (b.import_customers) {
    let imported = 0, offset = 0
    for (let i = 0; i < 200; i++) {
      let data: any
      try { data = await q(pg, `SELECT "email", "first_name", "last_name" FROM "customer" WHERE "email" IS NOT NULL AND "deleted_at" IS NULL ORDER BY "email" LIMIT 500 OFFSET ${offset}`) } catch { break }
      if (!data.length) break
      for (const c of data) {
        const name = [c.first_name, c.last_name].filter(Boolean).join(" ") || null
        try { await q(pg, `INSERT INTO "newsletter_subscriber" ("id","email","name") VALUES (?,?,?) ON CONFLICT DO NOTHING`, [genId("sub"), c.email, name]); imported++ } catch {}
      }
      if (data.length < 500) break
      offset += 500
    }
    const cnt = await q(pg, `SELECT COUNT(*)::int AS c FROM "newsletter_subscriber" WHERE "deleted_at" IS NULL`)
    res.json({ imported, count: cnt[0]?.c || 0 })
    return
  }
  const email = (b.email || "").trim()
  if (!email) { res.status(400).json({ message: "email is required" }); return }
  const id = genId("sub")
  try { await q(pg, `INSERT INTO "newsletter_subscriber" ("id","email","name") VALUES (?,?,?) ON CONFLICT DO NOTHING`, [id, email, b.name || null]) } catch {}
  const rows = await q(pg, `SELECT * FROM "newsletter_subscriber" WHERE "email" = ? AND "deleted_at" IS NULL`, [email])
  res.json({ subscriber: rows[0] })
}
