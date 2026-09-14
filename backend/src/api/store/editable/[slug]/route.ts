import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getPg, q, ensureTables } from "../../../admin/editable/db"

// Public: returns admin-saved HTML content for an info page by slug.
// The storefront renders this instead of its designed layout when non-empty.
export const AUTHENTICATE = false

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const slug = String((req.params as any)?.slug || "")
  try {
    const pg = getPg(req.scope)
    if (!pg) return res.json({ content: "" })
    await ensureTables(pg)
    const rows = await q(pg, `SELECT content FROM "editable_page" WHERE slug = $1 AND deleted_at IS NULL LIMIT 1`, [slug])
    const content = (rows && rows[0] && rows[0].content) ? String(rows[0].content) : ""
    res.setHeader("Cache-Control", "public, max-age=30, s-maxage=30")
    return res.json({ slug, content })
  } catch (e) {
    return res.json({ slug, content: "" })
  }
}
