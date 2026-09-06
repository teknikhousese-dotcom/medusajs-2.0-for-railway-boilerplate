import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getPg, genId, ensureTables, q } from "./db"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const pg = getPg(req.scope)
  if (!pg) return res.json({ templates: [] })
  await ensureTables(pg)
  const templates = await q(pg, `SELECT "id","name","subject","body_html","is_system" FROM "email_template" ORDER BY "is_system" DESC, "name" ASC`)
  res.json({ templates })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const pg = getPg(req.scope)
  if (!pg) return res.status(500).json({ message: "no pg" })
  await ensureTables(pg)
  const body: any = req.body || {}
  const kind = body.kind
  if (kind === "new") {
    const name = (body.name || "").trim()
    if (!name) return res.status(400).json({ message: "namn saknas" })
    const id = genId("etpl")
    await q(pg, `INSERT INTO "email_template" ("id","name","is_system") VALUES (?, ?, false)`, [id, name])
    return res.json({ ok: true, id })
  }
  if (kind === "update") {
    await q(pg, `UPDATE "email_template" SET "subject"=?, "body_html"=?, "updated_at"=now() WHERE "id"=?`, [body.subject || "", body.body_html || "", body.id])
    return res.json({ ok: true })
  }
  if (kind === "delete") {
    await q(pg, `DELETE FROM "email_template" WHERE "id"=? AND "is_system"=false`, [body.id])
    return res.json({ ok: true })
  }
  return res.status(400).json({ message: "okänd kind" })
}
