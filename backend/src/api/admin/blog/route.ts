import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getPg, genId, slugify, ensureTables, q } from "./db"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const pg = getPg(req.scope)
  if (!pg) return res.json({ posts: [] })
  await ensureTables(pg)
  const posts = await q(pg, `SELECT "id","title","slug","body_html","is_published","published_at" FROM "blog_post" ORDER BY "published_at" DESC`)
  res.json({ posts })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const pg = getPg(req.scope)
  if (!pg) return res.status(500).json({ message: "no pg" })
  await ensureTables(pg)
  const body: any = req.body || {}
  const kind = body.kind
  if (kind === "new") {
    const title = (body.title || "").trim()
    if (!title) return res.status(400).json({ message: "rubrik saknas" })
    const id = genId("blog")
    await q(pg, `INSERT INTO "blog_post" ("id","title","slug") VALUES (?, ?, ?)`, [id, title, slugify(title)])
    return res.json({ ok: true, id })
  }
  if (kind === "update") {
    await q(pg, `UPDATE "blog_post" SET "title"=?, "slug"=?, "body_html"=?, "is_published"=?, "updated_at"=now() WHERE "id"=?`, [body.title || "", body.slug || slugify(body.title || ""), body.body_html || "", body.is_published !== false, body.id])
    return res.json({ ok: true })
  }
  if (kind === "delete") {
    await q(pg, `DELETE FROM "blog_post" WHERE "id"=?`, [body.id])
    return res.json({ ok: true })
  }
  return res.status(400).json({ message: "okänd kind" })
}
