import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getPg, q } from "../../admin/newsletter/db"

// Public contact + retail-application intake — matches teknikhouse /contact/ and /retail-application/.
// Persists every submission to "contact_message" and best-effort emails info@teknikhouse.se via Resend.
export const AUTHENTICATE = false

function genId() {
  return "msg_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10)
}
function esc(s: any) {
  return String(s ?? "").replace(/[<>&]/g, (c) => (({ "<": "&lt;", ">": "&gt;", "&": "&amp;" } as any)[c]))
}

async function ensureTable(pg: any) {
  await q(pg, `CREATE TABLE IF NOT EXISTS "contact_message" (
    "id" text NOT NULL,
    "kind" text NOT NULL DEFAULT 'contact',
    "name" text NULL, "email" text NULL, "phone" text NULL,
    "subject" text NULL, "message" text NULL, "payload" jsonb NULL,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT "contact_message_pkey" PRIMARY KEY ("id"))`)
}

async function sendMail(subject: string, html: string, replyTo?: string | null) {
  const key = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL
  if (!key || !from) return
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: "info@teknikhouse.se", subject, html, reply_to: replyTo || undefined }),
    })
  } catch {}
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const b = (req.body || {}) as any
  const kind = b.kind === "retail" ? "retail" : "contact"
  const name = b.name ? String(b.name).trim() : null
  const email = b.email ? String(b.email).trim() : null
  const phone = b.phone ? String(b.phone).trim() : null
  const subject = b.subject ? String(b.subject).trim() : null
  const message = b.message ? String(b.message).trim() : null
  if (!email && !message && !name && !b.company) {
    return res.status(400).json({ ok: false, error: "empty" })
  }
  try {
    const pg = getPg(req.scope)
    if (pg) {
      await ensureTable(pg)
      await q(
        pg,
        `INSERT INTO "contact_message" ("id","kind","name","email","phone","subject","message","payload") VALUES (?,?,?,?,?,?,?,?)`,
        [genId(), kind, name, email, phone, subject, message, JSON.stringify(b)]
      )
    }
  } catch (e) {}
  const rows = Object.entries(b)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 10px;border:1px solid #eee"><b>${esc(k)}</b></td><td style="padding:4px 10px;border:1px solid #eee">${esc(v)}</td></tr>`
    )
    .join("")
  const title = kind === "retail" ? "Ny företagsansökan (retail-application)" : "Nytt kontaktmeddelande"
  await sendMail(
    `${title} – ${name || email || ""}`,
    `<h2>${esc(title)}</h2><table style="border-collapse:collapse;font-family:sans-serif;font-size:14px">${rows}</table>`,
    email
  )
  return res.json({ ok: true })
}
