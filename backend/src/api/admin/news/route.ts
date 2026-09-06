import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getPg, genId, ensureTables, q } from "./db"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const pg = getPg(req.scope)
  if (!pg) return res.json({ articles: [] })
  await ensureTables(pg)
  const articles = await q(pg, `SELECT * FROM "news_article" WHERE deleted_at IS NULL ORDER BY article_date DESC NULLS LAST, created_at DESC`)
  res.json({ articles })
}
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const pg = getPg(req.scope)
  if (!pg) return res.status(500).json({ message: "no pg" })
  await ensureTables(pg)
  const b: any = req.body || {}
  if (b.kind === "new") {
    const id = genId("news")
    const slug = (b.slug || b.title || "").toString().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    await q(pg, `INSERT INTO "news_article" (id,title,slug,article_date,body,image_url,published) VALUES (?,?,?,?,?,?,?)`,
      [id, b.title || "Ny nyhet", slug, b.article_date || null, b.body || "", b.image_url || null, b.published !== false])
    const r = await q(pg, `SELECT * FROM "news_article" WHERE id = ?`, [id]); return res.json({ article: r[0] })
  }
  if (b.kind === "update") {
    const cols = ["title", "slug", "article_date", "body", "image_url", "published"]
    const sets: string[] = []; const vals: any[] = []
    for (const c of cols) { if (c in b) { sets.push(`"${c}" = ?`); vals.push(c === "published" ? !!b[c] : (b[c] === "" ? null : (b[c] ?? null))) } }
    if (sets.length) { sets.push(`"updated_at" = now()`); vals.push(b.id); await q(pg, `UPDATE "news_article" SET ${sets.join(", ")} WHERE id = ?`, vals) }
    const r = await q(pg, `SELECT * FROM "news_article" WHERE id = ?`, [b.id]); return res.json({ article: r[0] })
  }
  if (b.kind === "delete") { await q(pg, `UPDATE "news_article" SET deleted_at = now() WHERE id = ?`, [b.id]); return res.json({ id: b.id, deleted: true }) }
  res.status(400).json({ message: "unknown kind" })
}
