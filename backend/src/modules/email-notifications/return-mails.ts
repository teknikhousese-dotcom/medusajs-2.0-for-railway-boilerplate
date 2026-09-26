import { SHOP_EMAIL, ADMIN_URL, brandedHtml, esc, nl2br, h1, para, label, button, kvTable, loadDbTemplate, fillTemplate, htmlToText, sendShopMail } from "./shop-mail"

/**
 * Teknikhouse.se: mails for a customer return / reklamation from /retur.
 *  - customer receipt   ("Vi har tagit emot din returanmälan RET-xxxx")
 *  - shop notification  to info@teknikhouse.se, reply-to = customer
 * Uses the Epostmallar templates "Returbekräftelse (kund)" and
 * "Returnotis (butik)" when they have content, otherwise built-in HTML.
 * Never throws.
 */

export type ReturnMailInput = {
  pg: any
  reference: string
  orderNumber: string
  orderId: string
  email: string
  type: "retur" | "reklamation" | string
  items: Array<{ title?: string; sku?: string; quantity?: number; reason?: string }>
  message?: string
  customerName?: string
  /* Test mode: send both mails to this address instead (admin test route). */
  overrideTo?: string
}

function itemsHtml(items: ReturnMailInput["items"]): string {
  return (items || [])
    .map((x) => `${esc(x.title)}${x.sku ? " (" + esc(x.sku) + ")" : ""}, ${Number(x.quantity || 1)} st${x.reason ? ". Orsak: " + esc(x.reason) : ""}`)
    .join("<br/>")
}

function itemsTable(items: ReturnMailInput["items"]): string {
  const rows = (items || []).map((x) => `<tr>
<td style="padding:8px 8px 8px 0;border-bottom:1px solid #ECECEF;vertical-align:top">${esc(x.title)}${x.sku ? `<div style="color:#8A8F9A;font-size:12px">${esc(x.sku)}</div>` : ""}</td>
<td style="padding:8px;border-bottom:1px solid #ECECEF;white-space:nowrap;vertical-align:top;text-align:right">${Number(x.quantity || 1)} st</td>
<td style="padding:8px 0 8px 8px;border-bottom:1px solid #ECECEF;vertical-align:top;color:#5B5F6B">${esc(x.reason || "")}</td>
</tr>`).join("")
  return `<table role="presentation" style="border-collapse:collapse;width:100%;font-size:14px">
<tr><th style="text-align:left;padding:6px 8px 6px 0;border-bottom:2px solid #14161C;font-size:12px">Vara</th><th style="text-align:right;padding:6px 8px;border-bottom:2px solid #14161C;font-size:12px">Antal</th><th style="text-align:left;padding:6px 0 6px 8px;border-bottom:2px solid #14161C;font-size:12px">Orsak</th></tr>
${rows}</table>`
}

export async function sendReturnMails(inp: ReturnMailInput): Promise<{ customer: boolean; shop: boolean }> {
  const typ = inp.type === "reklamation" ? "reklamation" : "retur"
  const Typ = typ === "reklamation" ? "Reklamation" : "Retur"
  const anmalan = typ === "reklamation" ? "reklamationsanmälan" : "returanmälan"
  const namn = (inp.customerName || "").trim()
  const adminLink = ADMIN_URL + "/app/ordrar?id=" + encodeURIComponent(inp.orderId)
  const datum = new Date().toLocaleString("sv-SE", { timeZone: "Europe/Stockholm" })
  const msg = String(inp.message || "").trim()
  const map: Record<string, string> = {
    "{{kundnamn}}": esc(namn || "kund"),
    "{{epost}}": esc(inp.email),
    "{{ordernummer}}": esc(inp.orderNumber),
    "{{referens}}": esc(inp.reference),
    "{{typ}}": typ,
    "{{anmalan}}": anmalan,
    "{{orderrader}}": itemsHtml(inp.items),
    "{{anledning}}": esc((inp.items || []).map((x) => x.reason).filter(Boolean).join(", ")),
    "{{meddelande}}": msg ? nl2br(msg) : "(inget meddelande)",
    "{{meddelande_block}}": msg ? "<strong>Ditt meddelande:</strong><br/>" + nl2br(msg) : "",
    "{{adminlank}}": esc(adminLink),
    "{{datum}}": esc(datum),
    /* Wiki-style placeholders used by the imported Epostmallar templates */
    "%referenceNumber%": esc(inp.reference),
    "%requestedDateTime%": esc(datum),
    "%orderID%": esc(inp.orderNumber),
    "%customerEmail%": esc(inp.email),
    "%customerName%": esc(namn),
    "%items%": label("Anmälda varor") + itemsTable(inp.items),
    "%comment%": msg ? label("Meddelande") + `<div style="font-size:14px">${nl2br(msg)}</div>` : "",
    "%nextSteps%": label("Så går det till nu") + para(`Vi går igenom din anmälan och mejlar dig bekräftelse och returinstruktioner inom 1 till 2 vardagar. Vänta gärna med att skicka tillbaka varan tills du fått instruktionerna, och märk paketet med <strong>${esc(inp.reference)}</strong>.`),
    "%shopName%": "Teknikhouse.se",
    "%shopEmail%": SHOP_EMAIL,
    "%shopURL%": "https://www.teknikhouse.se",
  }
  /* Imported Wiki templates are bare HTML fragments: give them the shop frame. */
  const framed = (html: string) => (/teknik<span/i.test(html) || /<html/i.test(html) ? html : brandedHtml(html))

  /* Customer receipt */
  let customer = false
  try {
    const tpl = await loadDbTemplate(inp.pg, "Returbekräftelse (kund)")
    let subject: string
    let html: string
    if (tpl) {
      subject = fillTemplate(tpl.subject || "Vi har tagit emot din {{anmalan}} {{referens}}", map).replace(/<[^>]+>/g, "")
      html = framed(fillTemplate(tpl.body_html, map).replace(/<p[^>]*>\s*<\/p>/g, ""))
    } else {
      subject = `Vi har tagit emot din ${anmalan} ${inp.reference}`
      html = brandedHtml(
        h1(`Tack! Din ${anmalan} är mottagen`) +
        para(`Hej ${esc(namn || "")},`.replace(" ,", ",")) +
        para(`Vi har tagit emot din ${anmalan} för order <strong>${esc(inp.orderNumber)}</strong>. Ditt referensnummer är <strong>${esc(inp.reference)}</strong>.`) +
        label("Anmälda varor") + itemsTable(inp.items) +
        (msg ? label("Ditt meddelande") + `<div style="font-size:14px">${nl2br(msg)}</div>` : "") +
        label("Så går det till nu") +
        para(`Vi går igenom din anmälan och mejlar dig bekräftelse och returinstruktioner inom 1 till 2 vardagar. Vänta gärna med att skicka tillbaka varan tills du fått instruktionerna, och märk paketet med <strong>${esc(inp.reference)}</strong>.`) +
        para("Vid retur återbetalar vi till samma betalsätt som du använde vid köpet, så snart varan kommit tillbaka till oss.") +
        para("Har du frågor? Svara bara på det här mejlet.") +
        para("Vänliga hälsningar,<br/>Teknikhouse.se"),
        `Referensnummer ${inp.reference}`
      )
    }
    const r = await sendShopMail({ to: inp.overrideTo || inp.email, subject: (inp.overrideTo ? "[TEST] " : "") + subject, html, text: htmlToText(html), replyTo: SHOP_EMAIL })
    customer = r.ok
  } catch (e: any) {
    console.error("[return-mails] customer receipt failed", inp.reference, e && e.message)
  }

  /* Shop notification */
  let shop = false
  try {
    const tpl = await loadDbTemplate(inp.pg, "Returnotis (butik)")
    let subject: string
    let html: string
    if (tpl) {
      subject = fillTemplate(tpl.subject || "Ny {{typ}} {{referens}}, order {{ordernummer}} ({{kundnamn}})", map).replace(/<[^>]+>/g, "")
      html = framed(fillTemplate(tpl.body_html, map) + button("Öppna ordern i admin", adminLink))
    } else {
      subject = `Ny ${typ} ${inp.reference}, order ${inp.orderNumber} (${namn || inp.email})`
      html = brandedHtml(
        h1(`Ny ${typ} att hantera`) +
        kvTable([
          ["Referens", `<strong>${esc(inp.reference)}</strong>`],
          ["Typ", Typ],
          ["Order", esc(inp.orderNumber)],
          ["Kund", `${esc(namn)} <a href="mailto:${esc(inp.email)}" style="color:#F50000;text-decoration:none">${esc(inp.email)}</a>`],
          ["Inkom", esc(datum)],
        ]) +
        label("Varor") + itemsTable(inp.items) +
        label("Kundens meddelande") + `<div style="font-size:14px">${msg ? nl2br(msg) : "(inget meddelande)"}</div>` +
        button("Öppna ordern i admin", adminLink) +
        para("Svara kunden direkt genom att svara på det här mejlet."),
        `${inp.reference}, order ${inp.orderNumber}`
      )
    }
    const r = await sendShopMail({ to: inp.overrideTo || SHOP_EMAIL, subject: (inp.overrideTo ? "[TEST] " : "") + subject, html, text: htmlToText(html), replyTo: inp.email })
    shop = r.ok
  } catch (e: any) {
    console.error("[return-mails] shop notification failed", inp.reference, e && e.message)
  }
  return { customer, shop }
}
