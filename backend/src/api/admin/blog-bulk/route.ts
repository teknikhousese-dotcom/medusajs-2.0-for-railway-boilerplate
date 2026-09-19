import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { randomUUID } from "crypto"

// Admin-only bulk upsert of blog posts (no external fetch; data is supplied by
// the operator from the parsed old site). Ensures the extended blog_post
// schema and upserts by slug. Safe: authenticated admin route, DB only.
function genId(p: string) { return p + "_" + randomUUID().replace(/-/g, "") }
async function q(p: any, sql: string, b: any[] = []) { const r = await p.raw(sql, b); return (r && r.rows) || [] }

let ensured = false
async function ensureSchema(p: any) {
  if (ensured) return
  await p.raw(`CREATE TABLE IF NOT EXISTS "blog_post" (
    "id" text PRIMARY KEY, "title" text NOT NULL, "slug" text DEFAULT '',
    "body_html" text DEFAULT '', "is_published" boolean DEFAULT true,
    "published_at" timestamptz DEFAULT now(), "updated_at" timestamptz DEFAULT now())`)
  for (const col of [
    `"excerpt" text DEFAULT ''`, `"cover_image" text DEFAULT ''`,
    `"meta_title" text DEFAULT ''`, `"meta_desc" text DEFAULT ''`,
    `"old_url" text DEFAULT ''`, `"author" text DEFAULT 'Teknikhouse'`,
  ]) { await p.raw(`ALTER TABLE "blog_post" ADD COLUMN IF NOT EXISTS ${col}`) }
  await p.raw(`CREATE UNIQUE INDEX IF NOT EXISTS "blog_post_slug_uq" ON "blog_post" ("slug")`)
  ensured = true
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const p: any = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  if (!p) return res.status(500).json({ message: "Databasen är inte tillgänglig just nu." })
  await ensureSchema(p)
  const body: any = req.body || {}
  const posts: any[] = Array.isArray(body.posts) ? body.posts : []
  let created = 0, updated = 0
  const done: string[] = []
  for (const post of posts) {
    const slug = String(post.slug || "").trim().toLowerCase()
    if (!slug || !post.title) continue
    const pub = post.date ? new Date(post.date) : new Date()
    const publishedAt = isNaN(pub.getTime()) ? new Date() : pub
    const exist = await q(p, `SELECT "id" FROM "blog_post" WHERE "slug"=? LIMIT 1`, [slug])
    if (exist[0]) {
      await q(p, `UPDATE "blog_post" SET "title"=?,"body_html"=?,"excerpt"=?,"cover_image"=?,"meta_title"=?,"meta_desc"=?,"old_url"=?,"published_at"=?,"is_published"=true,"updated_at"=now() WHERE "id"=?`,
        [post.title, post.bodyHtml || "", post.excerpt || "", post.coverUrl || "", post.metaTitle || post.title, post.metaDesc || post.excerpt || "", post.oldUrl || "", publishedAt, exist[0].id])
      updated++
    } else {
      await q(p, `INSERT INTO "blog_post" ("id","title","slug","body_html","excerpt","cover_image","meta_title","meta_desc","old_url","published_at","is_published") VALUES (?,?,?,?,?,?,?,?,?,?,true)`,
        [genId("blog"), post.title, slug, post.bodyHtml || "", post.excerpt || "", post.coverUrl || "", post.metaTitle || post.title, post.metaDesc || post.excerpt || "", post.oldUrl || "", publishedAt])
      created++
    }
    done.push(slug)
  }
  return res.json({ ok: true, created, updated, count: done.length })
}
