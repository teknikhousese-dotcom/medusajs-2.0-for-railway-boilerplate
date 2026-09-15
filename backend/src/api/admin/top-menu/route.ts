import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getPg, q } from "../editable/db"

// Top-menu placement manager. Stores product_category.metadata.hide_top.
// hide_top = true  -> hidden from the top department bar (still shown in the side menu)
// absent / false   -> shown in the top menu (default)

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const pg = getPg(req.scope)
    if (!pg) return res.json({ categories: [] })
    const rows = await q(
      pg,
      `SELECT "id","name","rank",("metadata"->>'hide_top') AS hide_top
       FROM "product_category"
       WHERE "parent_category_id" IS NULL AND "is_active" = true AND "deleted_at" IS NULL
       ORDER BY "rank" ASC, "name" ASC`,
      []
    )
    const categories = (rows || []).map((r: any) => ({
      id: r.id, name: r.name, rank: r.rank, hide_top: r.hide_top === "true",
    }))
    return res.json({ categories })
  } catch (e: any) {
    return res.status(500).json({ message: String(e?.message || e) })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const pg = getPg(req.scope)
    if (!pg) return res.status(500).json({ message: "no pg" })
    const b: any = req.body || {}
    const id = String(b.id || "")
    if (!id) return res.status(400).json({ message: "id required" })
    const hide = !!b.hide_top
    await q(
      pg,
      `UPDATE "product_category"
       SET "metadata" = jsonb_set(coalesce("metadata", '{}'::jsonb), '{hide_top}', to_jsonb(?::boolean), true),
           "updated_at" = now()
       WHERE "id" = ?`,
      [hide, id]
    )
    return res.json({ id, hide_top: hide })
  } catch (e: any) {
    return res.status(500).json({ message: String(e?.message || e) })
  }
}
