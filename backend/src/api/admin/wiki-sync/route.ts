import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { updateProductsWorkflow, updateProductVariantsWorkflow } from "@medusajs/medusa/core-flows"

/**
 * Apply raw Wiki product data (wiki_product_raw, filled by /store/wiki-bridge) onto
 * existing Medusa products, matched by SKU. Writes every Wiki field into the metadata
 * keys our Wiki-style product form already reads, plus title, Google name, status,
 * price (incl. active campaign), EAN, weight and stock.
 * Categories are NOT changed here (product URL = deepest category): Wiki categories
 * are stored in metadata.wiki_categories for reference.
 *
 * GET  /admin/wiki-sync                 -> counts + dry-run sample diff
 * POST /admin/wiki-sync {offset,limit,apply:boolean} -> process a slice
 */

const q = (scope: any) => scope.resolve(ContainerRegistrationKeys.QUERY)
const num = (v: any) => { const n = Number(String(v ?? "").replace(/\s/g, "").replace(",", ".")); return isFinite(n) ? n : 0 }
const str = (v: any) => (v == null ? "" : String(v)).trim()

const SALE_LIST_TITLE = "Kampanjpriser (import)"

// Rea-pris: lägg/uppdatera/ta bort variantens pris i kampanjprislistan (typ "sale").
async function syncSalePrice(scope: any, productId: string, amount: number) {
  try {
    const pricing: any = scope.resolve(Modules.PRICING)
    const { data } = await q(scope).graph({
      entity: "product",
      fields: ["variants.id", "variants.price_set.id"],
      filters: { id: productId },
    })
    const psId = data && data[0] && data[0].variants && data[0].variants[0] && data[0].variants[0].price_set && data[0].variants[0].price_set.id
    if (!psId) return
    const lists = await pricing.listPriceLists({}, { take: 100 })
    const pl = (lists || []).find((x: any) => x.title === SALE_LIST_TITLE) || (lists || []).find((x: any) => x.type === "sale")
    if (!pl) return
    const existing = await pricing.listPrices({ price_list_id: pl.id, price_set_id: psId })
    if (amount > 0) {
      if (existing && existing.length) {
        await pricing.updatePriceListPrices([{ price_list_id: pl.id, prices: [{ id: existing[0].id, price_set_id: psId, amount, currency_code: "sek" }] }])
        if (existing.length > 1) await pricing.removePrices(existing.slice(1).map((p: any) => p.id))
      } else {
        await pricing.addPriceListPrices([{ price_list_id: pl.id, prices: [{ price_set_id: psId, amount, currency_code: "sek" }] }])
      }
    } else if (existing && existing.length) {
      await pricing.removePrices(existing.map((p: any) => p.id))
    }
  } catch {}
}

function todayInRange(start: string, end: string) {
  const t = new Date().toISOString().slice(0, 10)
  if (start && start > t) return false
  if (end && end < t) return false
  return true
}

function mapWiki(w: any) {
  const pris = Math.round(num(w.prisSEK))
  const kpris = Math.round(num(w.kampanjprisSEK))
  const kStart = str(w.kampanjdatum1), kEnd = str(w.kampanjdatum2)
  const kampanj = !!str(w.kampanjactive) && kpris > 0 && todayInRange(kStart, kEnd)
  const antal = Math.round(num(w.antal))
  const oandligt = !!str(w.antal_inf)
  const best = !!str(w.bestallningsvara)
  const dold = str(w.dold) || "1"
  const visning = dold === "3" ? "hide_full" : dold === "2" ? "hide_shop" : "show"
  // hide_shop = "Dölj i butiken men inte för sökmotorer (går ej att köpa)": not buyable;
  // Wiki's real count stays in metadata.antal.
  // Both Wiki hide modes stay hidden in the shop (matches the original import: 560 drafts).
  const status = visning === "show" ? "published" : "draft"
  const buyable = visning !== "hide_shop"
  const supplier = str(w.supplierID__text)
  const images: any[] = []
  const n = Math.round(num(w.numimages))
  for (let i = 1; i <= Math.max(n, 12); i++) {
    const f = str(w["bildfilnamn" + i]); if (!f) continue
    images.push({ file: f, alt: str(w["bildalt" + i + "sv"]), wiki_image_id: str(w["bildid" + i]) })
  }
  const metadata: any = {
    wiki_id: w.__wiki_id || null,
    skick: str(w.conditionID__text) || "Nyskick",
    momssats: str(w.momssats) || "25",
    inpris: str(w.inpris),
    leverantor: supplier && supplier !== "Välj..." ? supplier : "",
    tillverkare: str(w.tillverkare), producer: str(w.tillverkare),
    modell: str(w.modell),
    lagerplats: str(w.stockPlace),
    sokord: str(w.searchWords),
    google_namn: str(w.googleShoppingTitle_sv),
    html_falt: str(w.htmlfilm),
    seo_title: str(w.metaTitle_sv), meta_title: str(w.metaTitle_sv),
    seo_desc: str(w.metaDescription_sv), meta_description: str(w.metaDescription_sv),
    h1: str(w.h1_sv),
    visning,
    kampanj, kampanjpris: kampanj ? String(kpris) : "", kampanj_start: kStart, kampanj_slut: kEnd,
    wiki_kampanjpris: kpris ? String(kpris) : "", wiki_kampanj_aktiv: !!str(w.kampanjactive),
    ordinarie_pris: kampanj ? String(pris) : "",
    antal: String(antal), stock: antal, in_stock: oandligt || best || antal > 0,
    oandligt, lagervarning: str(w.lagergrans),
    skrymmande: !!str(w.skrymmande), bestallningsvara: best,
    empty_stock_text: str(w.emptyStockText_sv), custom_text: str(w.customText_sv),
    wiki_categories: (w.categories || []).map((c: any) => ({ id: String(c.id), name: str(c.name) })),
    wiki_images: images,
    wiki_synced_at: new Date().toISOString(),
  }
  if (!buyable) metadata.in_stock = false
  return {
    title: str(w.title_sv), subtitle: str(w.googleShoppingTitle_sv), status,
    price: pris, /* baspris = ordinarie pris; kampanj -> rea-prislistan (syncSalePrice) */ ean: str(w.ean), weight: Math.round(num(w.vikt)) || null,
    antal: buyable ? antal : 0, oandligt: buyable ? oandligt : false, best: buyable ? best : false,
    metadata, description: str(w.description_sv),
  }
}

async function loadRaw(pg: any, offset: number, limit: number) {
  const r = await pg.raw(`SELECT "sku","data" FROM "wiki_product_raw" ORDER BY "sku" OFFSET ? LIMIT ?`, [offset, limit])
  return r.rows as any[]
}

async function findBySkus(scope: any, skus: string[]) {
  const { data } = await q(scope).graph({
    entity: "product_variant",
    fields: ["id", "sku", "barcode", "weight", "product_id", "product.id", "product.title", "product.status",
      "product.subtitle", "product.description", "product.metadata", "prices.amount", "prices.currency_code",
      "inventory_items.inventory_item_id"],
    filters: { sku: skus },
    pagination: { take: skus.length + 10 },
  })
  const m = new Map<string, any>()
  for (const v of data || []) if (v.sku) m.set(v.sku, v)
  return m
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  let total = 0
  try { total = (await pg.raw(`SELECT count(*)::int AS n FROM "wiki_product_raw"`)).rows[0].n } catch { return res.json({ total: 0 }) }
  const sku = String((req.query as any).sku || "")
  if (sku) {
    const r = await pg.raw(`SELECT "data" FROM "wiki_product_raw" WHERE "sku"=?`, [sku])
    if (!r.rows[0]) return res.status(404).json({ error: "saknas" })
    const mapped = mapWiki(r.rows[0].data)
    const cur = (await findBySkus(req.scope, [sku])).get(sku) || null
    return res.json({ mapped, current: cur })
  }
  res.json({ total })
}

// Kopiera en bild från gamla Wiki (teknikhouse.se/images/zoom|normal) till vår fillagring.
async function rehostWikiImage(fileModule: any, file: string): Promise<string | null> {
  const clean = String(file || "").split("/").pop() || ""
  if (!/^[A-Za-z0-9._-]+$/.test(clean)) return null
  let buf: Buffer | null = null
  for (const dir of ["images/zoom/", "images/normal/", "images/"]) {
    try {
      const r = await fetch("https://teknikhouse.se/" + dir + clean)
      const ct = String(r.headers.get("content-type") || "")
      if (r.ok && ct.startsWith("image/")) { buf = Buffer.from(await r.arrayBuffer()); break }
    } catch {}
  }
  if (!buf || !buf.length) return null
  const low = clean.toLowerCase()
  const mimeType = low.endsWith(".png") ? "image/png" : low.endsWith(".webp") ? "image/webp" : low.endsWith(".gif") ? "image/gif" : "image/jpeg"
  for (const mode of ["binary", "base64"]) {
    const content = mode === "base64" ? buf.toString("base64") : buf.toString("binary")
    const out = await fileModule.createFiles([{ filename: clean, mimeType, content }])
    const f = Array.isArray(out) ? out[0] : out
    if (!f || !f.url) continue
    try {
      const chk = await fetch(f.url)
      const len = (await chk.arrayBuffer()).byteLength
      if (len === buf.length) return f.url
    } catch {}
  }
  return null
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const bb: any = req.body || {}
  if (bb.action === "rehost_path") {
    // Kopiera valfri fil från gamla Wiki (t.ex. CKFinder userfiles/image/...) till vår fillagring.
    const fileModule: any = req.scope.resolve(Modules.FILE)
    const paths: string[] = Array.isArray(bb.paths) ? bb.paths.slice(0, 10) : []
    const out: any[] = []
    for (const raw of paths) {
      let url: string | null = null, size = 0, error = ""
      try {
        const p = String(raw || "").replace(/^\/+/, "")
        if (!/^userfiles\//.test(p) || p.includes("..")) throw new Error("ogiltig sökväg")
        const src = "https://teknikhouse.se/" + p.split("/").map((x) => encodeURIComponent(decodeURIComponent(x))).join("/")
        const r = await fetch(src)
        if (!r.ok) throw new Error("wiki " + r.status)
        const buf = Buffer.from(await r.arrayBuffer())
        size = buf.length
        const name = (p.split("/").pop() || "fil").replace(/[^A-Za-z0-9._-]/g, "-")
        const mimeType = String(r.headers.get("content-type") || "application/octet-stream").split(";")[0]
        for (const mode of ["binary", "base64"]) {
          const content = mode === "base64" ? buf.toString("base64") : buf.toString("binary")
          const created = await fileModule.createFiles([{ filename: name, mimeType, content }])
          const f = Array.isArray(created) ? created[0] : created
          if (!f || !f.url) continue
          try {
            const chk = await fetch(f.url)
            if ((await chk.arrayBuffer()).byteLength === buf.length) { url = f.url; break }
          } catch {}
        }
        if (!url) error = "uppladdning kunde inte verifieras"
      } catch (e: any) { error = String(e && e.message || e).slice(0, 120) }
      out.push({ path: raw, url, size, error })
    }
    return res.json({ ok: true, files: out })
  }
  if (bb.action === "rehost") {
    const fileModule: any = req.scope.resolve(Modules.FILE)
    const files: string[] = Array.isArray(bb.files) ? bb.files.slice(0, 12) : []
    const out: any[] = []
    for (const f of files) out.push({ file: f, url: await rehostWikiImage(fileModule, f) })
    return res.json({ ok: true, images: out })
  }
  const b: any = req.body || {}
  const offset = Math.max(0, Number(b.offset) || 0)
  const limit = Math.min(100, Math.max(1, Number(b.limit) || 25))
  const apply = b.apply === true
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const rows = await loadRaw(pg, offset, limit)
  const found = await findBySkus(req.scope, rows.map((r) => r.sku))
  const inv: any = req.scope.resolve(Modules.INVENTORY)
  let locId: string | null = null
  try { const { data } = await q(req.scope).graph({ entity: "stock_location", fields: ["id"], pagination: { take: 1 } }); locId = data && data[0] && data[0].id } catch {}

  const out: any = { offset, limit, rows: rows.length, apply, updated: 0, missing: [] as string[], errors: [] as any[], changes: { status: 0, price: 0, stock: 0, title: 0 } }
  for (const r of rows) {
    const v = found.get(r.sku)
    if (!v) { out.missing.push(r.sku); continue }
    const m = mapWiki(r.data)
    const p = v.product || {}
    const sek = (v.prices || []).find((x: any) => String(x.currency_code).toLowerCase() === "sek")
    if (p.status !== m.status) out.changes.status++
    if (!sek || Number(sek.amount) !== m.price) out.changes.price++
    if (m.title && p.title !== m.title) out.changes.title++
    if (!apply) continue
    try {
      const productUpdate: any = {
        id: v.product_id,
        status: m.status,
        subtitle: m.subtitle || null,
        metadata: Object.assign({}, p.metadata || {}, m.metadata),
      }
      if (m.title) productUpdate.title = m.title
      if (m.weight) productUpdate.weight = m.weight
      if (!str(p.description) && m.description) productUpdate.description = m.description
      await updateProductsWorkflow(req.scope).run({ input: { products: [productUpdate] } })

      const variantUpdate: any = {
        id: v.id,
        // NOTE: never touch manage_inventory/allow_backorder here. The storefront keeps
        // manage_inventory=false and reads stock from product.metadata (in_stock/stock).
        metadata: { inpris: m.metadata.inpris, momssats: m.metadata.momssats, ean: m.ean },
      }
      if (m.ean) variantUpdate.barcode = m.ean
      if (m.weight) variantUpdate.weight = m.weight
      if (m.price > 0) variantUpdate.prices = [{ amount: m.price, currency_code: "sek" }]
      try {
        await updateProductVariantsWorkflow(req.scope).run({ input: { product_variants: [variantUpdate] } })
      } catch (err: any) {
        // Wiki has some duplicate EANs across products; Medusa requires unique barcodes.
        // Keep the EAN in metadata only and still apply price/weight.
        if (variantUpdate.barcode && /barcode/i.test(String(err && err.message))) {
          delete variantUpdate.barcode
          out.ean_dupes = (out.ean_dupes || 0) + 1
          await updateProductVariantsWorkflow(req.scope).run({ input: { product_variants: [variantUpdate] } })
        } else {
          throw err
        }
      }

      const iid = v.inventory_items && v.inventory_items[0] && v.inventory_items[0].inventory_item_id
      if (false && iid && locId && !m.oandligt) {
        const levels = await inv.listInventoryLevels({ inventory_item_id: iid, location_id: locId })
        if (levels && levels.length) {
          if (Number(levels[0].stocked_quantity) !== m.antal) out.changes.stock++
          await inv.updateInventoryLevels([{ inventory_item_id: iid, location_id: locId, stocked_quantity: m.antal }])
        } else {
          out.changes.stock++
          await inv.createInventoryLevels([{ inventory_item_id: iid, location_id: locId, stocked_quantity: m.antal }])
        }
      }
      await syncSalePrice(req.scope, v.product_id, m.metadata.kampanj ? Number(m.metadata.kampanjpris) || 0 : 0)
      await pg.raw(`UPDATE "wiki_product_raw" SET "applied_at"=now() WHERE "sku"=?`, [r.sku])
      out.updated++
    } catch (e: any) {
      out.errors.push({ sku: r.sku, error: String(e && e.message || e).slice(0, 200) })
    }
  }
  res.json(out)
}
