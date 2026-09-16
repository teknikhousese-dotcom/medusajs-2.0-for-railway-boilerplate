import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

// Public: list published blog posts (no bodies) for the /blogg index.
export const AUTHENTICATE = false

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  let posts: any[] = []
  try {
    const pg: any = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    if (pg) {
      const r = await pg.raw(
        `SELECT "id","title","slug","excerpt","cover_image","published_at"
         FROM "blog_post" WHERE "is_published"=true
         ORDER BY "published_at" DESC`)
      posts = (r && r.rows) || []
    }
  } catch (e) {}
  res.setHeader("Cache-Control", "public, max-age=300")
  return res.json({ posts })
}
