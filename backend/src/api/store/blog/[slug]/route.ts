import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

// Public: single blog post + up to 3 "more posts".
export const AUTHENTICATE = false

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const slug = String((req.params as any)?.slug || "")
  let post: any = null
  let more: any[] = []
  try {
    const pg: any = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    if (pg) {
      const r = await pg.raw(
        `SELECT "id","title","slug","body_html","published_at"
         FROM "blog_post" WHERE "slug"=? AND "is_published"=true LIMIT 1`, [slug])
      post = (r && r.rows && r.rows[0]) || null
      if (post) {
        const m = await pg.raw(
          `SELECT "title","slug","excerpt","cover_image","published_at"
           FROM "blog_post" WHERE "is_published"=true AND "slug"<>?
           ORDER BY "published_at" DESC LIMIT 3`, [slug])
        more = (m && m.rows) || []
      }
    }
  } catch (e) {}
  res.setHeader("Cache-Control", "public, max-age=300")
  if (!post) return res.status(404).json({ post: null, more: [] })
  return res.json({ post, more })
}
