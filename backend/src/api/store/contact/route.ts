import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getPg, q } from "../../admin/newsletter/db"
import { SHOP_EMAIL, brandedHtml, esc, nl2br, h1, para, label, kvTable, htmlToText, sendShopMail } from "../../../modules/email-notifications/shop-mail"

// Public contact + retail-application intake — matches teknikhouse /contact/ and /retail-application/.
// Persists every submission to "contact_message" and best-effort emails info@teknikhouse.se via Resend.
export const AUTHENTICATE = false

function genId() {
  return "msg_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10)
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
  /* Readable mail to the shop: Swedish labels, known fields first, reply-to = customer. */
  try {
    const LABELS: Record<string, string> = {
      name: "Namn", email: "E-post", phone: "Telefon", orderNo: "Ordernummer", order: "Ordernummer",
      company: "Företag", orgnr: "Org.nr", subject: "Ämne", message: "Meddelande",
    }
    const SKIP = new Set(["kind", "message"])
    const known = ["name", "email", "phone", "orderNo", "order", "company", "orgnr", "subject"]
    const extra = Object.keys(b).filter((k) => !known.includes(k) && !SKIP.has(k))
    const fmt = (k: string, v: any) => {
      const t = typeof v === "object" ? JSON.stringify(v) : String(v ?? "")
      if (!t.trim()) return ""
      if (k === "email") return `<a href="mailto:${esc(t)}" style="color:#F50000;text-decoration:none">${esc(t)}</a>`
      if (k === "phone") return `<a href="tel:${esc(t.replace(/\s+/g, ""))}" style="color:#14161C;text-decoration:none">${esc(t)}</a>`
      return esc(t)
    }
    const rows: Array<[string, string]> = [...known, ...extra].map((k) => [LABELS[k] || k, fmt(k, (b as any)[k])] as [string, string])
    const isRetail = kind === "retail"
    const who = name || (b.company ? String(b.company) : "") || email || "okänd avsändare"
    const mailSubject = isRetail
      ? `Företagsansökan från webbshopen, ${who}`
      : `Kontaktmail från webbshopen, ${who}${subject ? ": " + subject : ""}`
    const inner =
      h1(isRetail ? "Ny företagsansökan" : "Nytt meddelande från kontaktformuläret") +
      kvTable(rows) +
      label("Meddelande") +
      `<div style="font-size:14px;line-height:1.7;background:#F7F7FA;border-radius:8px;padding:14px 16px;white-space:normal">${message ? nl2br(message) : "(inget meddelande)"}</div>` +
      para(`<span style="color:#8A8F9A;font-size:12px">Skickat ${esc(new Date().toLocaleString("sv-SE", { timeZone: "Europe/Stockholm" }))} via teknikhouse.se. Svara direkt på det här mejlet så går svaret till kunden.</span>`)
    await sendShopMail({
      to: SHOP_EMAIL,
      subject: mailSubject.slice(0, 180),
      html: brandedHtml(inner, message ? message.slice(0, 120) : ""),
      text: htmlToText(inner),
      replyTo: email && /@/.test(email) ? email : SHOP_EMAIL,
    })
  } catch (e: any) {
    console.error("[contact] mail failed", e && e.message)
  }
  return res.json({ ok: true })
}
