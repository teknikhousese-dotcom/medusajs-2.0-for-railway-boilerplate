import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * Engångs-ingest: kopierar Wikinggruppens riktiga e-postmallar (subject_sv + body_sv)
 * in i email_template-tabellen, matchat på namn. CORS-öppen (enkel förfrågan, text/plain)
 * så att den inloggade teknikhouse.se-fliken kan POSTa hit direkt. Token-skyddad.
 */

const TOKEN = "thse_wiki_email_2026"

const SYSTEM = new Set([
  "Följesedel", "Glömt lösenord", "Kampanjutskick", "Lagerbevakning",
  "Leveransnotis", "Nytt inloggningskonto", "Returbekräftelse (kund)",
  "Returnotis (butik)", "Uppföljningsmail", "Uppföljningsmail - Belöning",
])
const sysId = (name: string) => "etpl_sys_" + name.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()
const genId = () => "etpl_" + Math.random().toString(36).slice(2) + Date.now().toString(36)

function cors(res: MedusaResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")
}

export async function OPTIONS(req: MedusaRequest, res: MedusaResponse) {
  cors(res); res.status(204).send("")
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  cors(res); res.json({ ok: true, hint: "POST { token, templates:[{name,subject,body_html}] } as text/plain" })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  cors(res)
  let body: any = req.body
  if (typeof body === "string") { try { body = JSON.parse(body) } catch { body = {} } }
  if (!body || body.token !== TOKEN) return res.status(403).json({ ok: false, message: "bad token" })
  const templates = Array.isArray(body.templates) ? body.templates : []
  const pg: any = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)

  await pg.raw(`CREATE TABLE IF NOT EXISTS "email_template" (
    "id" text PRIMARY KEY, "name" text NOT NULL, "subject" text DEFAULT '',
    "body_html" text DEFAULT '', "is_system" boolean DEFAULT false, "updated_at" timestamptz DEFAULT now()
  )`)

  let updated = 0, inserted = 0
  const results: any[] = []
  for (const t of templates) {
    const name = String(t.name || "").trim()
    if (!name) continue
    const subject = String(t.subject || "")
    const html = String(t.body_html || "")
    const isSys = SYSTEM.has(name)
    // Finns raden redan (via system-id eller namn)?
    const existing = await pg.raw(`SELECT "id" FROM "email_template" WHERE "id"=? OR "name"=? LIMIT 1`, [sysId(name), name])
    const row = existing && existing.rows && existing.rows[0]
    if (row) {
      await pg.raw(`UPDATE "email_template" SET "subject"=?, "body_html"=?, "updated_at"=now() WHERE "id"=?`, [subject, html, row.id])
      updated++
      results.push({ name, action: "update" })
    } else {
      const id = isSys ? sysId(name) : genId()
      await pg.raw(`INSERT INTO "email_template" ("id","name","subject","body_html","is_system") VALUES (?, ?, ?, ?, ?) ON CONFLICT ("id") DO UPDATE SET "subject"=EXCLUDED."subject","body_html"=EXCLUDED."body_html"`, [id, name, subject, html, isSys])
      inserted++
      results.push({ name, action: "insert" })
    }
  }
  res.json({ ok: true, received: templates.length, updated, inserted, results })
}
