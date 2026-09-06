import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

function esc(s: any) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&apos;")
}

async function fetchProducts(query: any) {
  const base = ["id", "status", "variants.sku", "variants.barcode"]
  try {
    const { data } = await query.graph({
      entity: "product",
      fields: [...base, "variants.prices.amount", "variants.prices.currency_code"],
      filters: { status: "published" },
      pagination: { take: 10000, skip: 0 },
    })
    return data || []
  } catch (e) {
    try {
      const { data } = await query.graph({
        entity: "product",
        fields: base,
        filters: { status: "published" },
        pagination: { take: 10000, skip: 0 },
      })
      return data || []
    } catch (e2) { return [] }
  }
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  let products: any[] = []
  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    products = await fetchProducts(query)
  } catch (e) { products = [] }

  const items: string[] = []
  for (const p of products) {
    const v = (p.variants && p.variants[0]) || {}
    const prices = v.prices || []
    const priceObj = prices.find((x: any) => (x.currency_code || "").toLowerCase() === "sek") || prices[0]
    const price = priceObj && priceObj.amount != null ? `${Number(priceObj.amount).toFixed(2)} SEK` : ""
    items.push(
      "<item>" +
      `<g:id>${esc(v.sku || p.id)}</g:id>` +
      "<g:availability>in_stock</g:availability>" +
      (price ? `<g:price>${esc(price)}</g:price>` : "") +
      "</item>"
    )
  }

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n' +
    "<channel>\n" +
    "<title>Teknikhouse.se Lageruppdatering</title>\n" +
    "<description>Google Shopping lager/pris-feed</description>\n" +
    items.join("\n") +
    "\n</channel>\n</rss>\n"

  res.setHeader("Content-Type", "application/xml; charset=utf-8")
  res.send(xml)
}
