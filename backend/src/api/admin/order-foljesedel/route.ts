import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * Följesedel (packing slip) – admin-endpoint som returnerar ett komplett,
 * utskriftsklart HTML-dokument för en order (motsvarar Wikinggruppens gamla
 * följesedel/kvitto, men i Teknikhouse.se-design).
 *
 * GET /admin/order-foljesedel?id=<order_id>
 *
 * Medusa v2: alla belopp är MAJOR-unit floats (t.ex. 3790 = 3790 kr).
 * Priser är inkl. 25% moms.
 */

const kr = (n: number | string | null | undefined) =>
  new Intl.NumberFormat("sv-SE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(n || 0)) + " kr"

const esc = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")

function formatDateTime(input: string | Date | null | undefined): string {
  if (!input) return ""
  const d = new Date(input)
  if (isNaN(d.getTime())) return ""
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Stockholm",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(d)
  const get = (t: string) => parts.find((p) => p.type === t)?.value || "00"
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}:${get("second")}`
}

function paymentLabel(providerId?: string | null, metaMethod?: string | null): string {
  const meta = String(metaMethod || "").trim()
  if (meta) return meta.toUpperCase()
  const p = String(providerId || "").toLowerCase()
  if (!p) return "–"
  if (p.includes("klarna")) return "KLARNA"
  if (p.includes("swish")) return "SWISH"
  if (p.includes("stripe")) return "KORT"
  if (p.includes("paypal")) return "PAYPAL"
  if (p.includes("payson")) return "PAYSON"
  if (p.includes("manual") || p.includes("system")) return "MANUELL"
  const cleaned = p.replace(/^pp_/, "").split("_")[0]
  return cleaned ? cleaned.toUpperCase() : p.toUpperCase()
}

async function loadOrder(scope: any, id: string) {
  // Använd query.graph (samma mönster som order-fliks + order-detalj) — stödjer
  // beräknade totalsummor (total/tax_total/…) samt relationer som fält, vilket
  // orderService.retrieveOrder({ select }) inte gör för beräknade fält.
  const query: any = scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
      "email",
      "currency_code",
      "total",
      "subtotal",
      "tax_total",
      "shipping_total",
      "discount_total",
      "created_at",
      "metadata",
      "items.title",
      "items.subtitle",
      "items.quantity",
      "items.unit_price",
      "items.total",
      "items.variant_sku",
      "items.product_id",
      "items.metadata",
      "shipping_address.first_name",
      "shipping_address.last_name",
      "shipping_address.address_1",
      "shipping_address.address_2",
      "shipping_address.postal_code",
      "shipping_address.city",
      "shipping_address.country_code",
      "shipping_address.phone",
      "shipping_methods.name",
      "payment_collections.payments.provider_id",
    ],
    filters: { id: [id] },
  })
  const o = data && data[0]
  if (!o) throw new Error("Order hittades inte")
  return o
}

function renderFoljesedel(order: any): string {
  const sa = order.shipping_address || {}
  const m = order.metadata || {}
  const items = order.items || []

  const displayId = m.wiki_order_id || order.display_id || order.id
  const orderNr = String(m.wiki_order_id || order.display_id || order.id)

  const namn = `${sa.first_name || ""} ${sa.last_name || ""}`.trim() || "–"
  const address1 = sa.address_1 || ""
  const address2 = sa.address_2 || ""
  const postalCity = `${sa.postal_code || ""} ${sa.city || ""}`.trim()
  const land = (sa.country_code || "").toString().toUpperCase()
  const countryNames: Record<string, string> = {
    SE: "SVERIGE",
    NO: "NORGE",
    DK: "DANMARK",
    FI: "FINLAND",
  }
  const landNamn = countryNames[land] || land

  const phone = sa.phone || m.phone || ""
  const mobile = m.mobile || m.mobiltelefon || m.cell_phone || sa.phone || ""

  const shippingMethod = order.shipping_methods?.[0]?.name || m.wiki_shipping_method || "Standard"
  /* Wiki-ordrar: visa Wikis sparade leveranstext, inte dagens fraktalternativ. */
  const shipDesc = m.wiki_shipping_desc || (m.wiki_order_id ? "" : "Standard / 2-3 vardagar. Fraktfritt vid köp över 999 kr.")

  const payments = order.payment_collections?.flatMap((pc: any) => pc.payments || []) || []
  const providerId = payments?.[0]?.provider_id
  const betalningstyp = paymentLabel(providerId, m.payment_method)

  /* Wiki-tid är redan svensk lokal tid och visas som den är; annars created_at i Europe/Stockholm. */
  const wikiTime = m.wiki_order_time || m.order_time
  const inkom = wikiTime ? String(wikiTime).replace("T", " ").slice(0, 19) : formatDateTime(order.created_at)

  const grossFactor = Number(order.tax_total) > 0 ? 1 : 1.25
  const itemRows = items
    .map((it: any) => {
      const artikelnr = esc(it.variant_sku || (it.metadata && it.metadata.sku) || it.product_id || "-")
      let vara = esc(it.title || it.product_title || "")
      if (it.subtitle) vara += ` <span class="muted">(${esc(it.subtitle)})</span>`
      const antal = `${Number(it.quantity || 0)} st`
      const summa = kr((Number(it.unit_price) || 0) * Number(it.quantity || 0) * grossFactor)
      return `
        <tr>
          <td class="col-sku">${artikelnr}</td>
          <td class="col-vara">${vara}</td>
          <td class="col-antal">${antal}</td>
          <td class="col-summa">${summa}</td>
        </tr>`
    })
    .join("")

  const totalt = kr((Number(order.total) || 0) * grossFactor)
  const moms = kr(Number(order.tax_total) > 0 ? Number(order.tax_total) : (Number(order.total) || 0) * 0.25)

  return `<!DOCTYPE html>
<html lang="sv">
<head>
<meta charset="UTF-8" />
<title>Följesedel – Order #${esc(displayId)} – Teknikhouse.se</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
  :root {
    --ink: #1a1a1a;
    --muted: #6b7280;
    --border: #e2e2e2;
    --brand-dark: #14161a;
    --brand-accent: #2563eb;
    --bg-soft: #f7f7f8;
  }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    color: var(--ink);
    font-size: 13px;
    line-height: 1.5;
    background: #fff;
  }
  .sheet { max-width: 800px; margin: 0 auto; padding: 0 0 40px; }
  .header {
    background: var(--brand-dark); color: #fff; padding: 28px 36px;
    display: flex; justify-content: space-between; align-items: flex-start;
  }
  .brand { display: flex; flex-direction: column; gap: 2px; }
  .brand-name { font-size: 22px; font-weight: 700; letter-spacing: 0.3px; }
  .brand-name .dot { color: var(--brand-accent); }
  .brand-sub { font-size: 11px; color: #b7bac2; letter-spacing: 0.5px; text-transform: uppercase; }
  .doc-title { text-align: right; }
  .doc-title h1 { margin: 0; font-size: 20px; font-weight: 700; }
  .doc-title .order-nr { margin-top: 4px; font-size: 13px; color: #d3d5db; }
  .body-pad { padding: 28px 36px 0; }
  .info-grid { display: grid; grid-template-columns: 1.3fr 1fr; gap: 24px; margin-bottom: 26px; }
  .box { border: 1px solid var(--border); border-radius: 6px; padding: 14px 16px; background: var(--bg-soft); }
  .box h2 {
    margin: 0 0 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.6px;
    color: var(--muted); font-weight: 700; border-bottom: 1px solid var(--border); padding-bottom: 6px;
  }
  .box p { margin: 0 0 2px; }
  .box .gap { height: 8px; }
  .meta-list { display: flex; flex-direction: column; gap: 10px; }
  .meta-row { display: flex; justify-content: space-between; gap: 10px; }
  .meta-row .label { color: var(--muted); }
  .meta-row .value { font-weight: 600; text-align: right; }
  table.items { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
  table.items thead th {
    text-align: left; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.5px;
    color: var(--muted); border-bottom: 2px solid var(--brand-dark); padding: 8px 6px;
  }
  table.items tbody td { padding: 9px 6px; border-bottom: 1px solid var(--border); vertical-align: top; }
  table.items .col-sku { width: 15%; color: var(--muted); font-variant-numeric: tabular-nums; }
  table.items .col-vara { width: 50%; }
  table.items .col-antal { width: 15%; text-align: right; white-space: nowrap; }
  table.items .col-summa { width: 20%; text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
  table.items .muted { color: var(--muted); font-size: 12px; }
  .totals { display: flex; justify-content: flex-end; margin-bottom: 30px; }
  .totals table { border-collapse: collapse; min-width: 260px; }
  .totals td { padding: 5px 4px; }
  .totals .tot-label { color: var(--muted); text-align: left; }
  .totals .tot-value { text-align: right; font-variant-numeric: tabular-nums; }
  .totals tr.grand td { border-top: 2px solid var(--brand-dark); font-weight: 700; font-size: 15px; padding-top: 8px; }
  .legal { border-top: 1px dashed var(--border); padding-top: 16px; margin-bottom: 24px; font-size: 11px; color: var(--muted); line-height: 1.6; }
  .legal h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--ink); margin: 0 0 6px; }
  .footer { text-align: center; padding: 20px 36px 0; border-top: 1px solid var(--border); }
  .footer .thanks { font-size: 16px; font-weight: 700; margin-bottom: 10px; color: var(--brand-dark); }
  .footer .links { font-size: 11px; color: var(--muted); }
  .footer .links a { color: var(--brand-accent); text-decoration: none; margin: 0 8px; }
  .footer .tiny { margin-top: 14px; font-size: 10px; color: #a3a3a3; }
  .print-bar { max-width: 800px; margin: 16px auto; text-align: right; padding: 0 36px; }
  .print-bar button { background: var(--brand-dark); color: #fff; border: none; border-radius: 6px; padding: 8px 16px; font-size: 13px; cursor: pointer; }
  @page { size: A4; margin: 14mm 12mm; }
  @media print {
    .print-bar { display: none; }
    .header { background: var(--brand-dark) !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .box { background: var(--bg-soft) !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { font-size: 12px; }
    .sheet { max-width: 100%; }
  }
</style>
</head>
<body>
  <div class="print-bar">
    <button onclick="window.print()">Skriv ut</button>
  </div>
  <div class="sheet">
    <div class="header">
      <div class="brand">
        <div class="brand-name">TEKNIKHOUSE<span class="dot">.</span>SE</div>
        <div class="brand-sub">Följesedel</div>
      </div>
      <div class="doc-title">
        <h1>Följesedel</h1>
        <div class="order-nr">Order #${esc(orderNr)}</div>
      </div>
    </div>
    <div class="body-pad">
      <div class="info-grid">
        <div class="box">
          <h2>Beställare</h2>
          <p>${esc(namn)}</p>
          ${address1 ? `<p>${esc(address1)}</p>` : ""}
          ${address2 ? `<p>${esc(address2)}</p>` : ""}
          <p>${esc(postalCity)}</p>
          <p>${esc(landNamn)}</p>
          <div class="gap"></div>
          <p>${esc(order.email || "")}</p>
          ${phone ? `<p>Telefon: ${esc(phone)}</p>` : ""}
          ${mobile ? `<p>Mobiltelefon: ${esc(mobile)}</p>` : ""}
        </div>
        <div class="box">
          <h2>Orderinformation</h2>
          <div class="meta-list">
            <div class="meta-row">
              <span class="label">Leveransmetod</span>
              <span class="value">${esc(shippingMethod)}</span>
            </div>
            <p class="muted" style="margin:-4px 0 0; font-size:11px; color:var(--muted); text-align:right;">
              ${esc(shipDesc)}
            </p>
            <div class="meta-row">
              <span class="label">Betalningstyp</span>
              <span class="value">${esc(betalningstyp)}</span>
            </div>
            <div class="meta-row">
              <span class="label">Inkom</span>
              <span class="value">${esc(inkom)}</span>
            </div>
            <div class="meta-row">
              <span class="label">Order ID</span>
              <span class="value">${esc(displayId)}</span>
            </div>
          </div>
        </div>
      </div>
      <table class="items">
        <thead>
          <tr>
            <th class="col-sku">Artikelnr</th>
            <th class="col-vara">Vara</th>
            <th class="col-antal">Antal</th>
            <th class="col-summa">Summa</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows || `<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:16px;">Inga rader hittades</td></tr>`}
        </tbody>
      </table>
      <div class="totals">
        <table>
          <tr>
            <td class="tot-label">Varav moms (25%)</td>
            <td class="tot-value">${moms}</td>
          </tr>
          <tr class="grand">
            <td class="tot-label">Totalt</td>
            <td class="tot-value">${totalt}</td>
          </tr>
        </table>
      </div>
      <div class="legal">
        <h3>Ångerrätt</h3>
        <p>
          Enligt Distans- och hemförsäljningslagen har Du som konsument (gäller ej företag) rätt att
          frånträda avtalet genom att meddela oss detta inom 14 dagar från mottagandet av varan.
          För att Du skall kunna nyttja din ångerrätt måste Du returnera varan i oskadat skick,
          i originalförpackning. Vid nyttjande av ångerrätten är det Du som står för returkostnaden.
        </p>
      </div>
    </div>
    <div class="footer">
      <div class="thanks">Tack för ditt köp!</div>
      <div class="links">
        <a href="https://teknikhouse.se/kundtjanst">Kundtjänst</a>
        <a href="https://teknikhouse.se/kopvillkor">Köpvillkor</a>
        <a href="https://teknikhouse.se/oppet-kop-retur">Öppet köp &amp; Retur</a>
        <a href="https://teknikhouse.se/anmal-retur">Anmäl retur</a>
      </div>
      <div class="tiny">Teknikhouse.se &middot; Nordic Teknik House AB</div>
    </div>
  </div>
  <script>
    window.addEventListener("load", function () {
      setTimeout(function () { try { window.print(); } catch (e) {} }, 400);
    });
  </script>
</body>
</html>`
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const id = String((req.query as any).id || (req.query as any).order || "")

  if (!id) {
    res.status(400).send("Saknar parameter: ?id={orderId}")
    return
  }

  try {
    const order = await loadOrder(req.scope, id)
    const html = renderFoljesedel(order)
    res.setHeader("Content-Type", "text/html; charset=utf-8")
    res.status(200).send(html)
  } catch (e: any) {
    res.status(404).send(`
      <!DOCTYPE html><html lang="sv"><head><meta charset="UTF-8"><title>Order hittades inte</title></head>
      <body style="font-family:sans-serif;padding:40px;text-align:center;color:#333;">
        <h1>Ordern kunde inte hittas</h1>
        <p>Kontrollera att order-ID:t är korrekt.</p>
      </body></html>
    `)
  }
}
