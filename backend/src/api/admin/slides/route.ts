import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getPg, genId, ensureTables, q } from "./db"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const pg = getPg(req.scope)
  if (!pg) return res.json({ slides: [] })
  await ensureTables(pg)
  const slides = await q(pg, `SELECT * FROM "home_slide" WHERE deleted_at IS NULL ORDER BY position ASC, created_at ASC`)
  return res.json({ slides })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const pg = getPg(req.scope)
  if (!pg) return res.status(500).json({ message: "no pg" })
  await ensureTables(pg)
  const b: any = req.body || {}
  if (b.kind === "new") {
    const id = genId("slide")
    const posRows = await q(pg, `SELECT COALESCE(MAX(position),0)+1 AS p FROM "home_slide" WHERE deleted_at IS NULL`)
    const pos = (posRows[0] && posRows[0].p) || 1
    await q(pg, `INSERT INTO "home_slide" (id,image_url,link_url,title,ingress,bg_color,active,position) VALUES (?,?,?,?,?,?,?,?)`,
      [id, b.image_url || "", b.link_url || "", b.title || "", b.ingress || "", b.bg_color || "#ffffff", b.active !== false, pos])
    const r = await q(pg, `SELECT * FROM "home_slide" WHERE id = ?`, [id]); return res.json({ slide: r[0] })
  }
  if (b.kind === "update") {
    const cols = ["image_url", "link_url", "title", "ingress", "bg_color", "active", "position"]
    const sets: string[] = []; const vals: any[] = []
    for (const c of cols) { if (c in b) { sets.push(`"${c}" = ?`); vals.push(c === "position" ? (Number(b[c]) || 0) : (c === "active" ? !!b[c] : (b[c] ?? null))) } }
    if (sets.length) { sets.push(`"updated_at" = now()`); vals.push(b.id); await q(pg, `UPDATE "home_slide" SET ${sets.join(", ")} WHERE id = ?`, vals) }
    const r = await q(pg, `SELECT * FROM "home_slide" WHERE id = ?`, [b.id]); return res.json({ slide: r[0] })
  }
  if (b.kind === "delete") { await q(pg, `UPDATE "home_slide" SET deleted_at = now() WHERE id = ?`, [b.id]); return res.json({ id: b.id, deleted: true }) }
  res.status(400).json({ message: "unknown kind" })
}
