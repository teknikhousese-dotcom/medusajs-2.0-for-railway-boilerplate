import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getPg, q } from "../../../admin/editable/db"

export const AUTHENTICATE = false

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const slug = String((req.params as any)?.slug || "")
  const dbg: any = {}
  let content = ""
  try {
    const pg = getPg(req.scope)
    dbg.pg = pg ? "yes" : "no"
    if (pg) {
      const rows = await q(
        pg,
        `SELECT "content" FROM "editable_page" WHERE "slug" = $1 AND "deleted_at" IS NULL ORDER BY "updated_at" DESC LIMIT 1`,
        [slug]
      )
      dbg.rows = Array.isArray(rows) ? rows.length : String(typeof rows)
      content = rows && rows[0] && rows[0].content ? String(rows[0].content) : ""
    }
  } catch (e) {
    dbg.err = String(e).slice(0, 140)
  }
  res.setHeader("Cache-Control", "no-store")
  return res.json({ slug, content, _dbg: dbg })
}
