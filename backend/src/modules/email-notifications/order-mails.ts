import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { ADMIN_URL, SHOP_EMAIL, brandedHtml, esc, h1, kr, kvTable, label, button, htmlToText, sendShopMail } from "./shop-mail"

/**
 * Teknikhouse.se: the shop's own "new order" notification to info@teknikhouse.se,
 * replacing the one the old Wiki shop sent. Subject keeps the Wiki format
 * "Order <nr> (<namn>)" from "Teknikhouse.se <info@...>" so the existing mail
 * filter into "0 - New Orders Teknikhouse" keeps working.
 */

export async function loadOrderForMail(scope: any, id: string): Promise<any | null> {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  const base = [
    "id", "display_id", "email", "created_at", "currency_code", "metadata",
    "total", "subtotal", "item_total", "shipping_total", "tax_total", "discount_total",
    "items.*", "shipping_address.*", "billing_address.*",
    "shipping_methods.name", "shipping_methods.amount",
  ]
  try {
    const { data } = await query.graph({
      entity: "order",
      filters: { id },
      fields: [...base, "payment_collections.payments.provider_id"],
    })
    if (data && data[0]) return data[0]
  } catch (e: any) {
    console.error("[order-mails] full order query failed, retrying without payments:", e && e.message)
  }
  try {
    const { data } = await query.graph({ entity: "order", filters: { id }, fields: base })
    return (data && data[0]) || null
  } catch (e: any) {
    console.error("[order-mails] could not load order", id, e && e.message)
    return null
  }
}

export function orderNumber(order: any): string {
  const m = order?.metadata || {}
  return String(m.wiki_order_id || order?.display_id || "")
}

export function customerName(order: any): string {
  const a = order?.billing_address || {}
  const s = order?.shipping_address || {}
  const n = `${a.first_name || s.first_name || ""} ${a.last_name || s.last_name || ""}`.trim()
  return n
}

export function paymentLabel(order: any): string {
  const pays: any[] = []
  for (const pc of order?.payment_collections || []) for (const p of pc?.payments || []) pays.push(p)
  const pid = String(pays[0]?.provider_id || "")
  if (/kustom/i.test(pid)) return "Kustom Checkout (Klarna)"
  if (/klarna/i.test(pid)) return "Klarna"
  if (/swish/i.test(pid)) return "Swish"
  if (/stripe|card/i.test(pid)) return "Kort"
  const m = String(order?.metadata?.payment_method || "")
  if (/kustom/i.test(m)) return "Kustom Checkout (Klarna)"
  if (/klarna/i.test(m)) return "Klarna"
  if (/swish/i.test(m)) return "Swish"
  if (m) return m
  return pid || "Okänt"
}

function addressHtml(a: any): string {
  if (!a) return ""
  const lines = [
    `${a.first_name || ""} ${a.last_name || ""}`.trim(),
    a.company,
    a.address_1,
    a.address_2,
    `${a.postal_code || ""} ${a.city || ""}`.trim(),
    (a.country_code || "").toUpperCase() === "SE" ? "Sverige" : (a.country_code || "").toUpperCase(),
  ].filter((x) => x && String(x).trim())
  return lines.map(esc).join("<br/>")
}

export function orderAdminLink(order: any): string {
  return ADMIN_URL + "/app/ordrar?id=" + encodeURIComponent(order.id)
}

export function buildShopOrderMail(order: any): { subject: string; html: string; text: string; replyTo: string | null } {
  const nr = orderNumber(order)
  const name = customerName(order) || order.email || ""
  const subject = `Order ${nr} (${name})`
  const sa = order.shipping_address || null
  const ba = order.billing_address || null
  const phone = (sa && sa.phone) || (ba && ba.phone) || ""
  const ship = (order.shipping_methods || [])[0]
  const created = order.created_at ? new Date(order.created_at) : new Date()
  const inkom = created.toLocaleString("sv-SE", { timeZone: "Europe/Stockholm" })
  const items: any[] = order.items || []
  const itemRows = items.map((it: any) => {
    const qty = Number(it.quantity || 0)
    const line = Number(it.unit_price || 0) * qty
    const title = it.product_title && it.title && it.title !== it.product_title && it.title !== "Default variant"
      ? `${it.product_title} (${it.title})` : (it.product_title || it.title || "")
    return `<tr>
<td style="padding:8px 8px 8px 0;border-bottom:1px solid #ECECEF;color:#5B5F6B;white-space:nowrap;vertical-align:top">${esc(it.variant_sku || "")}</td>
<td style="padding:8px;border-bottom:1px solid #ECECEF;vertical-align:top">${esc(title)}</td>
<td style="padding:8px;border-bottom:1px solid #ECECEF;white-space:nowrap;text-align:right;vertical-align:top">${qty} st</td>
<td style="padding:8px 0 8px 8px;border-bottom:1px solid #ECECEF;white-space:nowrap;text-align:right;vertical-align:top">${kr(line)}</td>
</tr>`
  }).join("")
  const total = Number(order.total || 0)
  const shipTotal = order.shipping_total != null ? Number(order.shipping_total) : (ship ? Number(ship.amount || 0) : 0)
  const discount = Number(order.discount_total || 0)
  const tax = Number(order.tax_total || 0) > 0 ? Number(order.tax_total) : total * 0.2
  const sumRow = (k: string, v: string, bold = false) =>
    `<tr><td colspan="3" style="padding:5px 8px 5px 0;text-align:right;color:${bold ? "#14161C" : "#5B5F6B"};${bold ? "font-weight:700;font-size:15px" : ""}">${k}</td><td style="padding:5px 0 5px 8px;text-align:right;white-space:nowrap;${bold ? "font-weight:700;font-size:15px" : ""}">${v}</td></tr>`
  const table = `<table role="presentation" style="border-collapse:collapse;width:100%;font-size:14px">
<tr><th style="text-align:left;padding:6px 8px 6px 0;border-bottom:2px solid #14161C;font-size:12px">Artikelnr</th><th style="text-align:left;padding:6px 8px;border-bottom:2px solid #14161C;font-size:12px">Vara</th><th style="text-align:right;padding:6px 8px;border-bottom:2px solid #14161C;font-size:12px">Antal</th><th style="text-align:right;padding:6px 0 6px 8px;border-bottom:2px solid #14161C;font-size:12px">Summa</th></tr>
${itemRows}
${discount > 0 ? sumRow("Rabatt", "-" + kr(discount)) : ""}
${sumRow("Fraktkostnad", shipTotal === 0 ? "0 kr" : kr(shipTotal))}
${sumRow("Totalt", kr(total), true)}
${sumRow("Varav moms", kr(tax))}
</table>`
  const link = orderAdminLink(order)
  const inner =
    h1(`Ny order ${esc(nr)}`) +
    kvTable([
      ["Order ID", `<strong>${esc(nr)}</strong>`],
      ["Inkom", esc(inkom)],
      ["Betalning", esc(paymentLabel(order))],
      ["Leverans", esc(ship?.name || "")],
      ["Totalt", `<strong>${kr(total)}</strong>`],
    ]) +
    label("Beställare") +
    `<div style="font-size:14px;line-height:1.6">${addressHtml(ba || sa)}<br/><a href="mailto:${esc(order.email)}" style="color:#F50000;text-decoration:none">${esc(order.email)}</a>${phone ? "<br/>Telefon: " + esc(phone) : ""}</div>` +
    (sa && ba && addressHtml(sa) !== addressHtml(ba) ? label("Leveransadress") + `<div style="font-size:14px;line-height:1.6">${addressHtml(sa)}</div>` : "") +
    label("Varor") +
    table +
    button("Öppna ordern i admin", link) +
    `<div style="font-size:12px;color:#8A8F9A">${esc(link)}</div>`
  const html = brandedHtml(inner, `${name}, ${kr(total)}, ${paymentLabel(order)}`)
  return { subject, html, text: htmlToText(inner), replyTo: order.email || null }
}

export async function sendShopOrderNotification(scope: any, orderId: string, to: string = SHOP_EMAIL) {
  const order = await loadOrderForMail(scope, orderId)
  if (!order) return { ok: false, error: "Ordern kunde inte laddas" }
  const m = buildShopOrderMail(order)
  const r = await sendShopMail({ to, subject: m.subject, html: m.html, text: m.text, replyTo: m.replyTo || SHOP_EMAIL })
  return { ...r, subject: m.subject, to }
}

/** Epostmallar placeholders for an order (same names as the admin order-email composer). */
export function orderPlaceholderMap(order: any): Record<string, string> {
  const sa = order?.shipping_address || {}
  const items: any[] = order?.items || []
  const rader = items
    .map((it: any) => `${esc(it.product_title || it.title)}${it.variant_sku ? " (" + esc(it.variant_sku) + ")" : ""}, ${Number(it.quantity || 0)} st, ${kr(Number(it.unit_price || 0) * Number(it.quantity || 0))}`)
    .join("<br/>")
  const namn = customerName(order)
  const adress = addressHtml(order?.shipping_address || order?.billing_address)
  const ship = (order?.shipping_methods || [])[0]
  return {
    "{{kundnamn}}": esc(namn || "kund"),
    "{{fornamn}}": esc(sa.first_name || ""),
    "{{epost}}": esc(order?.email || ""),
    "{{ordernummer}}": esc(orderNumber(order)),
    "{{orderrader}}": rader,
    "{{ordertotal}}": kr(order?.total),
    "{{frakt}}": kr(order?.shipping_total || 0),
    "{{leveranssatt}}": esc(ship?.name || ""),
    "{{betalsatt}}": esc(paymentLabel(order)),
    "{{leveransadress}}": adress,
    "{{orderdatum}}": order?.created_at ? new Date(order.created_at).toLocaleDateString("sv-SE", { timeZone: "Europe/Stockholm" }) : "",
  }
}
