import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, QueryContext } from "@medusajs/framework/utils"

let CACHE: { xml: string | null; at: number } = { xml: null, at: 0 }

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const fresh = req.query.fresh !== undefined
  const previewLimit = req.query.limit ? parseInt(String(req.query.limit)) : 0
  if (!fresh && !previewLimit && CACHE.xml && Date.now() - CACHE.at < 3600000) {
    res.setHeader("Content-Type", "application/xml; charset=utf-8")
    res.setHeader("Cache-Control", "public, max-age=3600")
    return res.status(200).send(CACHE.xml)
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const DOMAIN = (process.env.GOOGLE_FEED_DOMAIN || "https://teknikhouse.se").replace(/\/$/, "")

  const esc = (s: any) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;")
  const strip = (s: any) => String(s == null ? "" : s).replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/\s+/g, " ").trim()
  const money = (n: any) => Number(n).toFixed(2) + " SEK"
  const catFor = (title: string) => {
    const t = (title || "").toLowerCase()
    if (/hörlur|headphone|earphone|earbud|headset/.test(t)) return "Electronics > Audio > Audio Components > Headphones"
    if (/högtalare|speaker|soundbar/.test(t)) return "Electronics > Audio > Audio Components > Speakers"
    if (/laddare|kabel|charger|cable|powerbank|adapter|nätdel/.test(t)) return "Electronics > Electronics Accessories > Power > Battery Chargers"
    if (/surfplatta|tablet|ipad(?!\s*mini)/.test(t)) return "Electronics > Computers > Tablet Computers"
    if (/smartphone|mobiltelefon/.test(t)) return "Electronics > Communications > Telephony > Mobile Phones"
    return "Electronics > Communications > Telephony > Mobile Phone Accessories"
  }

  const regionRes = await query.graph({ entity: "region", fields: ["id", "currency_code"] })
  const regions = regionRes.data || []
  const se = regions.find((r: any) => r.currency_code === "sek") || regions[0]
  const regionId = se && se.id

  const items: string[] = []
  let skip = 0
  const take = 200
  for (;;) {
    let products: any[] = []
    try {
      const r = await query.graph({
        entity: "product",
        fields: ["id", "title", "handle", "description", "subtitle", "status", "metadata", "images.url", "categories.name", "variants.id", "variants.sku", "variants.ean", "variants.barcode", "variants.upc", "variants.manage_inventory", "variants.calculated_price.*"],
        filters: { status: "published" },
        context: { variants: { calculated_price: QueryContext({ region_id: regionId, currency_code: "sek" }) } },
        pagination: { skip, take },
      })
      products = r.data || []
    } catch (e) {
      break
    }
    if (!products.length) break
    for (const p of products) {
      const v = (p.variants || [])[0]
      if (!v) continue
      const cp: any = v.calculated_price
      const orig = cp && (cp.original_amount != null ? cp.original_amount : cp.calculated_amount)
      const calc = cp && cp.calculated_amount
      if (orig == null) continue
      const imgs = (p.images || []).map((i: any) => i.url).filter(Boolean)
      if (!imgs.length) continue
      const meta: any = p.metadata || {}
      const brand = meta.producer || meta.tillverkare || meta.brand || "Teknikhouse"
      const gtinRaw = String(v.ean || v.barcode || v.upc || meta.ean || meta.gtin || "").replace(/\D/g, "")
      const gtin = /^\d{8}$|^\d{12,14}$/.test(gtinRaw) ? gtinRaw : ""
      const mpn = String(meta.mpn || meta.artnr || v.sku || "")
      const sk = String(meta.skick || meta.condition || "")
      const condition = /begagn|used/i.test(sk) ? "used" : (/refurb|renov/i.test(sk) ? "refurbished" : "new")
      const inStock = !(meta.in_stock === false || String(meta.stock) === "0")
      const cats = (p.categories || []).map((c: any) => c.name).filter(Boolean)
      const link = DOMAIN + "/products/" + p.handle
      const desc = strip(p.description || meta.meta_description || p.subtitle || p.title).slice(0, 4900)
      const onSale = calc != null && calc < orig
      let it = "<item>"
      it += "<g:id>" + esc(v.sku || v.id) + "</g:id>"
      if ((p.variants || []).length > 1) it += "<g:item_group_id>" + esc(p.id) + "</g:item_group_id>"
      it += "<g:title>" + esc(String(p.title || "").slice(0, 150)) + "</g:title>"
      it += "<g:description>" + esc(desc) + "</g:description>"
      it += "<g:link>" + esc(link) + "</g:link>"
      it += "<g:mobile_link>" + esc(link) + "</g:mobile_link>"
      it += "<g:image_link>" + esc(imgs[0]) + "</g:image_link>"
      imgs.slice(1, 11).forEach((u: string) => { it += "<g:additional_image_link>" + esc(u) + "</g:additional_image_link>" })
      it += "<g:availability>" + (inStock ? "in_stock" : "out_of_stock") + "</g:availability>"
      it += "<g:price>" + money(orig) + "</g:price>"
      if (onSale) it += "<g:sale_price>" + money(calc) + "</g:sale_price>"
      it += "<g:brand>" + esc(String(brand).slice(0, 70)) + "</g:brand>"
      it += "<g:condition>" + condition + "</g:condition>"
      if (gtin) it += "<g:gtin>" + gtin + "</g:gtin>"
      if (mpn) it += "<g:mpn>" + esc(mpn.slice(0, 70)) + "</g:mpn>"
      if (!gtin && !mpn) it += "<g:identifier_exists>no</g:identifier_exists>"
      it += "<g:google_product_category>" + esc(catFor(p.title)) + "</g:google_product_category>"
      if (cats.length) it += "<g:product_type>" + esc(cats.slice(0, 3).join(" > ")) + "</g:product_type>"
      it += "<g:custom_label_0>" + esc(String(brand).slice(0, 100)) + "</g:custom_label_0>"
      it += "<g:custom_label_1>" + (onSale ? "REA" : "Ordinarie") + "</g:custom_label_1>"
      if (cats[0]) it += "<g:custom_label_2>" + esc(String(cats[0]).slice(0, 100)) + "</g:custom_label_2>"
      it += "</item>"
      items.push(it)
      if (previewLimit && items.length >= previewLimit) break
    }
    if (previewLimit && items.length >= previewLimit) break
    skip += take
    if (products.length < take) break
    if (skip > 20000) break
  }

  const now = new Date().toUTCString()
  const xml = '<?xml version="1.0" encoding="UTF-8"?>'
    + '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">'
    + '<channel>'
    + '<title>Teknikhouse.se – Produktflöde</title>'
    + '<link>' + esc(DOMAIN) + '</link>'
    + '<description>Google Shopping produktflöde för Teknikhouse.se</description>'
    + '<lastBuildDate>' + now + '</lastBuildDate>'
    + items.join("")
    + '</channel></rss>'

  if (!previewLimit) CACHE = { xml, at: Date.now() }
  res.setHeader("Content-Type", "application/xml; charset=utf-8")
  res.setHeader("Cache-Control", "public, max-age=3600")
  res.status(200).send(xml)
}
