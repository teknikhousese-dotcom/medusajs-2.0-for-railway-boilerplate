/**
 * Teknikhouse.se: shared helpers for transactional mails that are sent straight
 * through the Resend HTTP API (shop notifications, return receipts, contact form).
 *
 * - sendShopMail() never throws. It returns { ok, id, error } and logs failures,
 *   so a mail problem can never break an order, a return or a contact request.
 * - From: "Teknikhouse.se <RESEND_FROM_EMAIL>" unless RESEND_FROM_EMAIL already
 *   carries a display name. Reply-to defaults to info@teknikhouse.se.
 * - brandedHtml() renders the same dark header / red accent frame as the
 *   Epostmallar defaults, so every mail looks like it comes from the same shop.
 */

export const SHOP_EMAIL = process.env.SHOP_NOTIFY_EMAIL || "info@teknikhouse.se"
const rawAdmin = String(process.env.BACKEND_PUBLIC_URL || process.env.RAILWAY_PUBLIC_DOMAIN_VALUE || "backend-production-c278d.up.railway.app").trim().replace(/\/+$/, "")
export const ADMIN_URL = /^https?:\/\//.test(rawAdmin) ? rawAdmin : "https://" + rawAdmin

export function fromAddress(): string {
  const raw = String(process.env.RESEND_FROM_EMAIL || process.env.RESEND_FROM || SHOP_EMAIL).trim()
  if (raw.includes("<")) return raw
  return "Teknikhouse.se <" + raw + ">"
}

export function esc(s: any): string {
  return String(s ?? "").replace(/[<>&"]/g, (c) => (({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" } as any)[c]))
}

export function kr(n: any): string {
  const v = Number(n)
  if (!Number.isFinite(v)) return ""
  const hasOre = Math.round(v * 100) % 100 !== 0
  return new Intl.NumberFormat("sv-SE", { minimumFractionDigits: hasOre ? 2 : 0, maximumFractionDigits: 2 }).format(v) + " kr"
}

export function nl2br(s: any): string {
  return esc(s).replace(/\r?\n/g, "<br/>")
}

export type ShopMail = {
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string | null
  from?: string
}

export async function sendShopMail(m: ShopMail): Promise<{ ok: boolean; id?: string | null; error?: string }> {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.error("[shop-mail] RESEND_API_KEY missing, mail not sent:", m.subject)
    return { ok: false, error: "RESEND_API_KEY saknas" }
  }
  const to = (Array.isArray(m.to) ? m.to : [m.to]).map((x) => String(x || "").trim()).filter(Boolean)
  if (!to.length) return { ok: false, error: "mottagare saknas" }
  const body: any = {
    from: m.from || fromAddress(),
    to,
    subject: m.subject,
    html: m.html,
    reply_to: m.replyTo === null ? undefined : (m.replyTo || SHOP_EMAIL),
  }
  if (m.text) body.text = m.text
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const j: any = await r.json().catch(() => ({}))
    if (!r.ok) {
      const err = (j && (j.message || j.name)) || ("HTTP " + r.status)
      console.error("[shop-mail] Resend rejected \"" + m.subject + "\" to " + to.join(",") + ": " + err)
      return { ok: false, error: String(err) }
    }
    console.log("[shop-mail] sent \"" + m.subject + "\" to " + to.join(",") + " id=" + (j && j.id))
    return { ok: true, id: (j && j.id) || null }
  } catch (e: any) {
    console.error("[shop-mail] could not reach Resend for \"" + m.subject + "\": " + (e && e.message))
    return { ok: false, error: String((e && e.message) || e) }
  }
}

/** Branded frame (same look as the Epostmallar defaults). `inner` is trusted HTML. */
export function brandedHtml(inner: string, preheader = ""): string {
  return `<!doctype html><html lang="sv"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preheader)}</div>` : ""}
<div style="margin:0;padding:24px 0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:10px;overflow:hidden">
    <div style="background:#111114;padding:20px 28px">
      <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:.5px">teknik<span style="color:#F50000">house</span>.se</span>
    </div>
    <div style="padding:26px 28px;font-size:14px;line-height:1.6">
${inner}
    </div>
    <div style="background:#111114;padding:18px 28px;color:#c9c9cf;font-size:12px;line-height:1.7">
      <div style="color:#ffffff;font-weight:700;margin-bottom:4px">Nordic Teknik House AB</div>
      Sveavägen 139, 113 46 Stockholm &middot; <a href="mailto:info@teknikhouse.se" style="color:#9db8ff;text-decoration:none">info@teknikhouse.se</a>
    </div>
  </div>
</div>
</body></html>`
}

export const h1 = (t: string) => `<h1 style="font-size:20px;margin:0 0 14px;color:#111114">${t}</h1>`
export const para = (t: string) => `<p style="font-size:14px;line-height:1.7;margin:0 0 14px">${t}</p>`
export const label = (t: string) => `<div style="font-size:11px;font-weight:700;color:#8A8F9A;text-transform:uppercase;letter-spacing:.06em;margin:18px 0 6px">${t}</div>`
export const button = (text: string, href: string) =>
  `<p style="margin:20px 0"><a href="${esc(href)}" style="display:inline-block;background:#F50000;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:11px 24px;border-radius:6px">${text}</a></p>`

/** Two-column key/value table. Values are trusted HTML (escape before passing). */
export function kvTable(rows: Array<[string, string]>): string {
  const tr = rows
    .filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== "")
    .map(([k, v]) => `<tr><td style="padding:7px 12px 7px 0;color:#5B5F6B;white-space:nowrap;vertical-align:top;width:1%">${esc(k)}</td><td style="padding:7px 0;color:#14161C;vertical-align:top">${v}</td></tr>`)
    .join("")
  return `<table role="presentation" style="border-collapse:collapse;width:100%;font-size:14px">${tr}</table>`
}

/** Load an Epostmallar template (email_template table) by name. Null when missing or empty. */
export async function loadDbTemplate(pg: any, name: string): Promise<{ subject: string; body_html: string } | null> {
  if (!pg || typeof pg.raw !== "function") return null
  try {
    const r = await pg.raw(`SELECT "subject","body_html" FROM "email_template" WHERE "name" = ? LIMIT 1`, [name])
    const row = r && r.rows && r.rows[0]
    if (!row || !String(row.body_html || "").trim()) return null
    return { subject: String(row.subject || ""), body_html: String(row.body_html || "") }
  } catch {
    return null
  }
}

/** Replace {{placeholders}} in a template. Values are inserted as-is (escape before). */
export function fillTemplate(text: string, map: Record<string, string>): string {
  let out = String(text || "")
  for (const [k, v] of Object.entries(map)) out = out.split(k).join(v)
  return out
}

/** Plain-text fallback from simple HTML. */
export function htmlToText(html: string): string {
  return String(html || "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|h1|h2|h3|li|table)>/gi, "\n")
    .replace(/<\/td>/gi, "  ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ").replace(/&middot;/g, "·").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}
