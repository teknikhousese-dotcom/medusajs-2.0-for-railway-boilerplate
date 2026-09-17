import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getPg, genId, ensureTables, q } from "./db"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const pg = getPg(req.scope)
  if (!pg) return res.json({ templates: [] })
  await ensureTables(pg)
  const templates = await q(pg, `SELECT "id","name","subject","body_html","is_system" FROM "email_template" ORDER BY "is_system" DESC, "name" ASC`)
  res.json({ templates })
}

async function sendTestMail(to: string, subject: string, html: string) {
  const rk = process.env.RESEND_API_KEY, rf = process.env.RESEND_FROM_EMAIL
  if (rk && rf) {
    const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { "Authorization": "Bearer " + rk, "Content-Type": "application/json" }, body: JSON.stringify({ from: rf, to: [to], subject: subject, html: html }) })
    return r.ok ? { ok: true, message: "Testmejl skickat till " + to } : { ok: false, message: "Resend svarade " + r.status }
  }
  const sk = process.env.SENDGRID_API_KEY, sf = process.env.SENDGRID_FROM_EMAIL
  if (sk && sf) {
    const r = await fetch("https://api.sendgrid.com/v3/mail/send", { method: "POST", headers: { "Authorization": "Bearer " + sk, "Content-Type": "application/json" }, body: JSON.stringify({ personalizations: [{ to: [{ email: to }] }], from: { email: sf }, subject: subject, content: [{ type: "text/html", value: html }] }) })
    return (r.ok || r.status === 202) ? { ok: true, message: "Testmejl skickat till " + to } : { ok: false, message: "SendGrid svarade " + r.status }
  }
  return { ok: false, message: "Ingen e-postleverantör är konfigurerad. Lägg till RESEND_API_KEY + RESEND_FROM_EMAIL (eller SENDGRID_API_KEY + SENDGRID_FROM_EMAIL) i Railway så aktiveras utskicket direkt." }
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
    if (kind === "test") {
    const to = String(body.to || "").trim()
    if (!to) return res.status(400).json({ ok: false, message: "Ange en mottagaradress" })
    const rr = await sendTestMail(to, String(body.subject || "(inget ämne)"), String(body.body_html || ""))
    return res.status(rr.ok ? 200 : 502).json(rr)
  }
  return res.status(400).json({ message: "okänd kind" })
}
