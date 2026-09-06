import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { getPg, getSettings } from "../admin/google-feed/db"

function esc(s: any) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&apos;")
}

async function fetchProducts(query: any) {
  const base = [
    "id", "title", "subtitle", "description", "handle", "status", "thumbnail",
    "images.url", "variants.sku", "variants.barcode",
  ]
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
    } catch (e2) {
      return []
    }
  }
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const pg = getPg(req.scope)
  const settings = await getSettings(pg)
  const mode = settings.feed_mode
  const universal = settings.universal_category
  const storefront = (process.env.STOREFRONT_URL || "https://teknikhouse.se").replace(/\/$/, "")

  let products: any[] = []
  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    products = await fetchProducts(query)
  } catch (e) { products = [] }

  const items: string[] = []
  for (const p of products) {
    const cat = universal
    if (mode === 0 && !cat) continue
    const v = (p.variants && p.variants[0]) || {}
    const prices = v.prices || []
    const priceObj = prices.find((x: any) => (x.currency_code || "").toLowerCase() === "sek") || prices[0]
    const price = priceObj && priceObj.amount != null ? `${Number(priceObj.amount).toFixed(2)} SEK` : ""
    const img = p.thumbnail || (p.images && p.images[0] && p.images[0].url) || ""
    const link = `${storefront}/products/${p.handle || p.id}`
    const desc = String(p.description || p.subtitle || p.title || "").replace(/\s+/g, " ").trim().slice(0, 4900)
    items.push(
      "<item>" +
      `<g:id>${esc(v.sku || p.id)}</g:id>` +
      `<g:title>${esc(p.title)}</g:title>` +
      `<g:description>${esc(desc)}</g:description>` +
      `<g:link>${esc(link)}</g:link>` +
      (img ? `<g:image_link>${esc(img)}</g:image_link>` : "") +
      "<g:availability>in_stock</g:availability>" +
      (price ? `<g:price>${esc(price)}</g:price>` : "") +
      (v.barcode ? `<g:gtin>${esc(v.barcode)}</g:gtin>` : "") +
      (cat ? `<g:google_product_category>${esc(cat)}</g:google_product_category>` : "") +
      "<g:condition>new</g:condition>" +
      "</item>"
    )
  }

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n' +
    "<channel>\n" +
    "<title>Teknikhouse.se Produktfeed</title>\n" +
    `<link>${esc(storefront)}</link>\n` +
    "<description>Google Shopping produktfeed</description>\n" +
    items.join("\n") +
    "\n</channel>\n</rss>\n"

  res.setHeader("Content-Type", "application/xml; charset=utf-8")
  res.send(xml)
}
