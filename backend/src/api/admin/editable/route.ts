import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getPg, genId, ensureTables, q } from "./db"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const pg = getPg(req.scope)
  if (!pg) return res.json({ pages: [], areas: [] })
  await ensureTables(pg)
  const pages = await q(pg, `SELECT * FROM "editable_page" WHERE deleted_at IS NULL ORDER BY name ASC`)
  const areas = await q(pg, `SELECT * FROM "editable_area" ORDER BY name ASC`)
  res.json({ pages, areas })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const pg = getPg(req.scope)
  if (!pg) return res.status(500).json({ message: "no pg" })
  await ensureTables(pg)
  const b: any = req.body || {}
  const kind = b.kind
  if (kind === "page-new") {
    const id = genId("epage")
    const slug = (b.slug || b.name || "").toString().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    await q(pg, `INSERT INTO "editable_page" (id,name,slug,content) VALUES (?,?,?,?)`, [id, b.name || "Ny sida", slug, ""])
    const r = await q(pg, `SELECT * FROM "editable_page" WHERE id = ?`, [id]); return res.json({ page: r[0] })
  }
  if (kind === "page-update") {
    const cols = ["name", "slug", "content", "show_in_footer"]
    const sets: string[] = []; const vals: any[] = []
    for (const c of cols) { if (c in b) { sets.push(`"${c}" = ?`); vals.push(c === "show_in_footer" ? !!b[c] : (b[c] ?? null)) } }
    if (sets.length) { sets.push(`"updated_at" = now()`); vals.push(b.id); await q(pg, `UPDATE "editable_page" SET ${sets.join(", ")} WHERE id = ?`, vals) }
    const r = await q(pg, `SELECT * FROM "editable_page" WHERE id = ?`, [b.id]); return res.json({ page: r[0] })
  }
  if (kind === "page-delete") {
    const r = await q(pg, `SELECT protected FROM "editable_page" WHERE id = ?`, [b.id])
    if (r.length && r[0].protected) return res.status(400).json({ message: "Kan inte ta bort" })
    await q(pg, `UPDATE "editable_page" SET deleted_at = now() WHERE id = ?`, [b.id]); return res.json({ id: b.id, deleted: true })
  }
  if (kind === "area-update") {
    const sets: string[] = []; const vals: any[] = []
    if ("content" in b) { sets.push(`"content" = ?`); vals.push(b.content ?? null) }
    if ("name" in b) { sets.push(`"name" = ?`); vals.push(b.name) }
    if (sets.length) { sets.push(`"updated_at" = now()`); vals.push(b.id); await q(pg, `UPDATE "editable_area" SET ${sets.join(", ")} WHERE id = ?`, vals) }
    const r = await q(pg, `SELECT * FROM "editable_area" WHERE id = ?`, [b.id]); return res.json({ area: r[0] })
  }
  res.status(400).json({ message: "unknown kind" })
}
