import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getPg, genId, ensureTables, q } from "./db"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const pg = getPg(req.scope)
  if (!pg) return res.json({ links: [] })
  await ensureTables(pg)
  const links = await q(pg, `SELECT * FROM "external_link" WHERE deleted_at IS NULL ORDER BY position ASC, created_at ASC`)
  res.json({ links })
}
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const pg = getPg(req.scope)
  if (!pg) return res.status(500).json({ message: "no pg" })
  await ensureTables(pg)
  const b: any = req.body || {}
  if (b.kind === "new") {
    const id = genId("link")
    await q(pg, `INSERT INTO "external_link" (id,url,title,description) VALUES (?,?,?,?)`, [id, b.url || "", b.title || null, b.description || null])
    const r = await q(pg, `SELECT * FROM "external_link" WHERE id = ?`, [id]); return res.json({ link: r[0] })
  }
  if (b.kind === "update") {
    const cols = ["url", "title", "description", "position"]
    const sets: string[] = []; const vals: any[] = []
    for (const c of cols) { if (c in b) { sets.push(`"${c}" = ?`); vals.push(c === "position" ? (Number(b[c]) || 0) : (b[c] ?? null)) } }
    if (sets.length) { sets.push(`"updated_at" = now()`); vals.push(b.id); await q(pg, `UPDATE "external_link" SET ${sets.join(", ")} WHERE id = ?`, vals) }
    const r = await q(pg, `SELECT * FROM "external_link" WHERE id = ?`, [b.id]); return res.json({ link: r[0] })
  }
  if (b.kind === "delete") { await q(pg, `UPDATE "external_link" SET deleted_at = now() WHERE id = ?`, [b.id]); return res.json({ id: b.id, deleted: true }) }
  res.status(400).json({ message: "unknown kind" })
}
