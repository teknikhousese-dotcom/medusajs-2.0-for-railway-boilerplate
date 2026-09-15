import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getPg, q, ensureTables } from "../../../admin/editable/db"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

// Public reader for editable page content. No cache so admin edits show immediately.
export const AUTHENTICATE = false

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const slug = String((req.params as any)?.slug || "")
  let content = ""
  try {
    let pg: any = null
    try {
      pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    } catch {}
    if (!pg) {
      try {
        pg = req.scope.resolve("__pg_connection__")
      } catch {}
    }
    if (!pg) {
      try {
        pg = getPg(req.scope)
      } catch {}
    }
    if (pg) {
      await ensureTables(pg)
      const rows = await q(
        pg,
        `SELECT "content" FROM "editable_page" WHERE "slug" = $1 AND "deleted_at" IS NULL ORDER BY "updated_at" DESC LIMIT 1`,
        [slug]
      )
      content = rows && rows[0] && rows[0].content ? String(rows[0].content) : ""
    }
  } catch (e) {}
  res.setHeader("Cache-Control", "no-store")
  return res.json({ slug, content })
}
