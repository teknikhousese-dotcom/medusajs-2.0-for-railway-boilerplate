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
  const SITE = DOMAIN.replace(/^(https?:\/\/)www\./i, "$1")
  const SHIPPING = process.env.GOOGLE_FEED_SHIPPING || ""

  const esc = (s: any) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;")
  const ENT: any = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", auml: "ä", Auml: "Ä", ouml: "ö", Ouml: "Ö", aring: "å", Aring: "Å", eacute: "é", Eacute: "É", egrave: "è", uuml: "ü", Uuml: "Ü", oslash: "ø", Oslash: "Ø", aelig: "æ", AElig: "Æ", bull: "•", middot: "·", ndash: "–", mdash: "—", hellip: "…", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", laquo: "«", raquo: "»", deg: "°", times: "×", plusmn: "±", copy: "©", reg: "®", trade: "™", euro: "€", sup2: "²", sup3: "³", frac12: "½", micro: "µ", shy: "" }
  const decodeOnce = (s: string) => s.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);/gi, (m: string, e: string) => { if (e.charAt(0) === "#") { const n = e.charAt(1).toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); return Number.isFinite(n) && n > 0 && n < 1114112 ? String.fromCodePoint(n) : m } return ENT[e] != null ? ENT[e] : m })
  const decodeEnt = (s: string) => { let out = s; for (let i = 0; i < 3; i++) { const next = decodeOnce(out); if (next === out) break; out = next } return out }
  const strip = (s: any) => decodeEnt(String(s == null ? "" : s).replace(/<[^>]*>/g, " ")).replace(/<[^>]*>/g, " ").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").replace(/\s+/g, " ").trim()
  const money = (n: any) => Number(n).toFixed(2) + " SEK"
  const iso = (d: any) => { try { return new Date(d).toISOString().replace(/\.\d{3}Z$/, "+00:00") } catch (e) { return "" } }
  const catFor = (title: string) => {
    const t = (title || "").toLowerCase()
    if (/hörlur|headphone|earphone|earbud|headset/.test(t)) return "Electronics > Audio > Audio Components > Headphones"
    if (/högtalare|speaker|soundbar/.test(t)) return "Electronics > Audio > Audio Components > Speakers"
    if (/laddare|kabel|charger|cable|powerbank|adapter|nätdel/.test(t)) return "Electronics > Electronics Accessories > Power > Battery Chargers"
    if (/surfplatta|tablet|ipad(?!\s*mini)/.test(t)) return "Electronics > Computers > Tablet Computers"
    if (/smartphone|mobiltelefon/.test(t)) return "Electronics > Communications > Telephony > Mobile Phones"
    return "Electronics > Communications > Telephony > Mobile Phone Accessories"
  }
  const COLORS: any[] = [["svart", "Svart"], ["vit", "Vit"], ["blå", "Blå"], ["röd", "Röd"], ["grön", "Grön"], ["guld", "Guld"], ["silver", "Silver"], ["rosa", "Rosa"], ["lila", "Lila"], ["grå", "Grå"], ["gul", "Gul"], ["orange", "Orange"], ["brun", "Brun"], ["turkos", "Turkos"], ["roséguld", "Roséguld"], ["rose gold", "Roséguld"], ["space gray", "Rymdgrå"], ["gold", "Guld"], ["black", "Svart"], ["white", "Vit"], ["blue", "Blå"], ["red", "Röd"], ["green", "Grön"], ["pink", "Rosa"], ["gray", "Grå"], ["grey", "Grå"]]
  const colorOf = (title: string) => { const t = (title || "").toLowerCase(); for (const c of COLORS) { if (t.includes(c[0])) return c[1] } return "" }

  const regionRes = await query.graph({ entity: "region", fields: ["id", "currency_code"] })
  const regions = regionRes.data || []
  const se = regions.find((r: any) => r.currency_code === "sek") || regions[0]
  const regionId = se && se.id

  let saleEffective = process.env.GOOGLE_FEED_SALE_EFFECTIVE || ""
  try {
    const plRes = await query.graph({ entity: "price_list", fields: ["id", "type", "status", "starts_at", "ends_at"] })
    const sale = (plRes.data || []).find((p: any) => p.type === "sale" && p.status === "active")
    if (sale && sale.starts_at && sale.ends_at) saleEffective = iso(sale.starts_at) + "/" + iso(sale.ends_at)
  } catch (e) {}

  const catPath = new Map<string, string>()
  try {
    const cr = await query.graph({ entity: "product_category", fields: ["id", "handle", "parent_category_id"], pagination: { skip: 0, take: 5000 } })
    const clist: any[] = cr.data || []
    const cById = new Map<string, any>(clist.map((c: any) => [c.id, c]))
    const cMemo = new Map<string, string>()
    const cSeg = (c: any): string => { const par = c.parent_category_id ? cById.get(c.parent_category_id) : null; return par && par.handle && c.handle ? String(c.handle).slice(String(par.handle).length + 1) : String(c.handle || "") }
    const cPath = (c: any, depth: number): string => { if (cMemo.has(c.id)) return cMemo.get(c.id) as string; const par = c.parent_category_id ? cById.get(c.parent_category_id) : null; const r = par && depth < 20 ? cPath(par, depth + 1) + "/" + cSeg(c) : cSeg(c); cMemo.set(c.id, r); return r }
    for (const c of clist) if (c.handle) catPath.set(c.handle, cPath(c, 0))
  } catch (e) {}

  const items: string[] = []
  let skip = 0
  const take = 200
  for (;;) {
    let products: any[] = []
    try {
      const r = await query.graph({
        entity: "product",
        fields: ["id", "title", "handle", "description", "subtitle", "status", "metadata", "images.url", "categories.name", "categories.handle", "variants.id", "variants.sku", "variants.ean", "variants.barcode", "variants.upc", "variants.weight", "variants.manage_inventory", "variants.inventory_quantity", "variants.calculated_price.*"],
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
      // Verklig lagerstatus: oändligt lager (manage_inventory=false) = alltid i lager,
      // annars riktigt saldo från Medusa (fallback metadata.antal).
      const oandligt = meta.oandligt === true || meta.oandligt === "true" || v.manage_inventory === false
      const realQty = Number(v.inventory_quantity)
      const metaQty = Number(meta.antal)
      const isv = meta.in_stock
      const inStock = (isv === false || isv === "false" || isv === 0 || isv === "0") ? false : ((isv === true || isv === "true" || isv === 1 || isv === "1") ? true : (meta.oandligt === true || meta.oandligt === "true" || (Number.isFinite(metaQty) ? metaQty > 0 : true)))
      const cats = (p.categories || []).map((c: any) => c.name).filter(Boolean)
      const pinPath = typeof meta.url_category === "string" ? catPath.get(meta.url_category) : undefined
      let bestPath = pinPath || ""
      if (!bestPath) for (const c of (p.categories || [])) { const cpp = c && c.handle ? catPath.get(c.handle) : undefined; if (cpp && cpp.length > bestPath.length) bestPath = cpp }
      const link = bestPath ? SITE + "/" + bestPath + "/" + p.handle : SITE + "/products/" + p.handle
      const desc = strip(p.description || meta.meta_description || p.subtitle || p.title).slice(0, 4900)
      const onSale = calc != null && calc < orig
      const color = String(meta.color || meta.farg || meta["färg"] || colorOf(p.title) || "").slice(0, 40)
      const weight = Number(v.weight || 0)
      let it = "<item>"
      it += "<g:id>" + esc(v.sku || v.id) + "</g:id>"
      if ((p.variants || []).length > 1) it += "<g:item_group_id>" + esc(p.id) + "</g:item_group_id>"
      const gTitle = String(p.subtitle || meta.google_namn || "").trim() || p.title
      it += "<g:title>" + esc(String(gTitle || "").slice(0, 150)) + "</g:title>"
      it += "<g:description>" + esc(desc) + "</g:description>"
      it += "<g:link>" + esc(link) + "</g:link>"
      it += "<g:mobile_link>" + esc(link) + "</g:mobile_link>"
      it += "<g:image_link>" + esc(imgs[0]) + "</g:image_link>"
      imgs.slice(1, 11).forEach((u: string) => { it += "<g:additional_image_link>" + esc(u) + "</g:additional_image_link>" })
      it += "<g:availability>" + (inStock ? "in_stock" : "out_of_stock") + "</g:availability>"
      it += "<g:price>" + money(orig) + "</g:price>"
      if (onSale) {
        it += "<g:sale_price>" + money(calc) + "</g:sale_price>"
        if (saleEffective) it += "<g:sale_price_effective_date>" + esc(saleEffective) + "</g:sale_price_effective_date>"
      }
      it += "<g:brand>" + esc(String(brand).slice(0, 70)) + "</g:brand>"
      it += "<g:condition>" + condition + "</g:condition>"
      if (gtin) it += "<g:gtin>" + gtin + "</g:gtin>"
      if (mpn) it += "<g:mpn>" + esc(mpn.slice(0, 70)) + "</g:mpn>"
      if (!gtin && !mpn) it += "<g:identifier_exists>no</g:identifier_exists>"
      if (color) it += "<g:color>" + esc(color) + "</g:color>"
      if (weight > 0) it += "<g:shipping_weight>" + weight + " g</g:shipping_weight>"
      if (SHIPPING) it += "<g:shipping><g:country>SE</g:country><g:price>" + esc(SHIPPING) + "</g:price></g:shipping>"
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
