import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * Ordermeddelande – skicka e-post till kunden (motsvarar Wikis order_message.php).
 * GET  /admin/order-email?order=<id>  → mottagare, orderdata för platshållare, mallar
 * POST /admin/order-email             → { order_id, to, subject, html } → skickar mejlet
 *
 * Transport: Resend HTTP-API om RESEND_API_KEY + RESEND_FROM_EMAIL finns.
 * Utan konfigurerad leverantör returneras ett tydligt felmeddelande.
 */

const kr = (n: number) =>
  new Intl.NumberFormat("sv-SE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n || 0)) + " kr"

async function loadTemplates(scope: any) {
  try {
    const pg = scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    const r = await pg.raw(`SELECT "id","name","subject","body_html","is_system" FROM "email_template" ORDER BY "is_system" DESC, "name" ASC`)
    return (r && r.rows) || []
  } catch { return [] }
}

async function loadOrder(scope: any, id: string) {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "order",
    fields: ["id", "display_id", "email", "currency_code", "total", "metadata", "items.*", "shipping_address.*"],
    filters: { id },
  })
  return (data || [])[0]
}

function placeholders(order: any): Record<string, string> {
  const sa = order.shipping_address || {}
  const m = order.metadata || {}
  const items = order.items || []
  const rader = items
    .map((it: any) => `${it.title}${it.variant_sku ? " (" + it.variant_sku + ")" : ""} – ${it.quantity} st`)
    .join("<br/>")
  const namn = `${sa.first_name || ""} ${sa.last_name || ""}`.trim()
  const adress = [namn, sa.address_1, `${sa.postal_code || ""} ${sa.city || ""}`.trim(), (sa.country_code || "").toUpperCase()]
    .filter(Boolean).join("<br/>")
  return {
    "{{kundnamn}}": namn || "kund",
    "%firstName%": sa.first_name || "", "%lastName%": sa.last_name || "", "%customerName%": namn || "kund", "%name%": namn || "kund", "%orderID%": String(m.wiki_order_id || order.display_id || ""), "%orderNumber%": String(m.wiki_order_id || order.display_id || ""), "%address%": adress, "%deliveryAddress%": adress, "%email%": order.email || "", "%shopName%": "Teknikhouse.se", "%shopURL%": "https://teknikhouse.se", "%productName%": items[0] ? String(items[0].title) : "", "%trackingID%": String(m.tracking_number || m.sparnummer || ""), "%trackingURL%": String(m.tracking_url || m.sparlank || ""), "%password%": "", "%orderRows%": rader, "%orderTotal%": kr(order.total),
    "{{epost}}": order.email || "",
    "{{ordernummer}}": String(m.wiki_order_id || order.display_id || ""),
    "{{orderrader}}": rader,
    "{{ordertotal}}": kr(order.total),
    "{{leveransadress}}": adress,
    "{{sparnummer}}": String(m.tracking_number || m.sparnummer || ""),
    "{{sparlank}}": String(m.tracking_url || m.sparlank || ""),
    "{{produktnamn}}": items[0] ? String(items[0].title) : "",
    "{{produktlank}}": "https://teknikhouse.se",
    "{{rabattkod}}": String(m.rabattkod || ""),
    "{{omdome_lank}}": "https://teknikhouse.se",
    "{{aterstall_lank}}": "https://teknikhouse.se/account",
    "{{anledning}}": String(m.return_reason || ""),
    "{{amne}}": "",
    "{{rubrik}}": "",
    "{{innehall}}": "",
  }
}

function render(text: string, map: Record<string, string>): string {
  let out = text || ""
  for (const [k, v] of Object.entries(map)) out = out.split(k).join(v)
  return out
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const id = String((req.query as any).order || "")
  const templates = await loadTemplates(req.scope)
  if (!id) return res.json({ templates, order: null })
  try {
    const order = await loadOrder(req.scope, id)
    const map = placeholders(order)
    res.json({
      templates,
      order: {
        id: order.id,
        display_id: order.display_id,
        wiki_order_id: (order.metadata || {}).wiki_order_id || null,
        email: order.email,
        customer_name: map["{{kundnamn}}"],
      },
      placeholders: map,
    })
  } catch (e: any) {
    res.status(404).json({ templates, order: null, message: "Ordern kunde inte hittas." })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body: any = req.body || {}
  const order_id = String(body.order_id || "")
  let to = String(body.to || "").trim()
  let subject = String(body.subject || "")
  let html = String(body.html || "")

  if (!to || !subject || !html) return res.status(400).json({ ok: false, message: "Mottagare, ämne och innehåll krävs." })

  // Slutlig platshållar-rendering på servern (idempotent).
  if (order_id) {
    try {
      const order = await loadOrder(req.scope, order_id)
      const map = placeholders(order)
      subject = render(subject, map)
      html = render(html, map)
      if (!to) to = order.email
    } catch { /* fortsätt ändå */ }
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY
  const FROM = process.env.RESEND_FROM_EMAIL || process.env.SENDGRID_FROM_EMAIL || "info@teknikhouse.se"

  if (RESEND_API_KEY) {
    try {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: `Teknikhouse.se <${FROM}>`, to: [to], subject, html }),
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) return res.status(502).json({ ok: false, provider: "resend", message: "E-post kunde inte skickas. Kontrollera mottagaradressen och forsok igen." })
      return res.json({ ok: true, provider: "resend", id: (data as any)?.id || null, to, subject })
    } catch (e: any) {
      return res.status(502).json({ ok: false, provider: "resend", message: "Kunde inte nå Resend." })
    }
  }

  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
  if (SENDGRID_API_KEY) {
    try {
      const r = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: { Authorization: `Bearer ${SENDGRID_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: FROM, name: "Teknikhouse.se" },
          subject,
          content: [{ type: "text/html", value: html }],
        }),
      })
      if (!(r.status >= 200 && r.status < 300)) {
        const t = await r.text().catch(() => "")
        return res.status(502).json({ ok: false, provider: "sendgrid", message: "E-post kunde inte skickas. Forsok igen." })
      }
      return res.json({ ok: true, provider: "sendgrid", to, subject })
    } catch (e: any) {
      return res.status(502).json({ ok: false, provider: "sendgrid", message: "Kunde inte nå SendGrid." })
    }
  }

  return res.status(503).json({
    ok: false,
    provider: null,
    message: "Ingen e-postleverantör är konfigurerad. Lägg till RESEND_API_KEY + RESEND_FROM_EMAIL (eller SENDGRID_API_KEY + SENDGRID_FROM_EMAIL) i Railway så aktiveras utskicket direkt.",
  })
}
